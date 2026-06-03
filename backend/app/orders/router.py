from fastapi import APIRouter, Depends, Query
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller, get_current_user, require_roles
from app.common.pagination import PaginationParams
from app.orders import service
from app.orders.schemas import OrderCreate, TrackingUpdate, OrderOut, OrderStatus

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(
    data: OrderCreate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.create_order(db, seller["id"], data)


@router.get("/")
async def list_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    supplier_id: Optional[str] = Query(default=None),
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_orders(db, seller["id"], params, status, supplier_id)


@router.get("/supplier")
async def get_supplier_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    current_user: dict = Depends(require_roles("supplier")),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.get_supplier_orders(
        db, str(current_user["_id"]), params, status
    )


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.get_order(db, order_id, seller["id"])


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: OrderStatus = Query(...),
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.update_order_status(db, order_id, seller["id"], status)


@router.patch("/{order_id}/tracking")
async def update_tracking(
    order_id: str,
    data: TrackingUpdate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.update_tracking(db, order_id, seller["id"], data)
