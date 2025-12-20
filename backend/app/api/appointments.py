from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time
from typing import List
from app.database import get_db
from app.models.models import Booking, AppointmentType, Slot, BookingStatus, User, UserRole, ResourceAssignmentType
from app.schemas.appointment import SlotOut, BookingCreate, BookingOut, BookingListOut
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate


router = APIRouter()


@router.get("/slots", response_model=List[SlotOut])
def get_slots(
    date_str: str = Query(..., alias="date", description="Date in YYYY-MM-DD format"),
    appointment_type_id: int = Query(..., description="ID of the appointment type"),
    db: Session = Depends(get_db),
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

    appt_type = (
        db.query(AppointmentType)
        .filter(AppointmentType.id == appointment_type_id)
        .first()
    )
    if not appt_type:
        # If appointment type doesn't exist, return empty list to avoid downstream errors
        return []

    start_work = datetime.combine(target_date, time(9, 0))
    end_work = datetime.combine(target_date, time(17, 0))
    slot_duration = timedelta(minutes=30)

    slots_response: List[SlotOut] = []
    current_time = start_work
    slot_id_counter = 1

    while current_time < end_work:
        slot_end = current_time + slot_duration

        booking_count = (
            db.query(Booking)
            .filter(
                Booking.appointment_type_id == appointment_type_id,
                Booking.start_time == current_time,
                Booking.status != BookingStatus.CANCELLED,
            )
            .count()
        )

        max_capacity = 3
        available = booking_count < max_capacity

        slots_response.append(
            SlotOut(
                id=slot_id_counter,
                start_time=current_time,
                end_time=slot_end,
                current_bookings_count=booking_count,
                is_available=available,
            )
        )

        current_time += slot_duration
        slot_id_counter += 1

    return slots_response


@router.post("/bookings", response_model=BookingOut)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
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
            role=UserRole.CUSTOMER,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # Calculate end time (30 min slots)
    end_time = booking_data.start_time + timedelta(minutes=30)

    # Check capacity
    current_count = (
        db.query(Booking)
        .filter(
            Booking.appointment_type_id == booking_data.appointment_type_id,
            Booking.start_time == booking_data.start_time,
            Booking.status != BookingStatus.CANCELLED,
        )
        .count()
    )

    if current_count >= 3:
        raise HTTPException(status_code=400, detail="This slot is fully booked")

    # Create booking
    new_booking = Booking(
        customer_id=customer.id,
        appointment_type_id=booking_data.appointment_type_id,
        start_time=booking_data.start_time,
        end_time=end_time,
        status=BookingStatus.CONFIRMED,
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
        customer_name=customer.full_name,
    )


@router.get("/bookings", response_model=List[BookingListOut])
def get_bookings(
    customer_email: str = Query(..., description="Customer email to fetch bookings for"),
    db: Session = Depends(get_db),
):
    """
    Get all bookings for a customer by email.
    """
    # Find customer
    customer = db.query(User).filter(User.email == customer_email).first()
    if not customer:
        return []

    # Get bookings
    bookings = (
        db.query(Booking)
        .filter(Booking.customer_id == customer.id)
        .order_by(Booking.start_time.desc())
        .all()
    )

    result: List[BookingListOut] = []
    for booking in bookings:
        appt_type = (
            db.query(AppointmentType)
            .filter(AppointmentType.id == booking.appointment_type_id)
            .first()
        )

        result.append(
            BookingListOut(
                id=booking.id,
                service_name=appt_type.name if appt_type else "Unknown Service",
                start_time=booking.start_time,
                end_time=booking.end_time,
                status=booking.status.value,
                created_at=None,  # Booking model doesn't have created_at
            )
        )

    return result


# ============== ADMIN APPOINTMENTS ENDPOINTS ==============

@router.get("/admin/appointments")
def get_admin_appointments(
    status: str = Query(None, description="Filter by status"),
    date_from: str = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Filter to date (YYYY-MM-DD)"),
    search: str = Query(None, description="Search by customer name or email"),
    limit: int = Query(100, description="Limit results"),
    db: Session = Depends(get_db),
):
    """
    Get all appointments for admin dashboard with filtering.
    """
    query = db.query(Booking)

    # Filter by status
    if status:
        status_map = {
            "pending": BookingStatus.PENDING,
            "confirmed": BookingStatus.CONFIRMED,
            "cancelled": BookingStatus.CANCELLED,
            "completed": BookingStatus.COMPLETED,
        }
        if status in status_map:
            query = query.filter(Booking.status == status_map[status])

    # Filter by date range
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Booking.start_time >= from_date)
        except ValueError:
            pass

    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Booking.start_time < to_date)
        except ValueError:
            pass

    # Get all bookings first for search filtering and counts
    all_bookings = query.order_by(Booking.start_time.desc()).all()

    # Build response with customer info
    appointments = []
    for booking in all_bookings:
        customer = db.query(User).filter(User.id == booking.customer_id).first()
        appt_type = db.query(AppointmentType).filter(
            AppointmentType.id == booking.appointment_type_id
        ).first()

        customer_name = customer.full_name if customer else "Unknown"
        customer_email = customer.email if customer else "unknown@email.com"
        service_name = appt_type.name if appt_type else "Unknown Service"

        # Search filter
        if search:
            search_lower = search.lower()
            if search_lower not in customer_name.lower() and search_lower not in customer_email.lower():
                continue

        appointments.append({
            "id": booking.id,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "service_name": service_name,
            "start_time": booking.start_time.isoformat(),
            "end_time": booking.end_time.isoformat(),
            "status": booking.status.value,
            "created_at": None,
        })

    # Apply limit
    limited_appointments = appointments[:limit]

    # Calculate counts from all (non-search-filtered) bookings
    all_statuses = [b.status for b in all_bookings]
    pending_count = sum(1 for s in all_statuses if s == BookingStatus.PENDING)
    confirmed_count = sum(1 for s in all_statuses if s == BookingStatus.CONFIRMED)
    cancelled_count = sum(1 for s in all_statuses if s == BookingStatus.CANCELLED)
    completed_count = sum(1 for s in all_statuses if s == BookingStatus.COMPLETED)

    return {
        "appointments": limited_appointments,
        "total": len(appointments),
        "pending_count": pending_count,
        "confirmed_count": confirmed_count,
        "cancelled_count": cancelled_count,
        "completed_count": completed_count,
    }


