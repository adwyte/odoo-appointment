from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os

from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv

from app.models.models import User, UserRole, Booking
from app.api import appointments, auth
from app.database import get_db

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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

# Routers
app.include_router(appointments.router, prefix="/api")
app.include_router(auth.router)  # safe to keep even if unused


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


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
    is_active: bool
    is_verified: bool
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


@app.get("/")
def root():
    return {"message": "Welcome to UrbanCare API"}

# ---------- SIGN UP ----------
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
        password_hash=hash_password(user_data.password),  # ✅ FIXED
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


# ---------- GET ALL USERS ----------
@app.get("/api/users")
def get_users(limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).limit(limit).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            is_active=u.is_active if u.is_active is not None else True,
            is_verified=u.is_verified if u.is_verified is not None else False,
            created_at=u.created_at,
        )
        for u in users
    ]


# ---------- GET USER BY ID ----------
@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active if user.is_active is not None else True,
        is_verified=user.is_verified if user.is_verified is not None else False,
        created_at=user.created_at,
    )


# ---------- UPDATE USER ----------
@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields if provided
    if user_data.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.role is not None:
        role_map = {
            "customer": UserRole.CUSTOMER,
            "admin": UserRole.ADMIN,
            "organiser": UserRole.ORGANISER,
        }
        user.role = role_map.get(user_data.role, UserRole.CUSTOMER)

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
        is_active=user.is_active if user.is_active is not None else True,
        is_verified=user.is_verified if user.is_verified is not None else False,
        created_at=user.created_at,
    )


# ---------- GET USER APPOINTMENT COUNT ----------
@app.get("/api/users/{user_id}/appointments/count")
def get_user_appointment_count(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    appointment_count = db.query(Booking).filter(Booking.customer_id == user_id).count()
    return {"appointment_count": appointment_count}


# ---------- DELETE USER ----------
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, force: bool = False, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for appointments
    appointment_count = db.query(Booking).filter(Booking.customer_id == user_id).count()
    
    if appointment_count > 0 and not force:
        raise HTTPException(
            status_code=400, 
            detail=f"User has {appointment_count} appointment(s). Use force=true to delete anyway."
        )
    
    # Delete all user's appointments first
    if appointment_count > 0:
        db.query(Booking).filter(Booking.customer_id == user_id).delete()
    
    # Delete the user
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully", "appointments_deleted": appointment_count}


# ---------- USER STATS ----------
@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_admins = db.query(User).filter(User.role == UserRole.ADMIN).count()
    total_organisers = db.query(User).filter(User.role == UserRole.ORGANISER).count()
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_organisers": total_organisers,
        "total_customers": total_customers,
        "active_users": active_users,
    }
