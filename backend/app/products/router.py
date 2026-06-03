from fastapi import APIRouter, Depends, Query
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_seller
from app.common.pagination import PaginationParams
from app.products import service
from app.products.schemas import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(
    data: ProductCreate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.create_product(db, seller["id"], data)


@router.get("/")
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    supplier_id: Optional[str] = Query(default=None),
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_products(db, seller["id"], params, supplier_id)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.get_product(db, product_id, seller["id"])


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.update_product(db, product_id, seller["id"], data)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    seller: dict = Depends(get_current_seller),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.delete_product(db, product_id, seller["id"])