@router.put("/admin/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_data: dict,
    db: Session = Depends(get_db),
):
    """
    Update appointment status.
    """
    booking = db.query(Booking).filter(Booking.id == appointment_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Appointment not found")

    status_map = {
        "pending": BookingStatus.PENDING,
        "confirmed": BookingStatus.CONFIRMED,
        "cancelled": BookingStatus.CANCELLED,
        "completed": BookingStatus.COMPLETED,
    }

    new_status = status_data.get("status")
    if new_status not in status_map:
        raise HTTPException(status_code=400, detail="Invalid status")

    booking.status = status_map[new_status]
    db.commit()
    db.refresh(booking)

    return {"message": "Status updated successfully", "status": new_status}


@router.delete("/admin/appointments/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete an appointment.
    """
    booking = db.query(Booking).filter(Booking.id == appointment_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(booking)
    db.commit()

    return {"message": "Appointment deleted successfully"}


# ============== SERVICE ENDPOINTS ==============

@router.get("/services", response_model=List[ServiceOut])
def get_services(
    published_only: bool = Query(True, description="Only return published services"),
    db: Session = Depends(get_db)
):
    """
    Get all services (appointment types). By default returns only published ones.
    """
    query = db.query(AppointmentType)
    if published_only:
        query = query.filter(AppointmentType.is_published == True)
    
    services = query.all()
    result = []
    for service in services:
        booking_count = db.query(Booking).filter(
            Booking.appointment_type_id == service.id
        ).count()
        result.append(ServiceOut(
            id=service.id,
            name=service.name,
            description=service.description,
            duration_minutes=service.duration_minutes,
            price=None,  # Price not in model yet
            is_published=service.is_published,
            owner_id=service.owner_id,
            booking_count=booking_count
        ))
    return result


@router.post("/services", response_model=ServiceOut)
def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new service (appointment type).
    """
    new_service = AppointmentType(
        name=service_data.name,
        description=service_data.description,
        duration_minutes=service_data.duration_minutes,
        is_published=service_data.is_published,
        owner_id=None,  # Would come from auth in production
        resource_assignment_type=ResourceAssignmentType.AUTO
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    
    return ServiceOut(
        id=new_service.id,
        name=new_service.name,
        description=new_service.description,
        duration_minutes=new_service.duration_minutes,
        price=None,
        is_published=new_service.is_published,
        owner_id=new_service.owner_id,
        booking_count=0
    )


@router.put("/services/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing service.
    """
    service = db.query(AppointmentType).filter(AppointmentType.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service_data.name is not None:
        service.name = service_data.name
    if service_data.description is not None:
        service.description = service_data.description
    if service_data.duration_minutes is not None:
        service.duration_minutes = service_data.duration_minutes
    if service_data.is_published is not None:
        service.is_published = service_data.is_published
    
    db.commit()
    db.refresh(service)
    
    booking_count = db.query(Booking).filter(
        Booking.appointment_type_id == service.id
    ).count()
    
    return ServiceOut(
        id=service.id,
        name=service.name,
        description=service.description,
        duration_minutes=service.duration_minutes,
        price=None,
        is_published=service.is_published,
        owner_id=service.owner_id,
        booking_count=booking_count
    )


@router.delete("/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a service.
    """
    service = db.query(AppointmentType).filter(AppointmentType.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check for existing bookings
    booking_count = db.query(Booking).filter(
        Booking.appointment_type_id == service_id
    ).count()
    
    if booking_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete service with {booking_count} existing bookings"
        )
    
    db.delete(service)
    db.commit()
    
    return {"message": "Service deleted successfully"}
