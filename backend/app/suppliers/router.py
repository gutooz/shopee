from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller
from app.common.pagination import PaginationParams
from app.suppliers import service
from app.suppliers.schemas import SupplierCreate, SupplierUpdate, SupplierOut

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.post("/", response_model=SupplierOut, status_code=201)
async def create_supplier(
    data: SupplierCreate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.create_supplier(db, seller["id"], data)


@router.get("/")
async def list_suppliers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_suppliers(db, seller["id"], params)


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(
    supplier_id: str,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.get_supplier(db, supplier_id, seller["id"])


@router.put("/{supplier_id}", response_model=SupplierOut)
async def update_supplier(
    supplier_id: str,
    data: SupplierUpdate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.update_supplier(db, supplier_id, seller["id"], data)


@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: str,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.delete_supplier(db, supplier_id, seller["id"])
