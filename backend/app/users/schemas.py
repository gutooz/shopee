from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    active: bool
    created_at: str
    updated_at: str


class UserAdminUpdate(BaseModel):
    active: Optional[bool] = None
    role: Optional[str] = None
