from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.common.serializers import serialize_doc, serialize_list
from app.common.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.common.pagination import PaginationParams
from app.products.schemas import ProductCreate, ProductUpdate


async def create_product(
    db: AsyncIOMotorDatabase, seller_id: str, data: ProductCreate
) -> dict:
    supplier = await db.suppliers.find_one({"_id": ObjectId(data.supplier_id)})
    if not supplier or supplier["seller_id"] != seller_id:
        raise BadRequestException("Supplier not found or does not belong to you")

    now = datetime.now(timezone.utc)
    doc = {
        "seller_id": seller_id,
        "supplier_id": data.supplier_id,
        "name": data.name,
        "sku": data.sku,
        "shopee_product_id": data.shopee_product_id,
        "price": data.price,
        "active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


async def list_products(
    db: AsyncIOMotorDatabase,
    seller_id: str,
    params: PaginationParams,
    supplier_id: str = None,
) -> dict:
    query = {"seller_id": seller_id}
    if supplier_id:
        query["supplier_id"] = supplier_id

    total = await db.products.count_documents(query)
    cursor = db.products.find(query).skip(params.skip).limit(params.limit)
    items = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(items),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


async def get_product(db: AsyncIOMotorDatabase, product_id: str, seller_id: str) -> dict:
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise NotFoundException("Product not found")
    if product["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")
    return serialize_doc(product)


async def update_product(
    db: AsyncIOMotorDatabase, product_id: str, seller_id: str, data: ProductUpdate
) -> dict:
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise NotFoundException("Product not found")
    if product["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if "supplier_id" in update_data:
        supplier = await db.suppliers.find_one({"_id": ObjectId(update_data["supplier_id"])})
        if not supplier or supplier["seller_id"] != seller_id:
            raise BadRequestException("Supplier not found or does not belong to you")

    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
    return await get_product(db, product_id, seller_id)


async def delete_product(
    db: AsyncIOMotorDatabase, product_id: str, seller_id: str
) -> dict:
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise NotFoundException("Product not found")
    if product["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted"}
