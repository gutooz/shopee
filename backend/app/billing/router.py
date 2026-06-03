from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller, require_admin
from app.common.pagination import PaginationParams
from app.billing import service

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/")
async def list_billing(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_billing(db, seller["id"], params)


@router.get("/summary")
async def get_billing_summary(
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.get_billing_summary(db, seller["id"])


@router.get("/admin/all", dependencies=[Depends(require_admin)])
async def list_all_billing(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_all_billing(db, params)


@router.get("/admin/revenue", dependencies=[Depends(require_admin)])
async def platform_revenue(db: AsyncIOMotorDatabase = Depends(get_database)):
    return await service.get_platform_revenue(db)
