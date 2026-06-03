from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)
    price: float = Field(..., ge=0)


class OrderCreate(BaseModel):
    supplier_id: str
    shopee_order_id: Optional[str] = None
    items: List[OrderItemIn]


class TrackingUpdate(BaseModel):
    tracking_code: str = Field(..., min_length=5, max_length=100)


class OrderItemOut(BaseModel):
    id: str
    order_id: str
    product_id: str
    quantity: int
    price: float


class OrderOut(BaseModel):
    id: str
    seller_id: str
    supplier_id: str
    shopee_order_id: Optional[str] = None
    status: str
    tracking_code: Optional[str] = None
    total_value: float
    created_at: str
    updated_at: str
    items: Optional[List[OrderItemOut]] = None
