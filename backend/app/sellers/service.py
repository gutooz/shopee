from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.common.serializers import serialize_doc, serialize_list
from app.common.exceptions import NotFoundException
from app.common.pagination import PaginationParams
from app.sellers.schemas import SellerUpdate


async def get_seller_by_user_id(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    seller = await db.sellers.find_one({"user_id": user_id})
    if not seller:
        raise NotFoundException("Seller not found")
    return serialize_doc(seller)


async def get_seller_by_id(db: AsyncIOMotorDatabase, seller_id: str) -> dict:
    seller = await db.sellers.find_one({"_id": ObjectId(seller_id)})
    if not seller:
        raise NotFoundException("Seller not found")
    return serialize_doc(seller)


async def update_seller(
    db: AsyncIOMotorDatabase, seller_id: str, data: SellerUpdate
) -> dict:
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.sellers.update_one({"_id": ObjectId(seller_id)}, {"$set": update_data})
    return await get_seller_by_id(db, seller_id)


async def list_sellers(db: AsyncIOMotorDatabase, params: PaginationParams) -> dict:
    total = await db.sellers.count_documents({})
    cursor = db.sellers.find({}).skip(params.skip).limit(params.limit)
    sellers = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(sellers),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


async def toggle_subscription(
    db: AsyncIOMotorDatabase, seller_id: str, status: str
) -> dict:
    await db.sellers.update_one(
        {"_id": ObjectId(seller_id)},
        {"$set": {"subscription_status": status, "updated_at": datetime.now(timezone.utc)}},
    )
    return await get_seller_by_id(db, seller_id)
