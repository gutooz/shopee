from pydantic import BaseModel
from typing import Optional


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: str


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
