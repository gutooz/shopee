from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.common.serializers import serialize_doc, serialize_list
from app.common.pagination import PaginationParams
from app.notifications.schemas import NotificationCreate


async def create_notification(db: AsyncIOMotorDatabase, data: NotificationCreate) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": data.user_id,
        "type": data.type,
        "title": data.title,
        "message": data.message,
        "read": False,
        "created_at": now,
    }
    result = await db.notifications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


async def list_notifications(
    db: AsyncIOMotorDatabase, user_id: str, params: PaginationParams, unread_only: bool = False
) -> dict:
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False

    total = await db.notifications.count_documents(query)
    cursor = (
        db.notifications.find(query)
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
        "unread_count": await db.notifications.count_documents({"user_id": user_id, "read": False}),
    }


async def mark_as_read(db: AsyncIOMotorDatabase, notification_id: str, user_id: str) -> dict:
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"read": True}},
    )
    return {"message": "Notification marked as read"}


async def mark_all_as_read(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}},
    )
    return {"updated": result.modified_count}


async def get_unread_count(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    return {"count": count}
