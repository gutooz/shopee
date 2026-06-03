from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.common.serializers import serialize_doc
from app.orders.schemas import OrderStatus
from app.config import settings
import structlog

logger = structlog.get_logger(__name__)


async def handle_order_created(db: AsyncIOMotorDatabase, payload: dict) -> dict:
    try:
        shop_id = payload.get("shop_id")
        data = payload.get("data", {})
        order_sn = data.get("ordersn")

        if not order_sn:
            return {"status": "skipped", "reason": "no order_sn"}

        seller_doc = await db.sellers.find_one({"shopee_shop_id": str(shop_id)})
        if not seller_doc:
            logger.warning("shopee_webhook.seller_not_found", shop_id=shop_id)
            return {"status": "skipped", "reason": "seller not found"}

        seller_id = str(seller_doc["_id"])

        existing = await db.orders.find_one({"shopee_order_id": order_sn})
        if existing:
            return {"status": "skipped", "reason": "order already exists"}

        # Fetch order details from Shopee
        from app.shopee.service import get_valid_token
        from app.shopee.client import ShopeeClient

        token_doc = await get_valid_token(db, seller_id)
        shopee_client = ShopeeClient(token_doc["shop_id"], token_doc["access_token"])
        order_detail_resp = await shopee_client.get_order_detail([order_sn])
        orders = order_detail_resp.get("response", {}).get("order_list", [])

        if not orders:
            return {"status": "error", "reason": "could not fetch order details"}

        order_detail = orders[0]
        items = order_detail.get("item_list", [])

        # Map items to products
        now = datetime.now(timezone.utc)
        supplier_id = None
        total_items = 0
        order_items = []

        for item in items:
            shopee_item_id = str(item.get("item_id", ""))
            product = await db.products.find_one({
                "shopee_product_id": shopee_item_id,
                "seller_id": seller_id,
            })

            if product and not supplier_id:
                supplier_id = product["supplier_id"]

            quantity = item.get("model_quantity_purchased", 1)
            price = float(item.get("item_price", 0))
            total_items += quantity

            order_items.append({
                "shopee_item_id": shopee_item_id,
                "product_id": str(product["_id"]) if product else None,
                "quantity": quantity,
                "price": price,
            })

        if not supplier_id:
            # fallback: use first active supplier
            first_supplier = await db.suppliers.find_one(
                {"seller_id": seller_id, "active": True}
            )
            if first_supplier:
                supplier_id = str(first_supplier["_id"])

        if not supplier_id:
            return {"status": "error", "reason": "no supplier found for this order"}

        total_value = sum(i["quantity"] * i["price"] for i in order_items)
        order_doc = {
            "seller_id": seller_id,
            "supplier_id": supplier_id,
            "shopee_order_id": order_sn,
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
                "product_id": i.get("product_id"),
                "quantity": i["quantity"],
                "price": i["price"],
                "created_at": now,
            }
            for i in order_items
        ]
        if items_docs:
            await db.order_items.insert_many(items_docs)

        fee = total_items * settings.FEE_PER_ITEM
        await db.billing.insert_one({
            "seller_id": seller_id,
            "order_id": order_id,
            "fee_value": fee,
            "quantity_items": total_items,
            "status": "pending",
            "created_at": now,
        })

        # Create notification for seller
        seller_user = await db.users.find_one({"_id": seller_doc["user_id"] if not isinstance(seller_doc.get("user_id"), str) else None})
        await db.notifications.insert_one({
            "user_id": seller_doc["user_id"],
            "type": "new_order",
            "title": "Novo pedido recebido",
            "message": f"Pedido Shopee #{order_sn} recebido com {total_items} itens.",
            "read": False,
            "created_at": now,
        })

        logger.info("shopee_webhook.order_created", order_id=order_id, order_sn=order_sn)
        return {"status": "created", "order_id": order_id}

    except Exception as e:
        logger.error("shopee_webhook.error", error=str(e))
        return {"status": "error", "reason": str(e)}


async def handle_order_updated(db: AsyncIOMotorDatabase, payload: dict) -> dict:
    data = payload.get("data", {})
    order_sn = data.get("ordersn")
    if not order_sn:
        return {"status": "skipped"}

    order = await db.orders.find_one({"shopee_order_id": order_sn})
    if not order:
        return {"status": "skipped", "reason": "order not found"}

    return {"status": "processed"}


async def handle_order_cancelled(db: AsyncIOMotorDatabase, payload: dict) -> dict:
    data = payload.get("data", {})
    order_sn = data.get("ordersn")
    if not order_sn:
        return {"status": "skipped"}

    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"shopee_order_id": order_sn},
        {"$set": {"status": OrderStatus.CANCELLED.value, "updated_at": now}},
    )
    return {"status": "cancelled"}
