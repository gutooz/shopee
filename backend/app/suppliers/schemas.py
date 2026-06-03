from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    whatsapp_number: Optional[str] = Field(None, max_length=20)


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    whatsapp_number: Optional[str] = Field(None, max_length=20)
    active: Optional[bool] = None


class SupplierOut(BaseModel):
    id: str
    seller_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    whatsapp_number: Optional[str] = None
    active: bool
    created_at: str
