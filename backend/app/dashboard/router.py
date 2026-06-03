from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller, require_admin
from app.dashboard import service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/seller")
async def seller_dashboard(
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.get_seller_dashboard(db, seller["id"])


@router.get("/admin", dependencies=[Depends(require_admin)])
async def admin_dashboard(db: AsyncIOMotorDatabase = Depends(get_database)):
    return await service.get_admin_dashboard(db)
