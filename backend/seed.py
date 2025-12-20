from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import Base, User, AppointmentType, Resource, Schedule, UserRole
from datetime import time
import sys

def seed():
    db = SessionLocal()
    try:
        # 1. Create a dummy Organiser User
        organiser = db.query(User).filter(User.email == "org@example.com").first()
        if not organiser:
            print("Creating organiser...")
            organiser = User(
                email="org@example.com",
                password_hash="hashed_secret",
                full_name="Dr. House",
                role=UserRole.ORGANISER
            )
            db.add(organiser)
            db.commit()
            db.refresh(organiser)

        # 2. Create Appointment Types (matching frontend services)
        services = [
            {"id": 1, "name": "Hair Styling", "duration": 60},
            {"id": 2, "name": "Medical Consultation", "duration": 30},
            {"id": 3, "name": "Massage Therapy", "duration": 90},
            {"id": 4, "name": "Dental Checkup", "duration": 45},
            {"id": 5, "name": "Fitness Training", "duration": 60},
            {"id": 6, "name": "Photography Session", "duration": 120},
        ]
        
        for svc in services:
            existing = db.query(AppointmentType).filter(AppointmentType.id == svc["id"]).first()
            if not existing:
                print(f"Creating Appointment Type: {svc['name']}...")
                appt_type = AppointmentType(
                    id=svc["id"],
                    name=svc["name"],
                    description=f"{svc['name']} service",
                    duration_minutes=svc["duration"],
                    is_published=True,
                    owner_id=organiser.id,
                    max_bookings_per_slot=3
                )
                db.add(appt_type)
        db.commit()

        # 3. Create a Resource (e.g., Doctor)
        resource = db.query(Resource).filter(Resource.name == "Dr. House").first()
        if not resource:
            print("Creating Resource...")
            resource = Resource(
                name="Dr. House",
                description="Chief of Diagnostic Medicine",
                user_id=organiser.id
            )
            db.add(resource)
            db.commit()
            db.refresh(resource)

        # 4. Create Schedule (Mon-Fri 9-5)
        if not resource.schedules:
            print("Creating Schedules (Mon-Fri 09:00 - 17:00)...")
            for day in range(0, 5):
                schedule = Schedule(
                    resource_id=resource.id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0)
                )
                db.add(schedule)
            db.commit()

        print("Seeding complete! You can now query slots.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
