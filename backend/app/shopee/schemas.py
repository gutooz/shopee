from pydantic import BaseModel
from typing import Optional, List, Any


class ShopeeAuthCallback(BaseModel):
    code: str
    shop_id: int


class ShopeeWebhookOrder(BaseModel):
    shop_id: int
    code: int
    timestamp: int
    data: dict


class ShopeeOrderSyncRequest(BaseModel):
    days_back: int = 1


class ShopeeTokenOut(BaseModel):
    seller_id: str
    shop_id: int
    connected: bool
    expires_at: Optional[str] = None
