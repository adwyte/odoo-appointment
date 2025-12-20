from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import os

from passlib.context import CryptContext
from jose import jwt

from app.models.models import Base, User, UserRole, Booking, BookingStatus, AppointmentType
from app.api import appointments, auth

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:Sansku%23062005@localhost:5432/odoo_appointment"
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# =====================
# APP
# =====================

app = FastAPI(title="UrbanCare API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(appointments.router, prefix="/api")
app.include_router(auth.router)

# =====================
# DEPENDENCY
# =====================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =====================
# SECURITY UTILS
# =====================

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# =====================
# SCHEMAS
# =====================

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "customer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: Optional[bool] = True
    is_verified: Optional[bool] = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class StatsResponse(BaseModel):
    total_users: int
    total_providers: int
    total_appointments: int
    total_revenue: float
    active_users: int
    total_organisers: int
    total_customers: int

# Appointment schemas
class AppointmentResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    service_name: str
    start_time: datetime
    end_time: datetime
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AppointmentListResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total: int
    pending_count: int
    confirmed_count: int
    cancelled_count: int
    completed_count: int

class AppointmentStatusUpdate(BaseModel):
    status: str

# =====================
# ROUTES
# =====================

@app.get("/")
def root():
    return {"message": "Welcome to UrbanCare API"}

@app.post("/api/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role_map = {
        "customer": UserRole.CUSTOMER,
        "admin": UserRole.ADMIN,
        "organiser": UserRole.ORGANISER,
    }

    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=role_map.get(user_data.role, UserRole.CUSTOMER),
        is_active=True,
        is_verified=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )

@app.post("/api/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
        }
    )

    return {"access_token": token}


@app.get("/api/users", response_model=List[UserResponse])
def get_users(limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    users = db.query(User).limit(limit).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            is_active=u.is_active,
            is_verified=u.is_verified,
            created_at=u.created_at,
        )
        for u in users
    ]


@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.role is not None:
        role_map = {
            "customer": UserRole.CUSTOMER,
            "admin": UserRole.ADMIN,
            "organiser": UserRole.ORGANISER,
        }
        user.role = role_map.get(user_data.role, user.role)
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.is_verified is not None:
        user.is_verified = user_data.is_verified
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_organisers = db.query(User).filter(User.role == UserRole.ORGANISER).count()
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    total_appointments = db.query(Booking).count()
    return StatsResponse(
        total_users=total_users,
        total_providers=total_organisers,
        total_appointments=total_appointments,
        total_revenue=0.0,
        active_users=active_users,
        total_organisers=total_organisers,
        total_customers=total_customers
    )


# Admin Appointments endpoints
@app.get("/api/admin/appointments", response_model=AppointmentListResponse)
def get_all_appointments(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by customer name or email"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all appointments with filters for admin dashboard"""
    query = db.query(Booking)
    
    # Apply status filter
    if status and status != "all":
        status_map = {
            "pending": BookingStatus.PENDING,
            "confirmed": BookingStatus.CONFIRMED,
            "cancelled": BookingStatus.CANCELLED,
            "completed": BookingStatus.COMPLETED,
        }
        if status in status_map:
            query = query.filter(Booking.status == status_map[status])
    
    # Apply date filters
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Booking.start_time >= from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d")
            to_date = to_date.replace(hour=23, minute=59, second=59)
            query = query.filter(Booking.start_time <= to_date)
        except ValueError:
            pass
    
    # Get total count before pagination
    total = query.count()
    
    # Get status counts
    pending_count = db.query(Booking).filter(Booking.status == BookingStatus.PENDING).count()
    confirmed_count = db.query(Booking).filter(Booking.status == BookingStatus.CONFIRMED).count()
    cancelled_count = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
    completed_count = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
    
    # Apply pagination and ordering
    bookings = query.order_by(Booking.start_time.desc()).offset(skip).limit(limit).all()
    
    appointments = []
    for booking in bookings:
        # Get customer info
        customer = db.query(User).filter(User.id == booking.customer_id).first()
        customer_name = customer.full_name if customer else "Unknown"
        customer_email = customer.email if customer else "Unknown"
        
        # Apply search filter (after getting customer info)
        if search:
            search_lower = search.lower()
            if search_lower not in customer_name.lower() and search_lower not in customer_email.lower():
                continue
        
        # Get service/appointment type info
        appt_type = db.query(AppointmentType).filter(AppointmentType.id == booking.appointment_type_id).first()
        service_name = appt_type.name if appt_type else "Unknown Service"
        
        appointments.append(AppointmentResponse(
            id=booking.id,
            customer_name=customer_name,
            customer_email=customer_email,
            service_name=service_name,
            start_time=booking.start_time,
            end_time=booking.end_time,
            status=booking.status.value if booking.status else "pending",
            created_at=None
        ))
    
    return AppointmentListResponse(
        appointments=appointments,
        total=total,
        pending_count=pending_count,
        confirmed_count=confirmed_count,
        cancelled_count=cancelled_count,
        completed_count=completed_count
    )


@app.put("/api/admin/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update appointment status"""
    booking = db.query(Booking).filter(Booking.id == appointment_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    status_map = {
        "pending": BookingStatus.PENDING,
        "confirmed": BookingStatus.CONFIRMED,
        "cancelled": BookingStatus.CANCELLED,
        "completed": BookingStatus.COMPLETED,
    }
    
    if status_update.status not in status_map:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    booking.status = status_map[status_update.status]
    db.commit()
    
    return {"message": f"Appointment status updated to {status_update.status}"}


@app.delete("/api/admin/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Delete an appointment"""
    booking = db.query(Booking).filter(Booking.id == appointment_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(booking)
    db.commit()
    return {"message": "Appointment deleted successfully"}
