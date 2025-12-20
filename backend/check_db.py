from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import AppointmentType

def check_data():
    db = SessionLocal()
    try:
        types = db.query(AppointmentType).all()
        print(f"Found {len(types)} appointment types.")
        for t in types:
            print(f"ID: {t.id}, Name: {t.name}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
