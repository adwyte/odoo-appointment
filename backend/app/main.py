import random
import string
import os
import random
from starlette.middleware.sessions import SessionMiddleware

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
from app.api import payments
from app.database import get_db
from app.models.models import User, UserRole, Booking, Resource
from app.api import appointments, auth, payments, schedules
from app.core.security import create_access_token
from app.core.deps import get_current_user
from passlib.context import CryptContext
from app.services.email import send_otp_email

RESET_OTP_STORE = {}

load_dotenv()

# =====================
# APP SETUP
# =====================

app = FastAPI(title="UrbanCare API", version="1.0.0")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-session-secret"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router, prefix="/api")
app.include_router(auth.router)
app.include_router(payments.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# =====================
# HELPERS
# =====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# =====================
# SCHEMAS
# =====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "customer"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    email: str  # Use str instead of EmailStr for response (data may have legacy entries)
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# =====================
# ROUTES
# =====================

@app.get("/")
def root():
    return {"message": "Welcome to UrbanCare API"}

# ---------- SIGN UP ----------
@app.post("/api/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long",
        )

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
    return user

# ---------- LOGIN ----------
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

# ---------- AUTH ME ----------
@app.get("/api/auth/me", response_model=UserResponse)
def get_me(
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ---------- USERS ----------
@app.get("/api/users", response_model=list[UserResponse])
def get_users(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(User).limit(limit).all()

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.dict(exclude_unset=True)
    if "role" in updates:
        updates["role"] = UserRole[updates["role"].upper()]

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, force: bool = False, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count bookings as customer
    booking_count = db.query(Booking).filter(Booking.customer_id == user_id).count()
    
    # Count resources linked to this user
    resource_count = db.query(Resource).filter(Resource.user_id == user_id).count()
    
    total_references = booking_count + resource_count
    
    if total_references > 0 and not force:
        raise HTTPException(status_code=400, detail=f"User has {booking_count} booking(s) and {resource_count} resource(s)")

    # Delete bookings where user is customer
    db.query(Booking).filter(Booking.customer_id == user_id).delete()
    
    # Unlink resources from this user (set user_id to NULL instead of deleting)
    db.query(Resource).filter(Resource.user_id == user_id).update({"user_id": None})
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted", "appointments_deleted": booking_count, "resources_unlinked": resource_count}


# ---------- USER APPOINTMENT COUNT ----------
@app.get("/api/users/{user_id}/appointments/count")
def get_user_appointment_count(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    booking_count = db.query(Booking).filter(Booking.customer_id == user_id).count()
    resource_count = db.query(Resource).filter(Resource.user_id == user_id).count()
    
    return {
        "appointment_count": booking_count,
        "resource_count": resource_count,
        "total_references": booking_count + resource_count
    }


# ---------- STATS ----------
@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "total_admins": db.query(User).filter(User.role == UserRole.ADMIN).count(),
        "total_organisers": db.query(User).filter(User.role == UserRole.ORGANISER).count(),
        "total_customers": db.query(User).filter(User.role == UserRole.CUSTOMER).count(),
        "active_users": db.query(User).filter(User.is_active == True).count(),
    }


@app.post("/api/auth/forgot-password")
def forgot_password(email: EmailStr, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(100000, 999999))
    RESET_OTP_STORE[email] = otp

    send_otp_email(email, otp)

    return {"message": "OTP sent to email"}


@app.post("/api/auth/reset-password")
def reset_password(
    email: EmailStr,
    otp: str,
    new_password: str,
    db: Session = Depends(get_db),
):
    if RESET_OTP_STORE.get(email) != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = pwd_context.hash(new_password)
    db.commit()

    RESET_OTP_STORE.pop(email, None)
    return {"message": "Password reset successful"}
