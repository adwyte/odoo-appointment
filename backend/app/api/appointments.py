from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta, time
from typing import List

from app.database import get_db
from app.models.models import Booking, AppointmentType, Slot, BookingStatus, User, UserRole
from app.schemas.appointment import SlotOut, BookingCreate, BookingOut

router = APIRouter()


@router.get("/slots", response_model=List[SlotOut])
def get_slots(
        date_str: str = Query(..., alias="date", description="Date in YYYY-MM-DD format"),
        appointment_type_id: int = Query(..., description="ID of the appointment type"),
        db: Session = Depends(get_db)
):
    """
    Get available slots for a given date and appointment type.
    Slots are 30 mins long. Capacity is 3 per slot.
    """
    print(f"Request for slots: date={date_str}, type={appointment_type_id}")
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    appt_type = db.query(AppointmentType).filter(AppointmentType.id == appointment_type_id).first()
    if not appt_type:
        pass

    start_work = datetime.combine(target_date, time(9, 0))
    end_work = datetime.combine(target_date, time(17, 0))
    slot_duration = timedelta(minutes=30)

    slots_response = []
    current_time = start_work
    slot_id_counter = 1

    while current_time < end_work:
        slot_end = current_time + slot_duration

        booking_count = db.query(Booking).filter(
            Booking.appointment_type_id == appointment_type_id,
            Booking.start_time == current_time,
            Booking.status != BookingStatus.CANCELLED
        ).count()

        max_capacity = 3
        available = booking_count < max_capacity

        slots_response.append(SlotOut(
            id=slot_id_counter,
            start_time=current_time,
            end_time=slot_end,
            current_bookings_count=booking_count,
            is_available=available
        ))

        current_time += slot_duration
        slot_id_counter += 1

    return slots_response


@router.post("/bookings", response_model=BookingOut)
def create_booking(
        booking_data: BookingCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new booking.
    """
    # Get or create a guest user for this booking
    customer = db.query(User).filter(User.email == booking_data.customer_email).first()
    if not customer:
        customer = User(
            email=booking_data.customer_email,
            password_hash="guest",
            full_name=booking_data.customer_name,
            role=UserRole.CUSTOMER
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # Calculate end time (30 min slots)
    end_time = booking_data.start_time + timedelta(minutes=30)

    # Check capacity
    current_count = db.query(Booking).filter(
        Booking.appointment_type_id == booking_data.appointment_type_id,
        Booking.start_time == booking_data.start_time,
        Booking.status != BookingStatus.CANCELLED
    ).count()

    if current_count >= 3:
        raise HTTPException(status_code=400, detail="This slot is fully booked")

    # Create booking
    new_booking = Booking(
        customer_id=customer.id,
        appointment_type_id=booking_data.appointment_type_id,
        start_time=booking_data.start_time,
        end_time=end_time,
        status=BookingStatus.CONFIRMED
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return BookingOut(
        id=new_booking.id,
        appointment_type_id=new_booking.appointment_type_id,
        start_time=new_booking.start_time,
        end_time=new_booking.end_time,
        status=new_booking.status.value,
        customer_name=customer.full_name
    )


<<<<<<< HEAD
@router.get("/bookings")
=======
@router.get("/bookings", response_model=List[BookingListOut])
>>>>>>> d364fdd (Fix appointment booking - update service IDs to match database)
def get_bookings(
        customer_email: str = Query(..., description="Customer email to fetch bookings for"),
        db: Session = Depends(get_db)
):
    """
    Get all bookings for a customer by email.
    """
<<<<<<< HEAD
=======
    from app.schemas.appointment import BookingListOut
    
>>>>>>> d364fdd (Fix appointment booking - update service IDs to match database)
    # Find customer
    customer = db.query(User).filter(User.email == customer_email).first()
    if not customer:
        return []

    # Get bookings
    bookings = db.query(Booking).filter(
        Booking.customer_id == customer.id
    ).order_by(Booking.start_time.desc()).all()

    result = []
    for booking in bookings:
        # Get service name
        appt_type = db.query(AppointmentType).filter(
            AppointmentType.id == booking.appointment_type_id
        ).first()
        
<<<<<<< HEAD
        result.append({
            "id": booking.id,
            "service_name": appt_type.name if appt_type else "Unknown Service",
            "start_time": booking.start_time.isoformat(),
            "end_time": booking.end_time.isoformat(),
            "status": booking.status.value
        })
=======
        result.append(BookingListOut(
            id=booking.id,
            service_name=appt_type.name if appt_type else "Unknown Service",
            start_time=booking.start_time,
            end_time=booking.end_time,
            status=booking.status.value,
            created_at=None  # Booking model doesn't have created_at
        ))
>>>>>>> d364fdd (Fix appointment booking - update service IDs to match database)
    
    return result
