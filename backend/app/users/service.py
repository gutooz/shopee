from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.common.serializers import serialize_doc, serialize_list
from app.common.exceptions import NotFoundException, ConflictException
from app.common.pagination import PaginationParams
from app.users.schemas import UserUpdate, UserAdminUpdate


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise NotFoundException("User not found")
    return serialize_doc(user)


async def update_user(db: AsyncIOMotorDatabase, user_id: str, data: UserUpdate) -> dict:
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if "email" in update_data:
        existing = await db.users.find_one(
            {"email": update_data["email"], "_id": {"$ne": ObjectId(user_id)}}
        )
        if existing:
            raise ConflictException("Email already in use")

    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return await get_user_by_id(db, user_id)


async def list_users(db: AsyncIOMotorDatabase, params: PaginationParams) -> dict:
    total = await db.users.count_documents({})
    cursor = db.users.find({}, {"password_hash": 0}).skip(params.skip).limit(params.limit)
    users = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(users),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


async def admin_update_user(
    db: AsyncIOMotorDatabase, user_id: str, data: UserAdminUpdate
) -> dict:
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return await get_user_by_id(db, user_id)


async def delete_user(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise NotFoundException("User not found")
    return {"message": "User deleted"}
