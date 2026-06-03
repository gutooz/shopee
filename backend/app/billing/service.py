from motor.motor_asyncio import AsyncIOMotorDatabase
from app.common.serializers import serialize_doc, serialize_list
from app.common.pagination import PaginationParams


async def list_billing(
    db: AsyncIOMotorDatabase, seller_id: str, params: PaginationParams
) -> dict:
    query = {"seller_id": seller_id}
    total = await db.billing.count_documents(query)
    cursor = (
        db.billing.find(query)
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


async def get_billing_summary(db: AsyncIOMotorDatabase, seller_id: str) -> dict:
    pipeline = [
        {"$match": {"seller_id": seller_id}},
        {
            "$group": {
                "_id": "$status",
                "total_fees": {"$sum": "$fee_value"},
                "total_orders": {"$sum": 1},
                "total_items": {"$sum": "$quantity_items"},
            }
        },
    ]
    result = await db.billing.aggregate(pipeline).to_list(length=10)

    summary = {
        "total_fees": 0.0,
        "total_orders": 0,
        "total_items": 0,
        "pending_fees": 0.0,
        "paid_fees": 0.0,
    }

    for row in result:
        summary["total_fees"] += row["total_fees"]
        summary["total_orders"] += row["total_orders"]
        summary["total_items"] += row["total_items"]
        if row["_id"] == "pending":
            summary["pending_fees"] = row["total_fees"]
        elif row["_id"] == "paid":
            summary["paid_fees"] = row["total_fees"]

    return summary


async def list_all_billing(db: AsyncIOMotorDatabase, params: PaginationParams) -> dict:
    total = await db.billing.count_documents({})
    cursor = db.billing.find({}).sort("created_at", -1).skip(params.skip).limit(params.limit)
    items = await cursor.to_list(length=params.limit)
    return {
        "items": serialize_list(items),
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
    }


async def get_platform_revenue(db: AsyncIOMotorDatabase) -> dict:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_revenue": {"$sum": "$fee_value"},
                "total_orders": {"$sum": 1},
                "total_items": {"$sum": "$quantity_items"},
            }
        }
    ]
    result = await db.billing.aggregate(pipeline).to_list(length=1)
    if not result:
        return {"total_revenue": 0.0, "total_orders": 0, "total_items": 0}
    return {
        "total_revenue": result[0]["total_revenue"],
        "total_orders": result[0]["total_orders"],
        "total_items": result[0]["total_items"],
    }
