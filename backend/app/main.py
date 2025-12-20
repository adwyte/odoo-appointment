from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import os

from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from app.core.deps import get_current_user
from app.models.models import User, UserRole, Booking
from app.api import appointments, auth, payments
from app.database import get_db

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

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
app.include_router(payments.router, prefix="/api")


# =====================
# SECURITY
# =====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


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
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]

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
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

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

    token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value,
    })

    return {"access_token": token}


# ---------- USERS ----------
@app.get("/api/users")
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

    for field, value in data.dict(exclude_unset=True).items():
        if field == "role":
            value = UserRole[value.upper()]
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, force: bool = False, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    count = db.query(Booking).filter(Booking.customer_id == user_id).count()
    if count > 0 and not force:
        raise HTTPException(status_code=400, detail="User has bookings")

    db.query(Booking).filter(Booking.customer_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "User deleted", "appointments_deleted": count}


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

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )