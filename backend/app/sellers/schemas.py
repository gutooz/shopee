from pydantic import BaseModel, Field
from typing import Optional


class SellerUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=200)
    cnpj: Optional[str] = Field(None, max_length=20)


class SellerOut(BaseModel):
    id: str
    user_id: str
    company_name: str
    cnpj: Optional[str] = None
    shopee_shop_id: Optional[str] = None
    subscription_status: str
    created_at: str
