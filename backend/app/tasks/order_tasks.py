import asyncio
from app.celery_app import celery_app
from app.config import settings


def run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_order_notification(self, order_id: str, seller_id: str):
    async def _run():
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGO_DB]
        try:
            from bson import ObjectId
            from datetime import datetime, timezone
            order = await db.orders.find_one({"_id": ObjectId(order_id)})
            if not order:
                return

            seller = await db.sellers.find_one({"_id": ObjectId(seller_id)})
            if not seller:
                return

            await db.notifications.insert_one({
                "user_id": seller["user_id"],
                "type": "new_order",
                "title": "Novo pedido",
                "message": f"Pedido #{order_id} criado com sucesso.",
                "read": False,
                "created_at": datetime.now(timezone.utc),
            })
        finally:
            client.close()

    try:
        run_async(_run())
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_tracking_to_shopee_task(
    self, order_id: str, seller_id: str, shopee_order_id: str, tracking_code: str
):
    async def _run():
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGO_DB]
        try:
            from app.shopee.service import send_tracking_to_shopee
            result = await send_tracking_to_shopee(
                db, seller_id, shopee_order_id, tracking_code
            )
            return result
        finally:
            client.close()

    try:
        return run_async(_run())
    except Exception as exc:
        raise self.retry(exc=exc)
