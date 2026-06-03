from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller, require_admin
from app.common.pagination import PaginationParams
from app.sellers import service
from app.sellers.schemas import SellerUpdate, SellerOut

router = APIRouter(prefix="/sellers", tags=["Sellers"])


@router.get("/me", response_model=SellerOut)
async def get_my_seller_profile(
    seller: dict = Depends(get_current_seller),
):
    return seller


@router.put("/me", response_model=SellerOut)
async def update_my_seller_profile(
    data: SellerUpdate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.update_seller(db, seller["id"], data)


@router.get("/", dependencies=[Depends(require_admin)])
async def list_sellers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_sellers(db, params)


@router.get("/{seller_id}", dependencies=[Depends(require_admin)])
async def get_seller(seller_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    return await service.get_seller_by_id(db, seller_id)


@router.patch("/{seller_id}/subscription", dependencies=[Depends(require_admin)])
async def toggle_subscription(
    seller_id: str,
    status: str = Query(..., regex="^(active|suspended|cancelled)$"),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.toggle_subscription(db, seller_id, status)
