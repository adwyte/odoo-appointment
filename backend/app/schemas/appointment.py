from pydantic import BaseModel
from datetime import datetime, time
from typing import List, Optional

class SlotOut(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    current_bookings_count: int
    is_available: bool

    class Config:
        from_attributes = True

class AppointmentTypeOut(BaseModel):
    id: int
    name: str
    duration_minutes: int

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    appointment_type_id: int
    start_time: datetime
    customer_name: str
    customer_email: str

class BookingOut(BaseModel):
    id: int
    appointment_type_id: int
    start_time: datetime
    end_time: datetime
    status: str
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True
