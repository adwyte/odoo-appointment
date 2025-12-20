from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from app.database import DATABASE_URL
from app.models.models import Base, User, UserRole
from app.api import appointments

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI app
app = FastAPI(title="UrbanCare API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include appointments router
app.include_router(appointments.router, prefix="/api")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic schemas
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


class StatsResponse(BaseModel):
    total_users: int
    total_providers: int
    total_appointments: int
    total_revenue: float


# Routes
@app.get("/")
def root():
    return {"message": "Welcome to UrbanCare API"}


@app.get("/api/users", response_model=list[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if user.role else "customer",
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )
        for user in users
    ]


@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if user.role else "customer",
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at
    )


@app.post("/api/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Map role string to enum
    role_map = {
        "customer": UserRole.CUSTOMER,
        "admin": UserRole.ADMIN,
        "organiser": UserRole.ORGANISER,
    }
    
    user = User(
        email=user_data.email,
        password_hash=user_data.password,  # In production, hash this!
        full_name=user_data.full_name,
        role=role_map.get(user_data.role, UserRole.CUSTOMER),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if user.role else "customer",
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at
    )


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
        role=user.role.value if user.role else "customer",
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at
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
    total_providers = db.query(User).filter(User.role == UserRole.ORGANISER).count()
    # For now, return placeholder values for appointments and revenue
    return StatsResponse(
        total_users=total_users,
        total_providers=total_providers,
        total_appointments=0,
        total_revenue=0.0
    )
