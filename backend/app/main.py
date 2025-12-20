from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os

from passlib.context import CryptContext
from jose import jwt

from app.models.models import Base, User, UserRole
from app.api import appointments, auth

from dotenv import load_dotenv
load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL"
)

from app.database import get_db

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

app.include_router(appointments.router, prefix="/api")
app.include_router(auth.router)

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
