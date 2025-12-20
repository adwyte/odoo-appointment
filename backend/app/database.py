from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base
import os

<<<<<<< HEAD
# Create engine (should match alembic.ini but likely read from env)
# For now hardcoding or using the one from alembic.ini for consistency
DATABASE_URL = "postgresql+psycopg2://postgres:akrSQL%%4005@localhost/odoo_appointment"
=======
# Create engine (should match alembic.ini)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:Sansku%23062005@localhost:5432/odoo_appointment"
)
>>>>>>> d364fdd (Fix appointment booking - update service IDs to match database)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
