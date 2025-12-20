from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import Base, User, AppointmentType, Resource, Schedule, UserRole
from datetime import time
import sys

# Create tables if they don't exist (though alembic should have done this)
# Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # 1. Create a dummy Organiser User
        organiser = db.query(User).filter(User.email == "org@example.com").first()
        if not organiser:
            print("Creating organiser...")
            organiser = User(
                email="org@example.com",
                password_hash="hashed_secret", # In real app, hash this!
                full_name="Dr. House",
                role=UserRole.ORGANISER
            )
            db.add(organiser)
            db.commit()
            db.refresh(organiser)

        # 2. Create Appointment Type (Service) - This has ID 1
        service = db.query(AppointmentType).filter(AppointmentType.id == 1).first()
        if not service:
            print("Creating Appointment Type (General Consultation)...")
            service = AppointmentType(
                id=1, # Force ID 1 as frontend expects it
                name="General Consultation",
                description="Standard checkup",
                duration_minutes=30,
                is_published=True,
                owner_id=organiser.id,
                max_bookings_per_slot=3
            )
            db.add(service)
            db.commit()
        else:
            print("Appointment Type already exists.")

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
            
            # Link resource to appointment type
            # We need to do this via the secondary table or relationship append
            service.resources.append(resource)
            db.commit()

        # 4. Create Schedule (Mon-Fri 9-5)
        # Check if schedule exists
        if not resource.schedules:
            print("Creating Schedules (Mon-Fri 09:00 - 17:00)...")
            for day in range(0, 5): # 0=Mon, 4=Fri
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
