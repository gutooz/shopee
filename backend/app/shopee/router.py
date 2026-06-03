from fastapi import APIRouter, Depends, Request, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller
from app.shopee import service
from app.shopee.schemas import ShopeeAuthCallback, ShopeeOrderSyncRequest

router = APIRouter(prefix="/shopee", tags=["Shopee Integration"])


@router.get("/auth-url")
async def get_auth_url():
    url = await service.get_auth_url()
    return {"url": url}


@router.post("/auth/callback")
async def auth_callback(
    data: ShopeeAuthCallback,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.handle_auth_callback(db, seller["id"], data.code, data.shop_id)


@router.get("/status")
async def connection_status(
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.get_connection_status(db, seller["id"])


@router.delete("/disconnect")
async def disconnect(
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.disconnect_shopee(db, seller["id"])


@router.post("/sync-orders")
async def sync_orders(
    data: ShopeeOrderSyncRequest,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.sync_orders(db, seller["id"], data.days_back)


# Webhook endpoints (public - verified by signature)
webhook_router = APIRouter(prefix="/webhooks/shopee", tags=["Shopee Webhooks"])


@webhook_router.post("/order-created")
async def order_created_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    payload = await request.json()
    from app.shopee.webhooks import handle_order_created
    return await handle_order_created(db, payload)


@webhook_router.post("/order-updated")
async def order_updated_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    payload = await request.json()
    from app.shopee.webhooks import handle_order_updated
    return await handle_order_updated(db, payload)


@webhook_router.post("/order-cancelled")
async def order_cancelled_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    payload = await request.json()
    from app.shopee.webhooks import handle_order_cancelled
    return await handle_order_cancelled(db, payload)
