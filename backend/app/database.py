from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base
import os

# Create engine (should match alembic.ini but likely read from env)
# For now hardcoding or using the one from alembic.ini for consistency
DATABASE_URL = "postgresql+psycopg2://postgres:akrSQL%4005@localhost:5432/odoo_appointment"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
