from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional
from app.common.serializers import serialize_doc, serialize_list
from app.common.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.common.pagination import PaginationParams
from app.orders.schemas import OrderCreate, TrackingUpdate, OrderStatus


async def create_order(
    db: AsyncIOMotorDatabase, seller_id: str, data: OrderCreate
) -> dict:
    supplier = await db.suppliers.find_one({"_id": ObjectId(data.supplier_id)})
    if not supplier or supplier["seller_id"] != seller_id:
        raise BadRequestException("Supplier not found or does not belong to you")

    total_value = sum(item.quantity * item.price for item in data.items)
    now = datetime.now(timezone.utc)

    order_doc = {
        "seller_id": seller_id,
        "supplier_id": data.supplier_id,
        "shopee_order_id": data.shopee_order_id,
        "status": OrderStatus.PENDING.value,
        "tracking_code": None,
        "total_value": total_value,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)

    items_docs = [
        {
            "order_id": order_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price": item.price,
            "created_at": now,
        }
        for item in data.items
    ]
    await db.order_items.insert_many(items_docs)

    # Create billing record
    total_items = sum(item.quantity for item in data.items)
    from app.config import settings
    fee = total_items * settings.FEE_PER_ITEM
    await db.billing.insert_one({
        "seller_id": seller_id,
        "order_id": order_id,
        "fee_value": fee,
        "quantity_items": total_items,
        "status": "pending",
        "created_at": now,
    })

    order_doc["_id"] = result.inserted_id
    return serialize_doc(order_doc)


async def list_orders(
    db: AsyncIOMotorDatabase,
    seller_id: str,
    params: PaginationParams,
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
) -> dict:
    query = {"seller_id": seller_id}
    if status:
        query["status"] = status
    if supplier_id:
        query["supplier_id"] = supplier_id

    total = await db.orders.count_documents(query)
    cursor = (
        db.orders.find(query)
        .sort("created_at", -1)
        .skip(params.skip)
        .limit(params.limit)
    )
    items = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(items),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


async def get_order(
    db: AsyncIOMotorDatabase, order_id: str, seller_id: str
) -> dict:
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise NotFoundException("Order not found")
    if order["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    items_cursor = db.order_items.find({"order_id": order_id})
    items = await items_cursor.to_list(length=100)

    result = serialize_doc(order)
    result["items"] = serialize_list(items)
    return result


async def update_order_status(
    db: AsyncIOMotorDatabase,
    order_id: str,
    seller_id: str,
    new_status: OrderStatus,
    ws_manager=None,
) -> dict:
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise NotFoundException("Order not found")
    if order["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status.value, "updated_at": now}},
    )

    if ws_manager:
        import asyncio
        asyncio.create_task(
            ws_manager.broadcast_to_seller(
                seller_id,
                {
                    "event": "order_status_updated",
                    "order_id": order_id,
                    "status": new_status.value,
                },
            )
        )

    return await get_order(db, order_id, seller_id)


async def update_tracking(
    db: AsyncIOMotorDatabase,
    order_id: str,
    seller_id: str,
    data: TrackingUpdate,
    ws_manager=None,
) -> dict:
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise NotFoundException("Order not found")
    if order["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "tracking_code": data.tracking_code,
                "status": OrderStatus.SHIPPED.value,
                "updated_at": now,
            }
        },
    )

    if ws_manager:
        import asyncio
        asyncio.create_task(
            ws_manager.broadcast_to_seller(
                seller_id,
                {
                    "event": "tracking_updated",
                    "order_id": order_id,
                    "tracking_code": data.tracking_code,
                },
            )
        )

    return await get_order(db, order_id, seller_id)


async def get_supplier_orders(
    db: AsyncIOMotorDatabase,
    supplier_id: str,
    params: PaginationParams,
    status: Optional[str] = None,
) -> dict:
    query = {"supplier_id": supplier_id}
    if status:
        query["status"] = status

    total = await db.orders.count_documents(query)
    cursor = (
        db.orders.find(query)
        .sort("created_at", -1)
        .skip(params.skip)
        .limit(params.limit)
    )
    items = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(items),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }
