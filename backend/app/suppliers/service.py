from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.common.serializers import serialize_doc, serialize_list
from app.common.exceptions import NotFoundException, ForbiddenException
from app.common.pagination import PaginationParams
from app.suppliers.schemas import SupplierCreate, SupplierUpdate


async def create_supplier(
    db: AsyncIOMotorDatabase, seller_id: str, data: SupplierCreate
) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "seller_id": seller_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "address": data.address,
        "whatsapp_number": data.whatsapp_number,
        "active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.suppliers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


async def list_suppliers(
    db: AsyncIOMotorDatabase, seller_id: str, params: PaginationParams
) -> dict:
    query = {"seller_id": seller_id}
    total = await db.suppliers.count_documents(query)
    cursor = db.suppliers.find(query).skip(params.skip).limit(params.limit)
    items = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(items),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


async def get_supplier(
    db: AsyncIOMotorDatabase, supplier_id: str, seller_id: str
) -> dict:
    supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
    if not supplier:
        raise NotFoundException("Supplier not found")
    if supplier["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")
    return serialize_doc(supplier)


async def update_supplier(
    db: AsyncIOMotorDatabase, supplier_id: str, seller_id: str, data: SupplierUpdate
) -> dict:
    supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
    if not supplier:
        raise NotFoundException("Supplier not found")
    if supplier["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.suppliers.update_one({"_id": ObjectId(supplier_id)}, {"$set": update_data})
    return await get_supplier(db, supplier_id, seller_id)


async def delete_supplier(
    db: AsyncIOMotorDatabase, supplier_id: str, seller_id: str
) -> dict:
    supplier = await db.suppliers.find_one({"_id": ObjectId(supplier_id)})
    if not supplier:
        raise NotFoundException("Supplier not found")
    if supplier["seller_id"] != seller_id:
        raise ForbiddenException("Access denied")

    await db.suppliers.delete_one({"_id": ObjectId(supplier_id)})
    return {"message": "Supplier deleted"}
