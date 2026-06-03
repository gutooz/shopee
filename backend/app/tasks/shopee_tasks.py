import asyncio
from app.celery_app import celery_app
from app.config import settings


def run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def sync_all_sellers_orders():
    async def _run():
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGO_DB]
        try:
            from app.shopee.service import sync_orders, get_valid_token
            sellers = await db.sellers.find(
                {"shopee_shop_id": {"$ne": None}}
            ).to_list(length=1000)

            for seller in sellers:
                seller_id = str(seller["_id"])
                try:
                    await sync_orders(db, seller_id, days_back=1)
                except Exception:
                    pass
        finally:
            client.close()

    run_async(_run())


@celery_app.task
def refresh_expiring_tokens():
    async def _run():
        from motor.motor_asyncio import AsyncIOMotorClient
        from datetime import datetime, timezone, timedelta
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGO_DB]
        try:
            threshold = datetime.now(timezone.utc) + timedelta(hours=2)
            tokens = await db.shopee_tokens.find(
                {"expires_at": {"$lt": threshold}}
            ).to_list(length=1000)

            from app.shopee.service import get_valid_token
            for token in tokens:
                seller_id = token["seller_id"]
                try:
                    await get_valid_token(db, seller_id)
                except Exception:
                    pass
        finally:
            client.close()

    run_async(_run())
