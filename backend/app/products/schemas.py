from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class ProductCreate(BaseModel):
    supplier_id: str
    name: str = Field(..., min_length=1, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    shopee_product_id: Optional[str] = None
    price: float = Field(..., ge=0)


class ProductUpdate(BaseModel):
    supplier_id: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    shopee_product_id: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    active: Optional[bool] = None


class ProductOut(BaseModel):
    id: str
    seller_id: str
    supplier_id: str
    name: str
    sku: Optional[str] = None
    shopee_product_id: Optional[str] = None
    price: float
    active: bool
    created_at: str
