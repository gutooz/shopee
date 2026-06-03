from pydantic import BaseModel
from typing import Optional


class BillingOut(BaseModel):
    id: str
    seller_id: str
    order_id: str
    fee_value: float
    quantity_items: int
    status: str
    created_at: str


class BillingSummary(BaseModel):
    total_fees: float
    total_orders: int
    total_items: int
    pending_fees: float
    paid_fees: float
