from pydantic import BaseModel
from typing import Optional

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 30
    price: Optional[float] = None
    is_published: bool = False

class ServiceOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: Optional[float] = None
    is_published: bool
    owner_id: Optional[int] = None
    booking_count: int = 0

    class Config:
        from_attributes = True

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    is_published: Optional[bool] = None
