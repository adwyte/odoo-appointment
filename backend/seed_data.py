"""
Seed script to populate the database with test data for UrbanCare
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta, time
from app.models.models import (
    Base, User, Resource, AppointmentType, AppointmentTypeResource,
    Schedule, Slot, QuestionDefinition, Booking, BookingAnswer,
    UserRole, BookingStatus, PaymentStatus, ResourceAssignmentType, QuestionType
)
import hashlib

# Database connection
DATABASE_URL = "postgresql://postgres:Sansku%23062005@localhost/odoo_appointment"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def hash_password(password: str) -> str:
    """Simple password hashing for test data"""
    return hashlib.sha256(password.encode()).hexdigest()

def seed_data():
    db = SessionLocal()
    
    try:
        # Clear existing data (in reverse order of dependencies)
        print("🗑️  Clearing existing data...")
        db.query(BookingAnswer).delete()
        db.query(Booking).delete()
        db.query(Slot).delete()
        db.query(Schedule).delete()
        db.query(QuestionDefinition).delete()
        db.query(AppointmentTypeResource).delete()
        db.query(AppointmentType).delete()
        db.query(Resource).delete()
        db.query(User).delete()
        db.commit()
        
        print("👤 Creating users...")
        # Create Users
        users = [
            # Admins
            User(
                email="admin@urbancare.com",
                password_hash=hash_password("admin123"),
                full_name="Super Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            ),
            User(
                email="john.admin@urbancare.com",
                password_hash=hash_password("admin123"),
                full_name="John Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            ),
            # Organisers (Service Providers)
            User(
                email="dr.sarah@urbancare.com",
                password_hash=hash_password("doctor123"),
                full_name="Dr. Sarah Johnson",
                role=UserRole.ORGANISER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="dr.mike@urbancare.com",
                password_hash=hash_password("doctor123"),
                full_name="Dr. Mike Chen",
                role=UserRole.ORGANISER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="lisa.style@urbancare.com",
                password_hash=hash_password("stylist123"),
                full_name="Lisa Martinez",
                role=UserRole.ORGANISER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="wellness@urbancare.com",
                password_hash=hash_password("wellness123"),
                full_name="Emma Thompson",
                role=UserRole.ORGANISER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="dental@urbancare.com",
                password_hash=hash_password("dental123"),
                full_name="Dr. James Wilson",
                role=UserRole.ORGANISER,
                is_active=True,
                is_verified=True
            ),
            # Customers
            User(
                email="alice@example.com",
                password_hash=hash_password("customer123"),
                full_name="Alice Johnson",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="bob@example.com",
                password_hash=hash_password("customer123"),
                full_name="Bob Smith",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="carol@example.com",
                password_hash=hash_password("customer123"),
                full_name="Carol White",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="david@example.com",
                password_hash=hash_password("customer123"),
                full_name="David Brown",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="emma@example.com",
                password_hash=hash_password("customer123"),
                full_name="Emma Davis",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="frank@example.com",
                password_hash=hash_password("customer123"),
                full_name="Frank Miller",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=False
            ),
            User(
                email="grace@example.com",
                password_hash=hash_password("customer123"),
                full_name="Grace Lee",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="henry@example.com",
                password_hash=hash_password("customer123"),
                full_name="Henry Taylor",
                role=UserRole.CUSTOMER,
                is_active=False,
                is_verified=True
            ),
            User(
                email="ivy@example.com",
                password_hash=hash_password("customer123"),
                full_name="Ivy Anderson",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="jack@example.com",
                password_hash=hash_password("customer123"),
                full_name="Jack Thomas",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            ),
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Refresh to get IDs
        for user in users:
            db.refresh(user)
        
        # Create a dictionary for easy lookup
        user_dict = {u.email: u for u in users}
        
        print("🏥 Creating resources...")
        # Create Resources (linked to organiser users)
        resources = [
            Resource(
                name="Dr. Sarah Johnson",
                description="General Practitioner with 10+ years experience",
                calendar_color="#4CAF50",
                user_id=user_dict["dr.sarah@urbancare.com"].id
            ),
            Resource(
                name="Dr. Mike Chen",
                description="Specialist in Internal Medicine",
                calendar_color="#2196F3",
                user_id=user_dict["dr.mike@urbancare.com"].id
            ),
            Resource(
                name="Lisa - Hair Stylist",
                description="Expert hair stylist and colorist",
                calendar_color="#E91E63",
                user_id=user_dict["lisa.style@urbancare.com"].id
            ),
            Resource(
                name="Emma - Wellness Expert",
                description="Certified massage therapist and wellness coach",
                calendar_color="#9C27B0",
                user_id=user_dict["wellness@urbancare.com"].id
            ),
            Resource(
                name="Dr. James Wilson",
                description="Dental surgeon with expertise in cosmetic dentistry",
                calendar_color="#00BCD4",
                user_id=user_dict["dental@urbancare.com"].id
            ),
            Resource(
                name="Room A",
                description="Consultation Room A - Ground Floor",
                calendar_color="#FF9800",
                user_id=None
            ),
            Resource(
                name="Room B",
                description="Treatment Room B - First Floor",
                calendar_color="#795548",
                user_id=None
            ),
        ]
        
        for resource in resources:
            db.add(resource)
        db.commit()
        
        for resource in resources:
            db.refresh(resource)
        
        resource_dict = {r.name: r for r in resources}
        
        print("📋 Creating appointment types...")
        # Create Appointment Types
        appointment_types = [
            AppointmentType(
                name="General Consultation",
                description="30-minute general health consultation with a doctor",
                duration_minutes=30,
                is_published=True,
                owner_id=user_dict["dr.sarah@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=False,
                requires_confirmation=False,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
            AppointmentType(
                name="Specialist Consultation",
                description="45-minute consultation with internal medicine specialist",
                duration_minutes=45,
                is_published=True,
                owner_id=user_dict["dr.mike@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=True,
                requires_confirmation=True,
                resource_assignment_type=ResourceAssignmentType.MANUAL
            ),
            AppointmentType(
                name="Hair Styling",
                description="Professional hair styling session",
                duration_minutes=60,
                is_published=True,
                owner_id=user_dict["lisa.style@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=False,
                requires_confirmation=False,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
            AppointmentType(
                name="Hair Coloring",
                description="Full hair coloring service with premium products",
                duration_minutes=120,
                is_published=True,
                owner_id=user_dict["lisa.style@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=True,
                requires_confirmation=True,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
            AppointmentType(
                name="Massage Therapy",
                description="60-minute relaxing massage therapy session",
                duration_minutes=60,
                is_published=True,
                owner_id=user_dict["wellness@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=False,
                requires_confirmation=False,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
            AppointmentType(
                name="Wellness Coaching",
                description="Personal wellness and health coaching session",
                duration_minutes=45,
                is_published=True,
                owner_id=user_dict["wellness@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=False,
                requires_confirmation=False,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
            AppointmentType(
                name="Dental Checkup",
                description="Routine dental checkup and cleaning",
                duration_minutes=30,
                is_published=True,
                owner_id=user_dict["dental@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=False,
                requires_confirmation=False,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
            AppointmentType(
                name="Teeth Whitening",
                description="Professional teeth whitening treatment",
                duration_minutes=60,
                is_published=True,
                owner_id=user_dict["dental@urbancare.com"].id,
                max_bookings_per_slot=1,
                advance_payment_required=True,
                requires_confirmation=True,
                resource_assignment_type=ResourceAssignmentType.AUTO
            ),
        ]
        
        for apt_type in appointment_types:
            db.add(apt_type)
        db.commit()
        
        for apt_type in appointment_types:
            db.refresh(apt_type)
        
        apt_dict = {a.name: a for a in appointment_types}
        
        print("🔗 Linking appointment types to resources...")
        # Link Appointment Types to Resources
        apt_resource_links = [
            (apt_dict["General Consultation"], resource_dict["Dr. Sarah Johnson"]),
            (apt_dict["Specialist Consultation"], resource_dict["Dr. Mike Chen"]),
            (apt_dict["Hair Styling"], resource_dict["Lisa - Hair Stylist"]),
            (apt_dict["Hair Coloring"], resource_dict["Lisa - Hair Stylist"]),
            (apt_dict["Massage Therapy"], resource_dict["Emma - Wellness Expert"]),
            (apt_dict["Wellness Coaching"], resource_dict["Emma - Wellness Expert"]),
            (apt_dict["Dental Checkup"], resource_dict["Dr. James Wilson"]),
            (apt_dict["Teeth Whitening"], resource_dict["Dr. James Wilson"]),
            # Also link rooms
            (apt_dict["General Consultation"], resource_dict["Room A"]),
            (apt_dict["Specialist Consultation"], resource_dict["Room A"]),
            (apt_dict["Massage Therapy"], resource_dict["Room B"]),
        ]
        
        for apt_type, resource in apt_resource_links:
            link = AppointmentTypeResource(
                appointment_type_id=apt_type.id,
                resource_id=resource.id
            )
            db.add(link)
        db.commit()
        
        print("📅 Creating schedules...")
        # Create Schedules for each resource (Mon-Fri 9am-5pm)
        for resource in resources:
            for day in range(5):  # Monday to Friday
                schedule = Schedule(
                    resource_id=resource.id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    is_unavailable=False
                )
                db.add(schedule)
                
                # Add lunch break
                lunch_break = Schedule(
                    resource_id=resource.id,
                    day_of_week=day,
                    start_time=time(12, 0),
                    end_time=time(13, 0),
                    is_unavailable=True
                )
                db.add(lunch_break)
        db.commit()
        
        print("🕐 Creating time slots...")
        # Create Slots for the next 7 days
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        slot_records = []
        for resource in resources:
            for day_offset in range(7):
                current_date = today + timedelta(days=day_offset)
                day_of_week = current_date.weekday()
                
                # Only create slots for weekdays
                if day_of_week < 5:
                    # Morning slots (9am - 12pm)
                    for hour in range(9, 12):
                        for minute in [0, 30]:
                            start = current_date.replace(hour=hour, minute=minute)
                            end = start + timedelta(minutes=30)
                            slot = Slot(
                                resource_id=resource.id,
                                start_time=start,
                                end_time=end,
                                is_available=True,
                                current_bookings_count=0
                            )
                            db.add(slot)
                            slot_records.append(slot)
                    
                    # Afternoon slots (1pm - 5pm)
                    for hour in range(13, 17):
                        for minute in [0, 30]:
                            start = current_date.replace(hour=hour, minute=minute)
                            end = start + timedelta(minutes=30)
                            slot = Slot(
                                resource_id=resource.id,
                                start_time=start,
                                end_time=end,
                                is_available=True,
                                current_bookings_count=0
                            )
                            db.add(slot)
                            slot_records.append(slot)
        
        db.commit()
        for slot in slot_records:
            db.refresh(slot)
        
        print("❓ Creating questions...")
        # Create Questions for Appointment Types
        questions = [
            QuestionDefinition(
                appointment_type_id=apt_dict["General Consultation"].id,
                question_text="What symptoms are you experiencing?",
                question_type=QuestionType.TEXT,
                is_required=True
            ),
            QuestionDefinition(
                appointment_type_id=apt_dict["General Consultation"].id,
                question_text="Do you have any allergies?",
                question_type=QuestionType.TEXT,
                is_required=False
            ),
            QuestionDefinition(
                appointment_type_id=apt_dict["Hair Styling"].id,
                question_text="What type of style are you looking for?",
                question_type=QuestionType.TEXT,
                is_required=True
            ),
            QuestionDefinition(
                appointment_type_id=apt_dict["Hair Coloring"].id,
                question_text="Have you colored your hair before?",
                question_type=QuestionType.CHOICE,
                is_required=True
            ),
            QuestionDefinition(
                appointment_type_id=apt_dict["Massage Therapy"].id,
                question_text="Do you have any areas of concern or pain?",
                question_type=QuestionType.TEXT,
                is_required=False
            ),
            QuestionDefinition(
                appointment_type_id=apt_dict["Dental Checkup"].id,
                question_text="When was your last dental visit?",
                question_type=QuestionType.TEXT,
                is_required=True
            ),
            QuestionDefinition(
                appointment_type_id=apt_dict["Dental Checkup"].id,
                question_text="Do you have any dental concerns?",
                question_type=QuestionType.CHECKBOX,
                is_required=False
            ),
        ]
        
        for question in questions:
            db.add(question)
        db.commit()
        
        for question in questions:
            db.refresh(question)
        
        print("📆 Creating bookings...")
        # Create Bookings with various statuses
        # Get some slots
        dr_sarah_resource = resource_dict["Dr. Sarah Johnson"]
        lisa_resource = resource_dict["Lisa - Hair Stylist"]
        emma_resource = resource_dict["Emma - Wellness Expert"]
        dr_james_resource = resource_dict["Dr. James Wilson"]
        
        # Get slots for each resource
        dr_sarah_slots = [s for s in slot_records if s.resource_id == dr_sarah_resource.id][:10]
        lisa_slots = [s for s in slot_records if s.resource_id == lisa_resource.id][:10]
        emma_slots = [s for s in slot_records if s.resource_id == emma_resource.id][:10]
        dr_james_slots = [s for s in slot_records if s.resource_id == dr_james_resource.id][:10]
        
        bookings_data = [
            # Confirmed bookings
            {
                "customer": user_dict["alice@example.com"],
                "apt_type": apt_dict["General Consultation"],
                "resource": dr_sarah_resource,
                "slot": dr_sarah_slots[0] if dr_sarah_slots else None,
                "status": BookingStatus.CONFIRMED,
                "payment_status": PaymentStatus.PAID
            },
            {
                "customer": user_dict["bob@example.com"],
                "apt_type": apt_dict["Hair Styling"],
                "resource": lisa_resource,
                "slot": lisa_slots[0] if lisa_slots else None,
                "status": BookingStatus.CONFIRMED,
                "payment_status": PaymentStatus.PENDING
            },
            {
                "customer": user_dict["carol@example.com"],
                "apt_type": apt_dict["Massage Therapy"],
                "resource": emma_resource,
                "slot": emma_slots[0] if emma_slots else None,
                "status": BookingStatus.CONFIRMED,
                "payment_status": PaymentStatus.PAID
            },
            # Pending bookings
            {
                "customer": user_dict["david@example.com"],
                "apt_type": apt_dict["Dental Checkup"],
                "resource": dr_james_resource,
                "slot": dr_james_slots[0] if dr_james_slots else None,
                "status": BookingStatus.PENDING,
                "payment_status": PaymentStatus.PENDING
            },
            {
                "customer": user_dict["emma@example.com"],
                "apt_type": apt_dict["Specialist Consultation"],
                "resource": resource_dict["Dr. Mike Chen"],
                "slot": None,
                "status": BookingStatus.PENDING,
                "payment_status": PaymentStatus.PENDING
            },
            {
                "customer": user_dict["frank@example.com"],
                "apt_type": apt_dict["Hair Coloring"],
                "resource": lisa_resource,
                "slot": lisa_slots[1] if len(lisa_slots) > 1 else None,
                "status": BookingStatus.PENDING,
                "payment_status": PaymentStatus.PENDING
            },
            # Completed bookings (in the past)
            {
                "customer": user_dict["grace@example.com"],
                "apt_type": apt_dict["General Consultation"],
                "resource": dr_sarah_resource,
                "slot": dr_sarah_slots[2] if len(dr_sarah_slots) > 2 else None,
                "status": BookingStatus.COMPLETED,
                "payment_status": PaymentStatus.PAID,
                "past": True
            },
            {
                "customer": user_dict["henry@example.com"],
                "apt_type": apt_dict["Wellness Coaching"],
                "resource": emma_resource,
                "slot": emma_slots[2] if len(emma_slots) > 2 else None,
                "status": BookingStatus.COMPLETED,
                "payment_status": PaymentStatus.PAID,
                "past": True
            },
            # Cancelled bookings
            {
                "customer": user_dict["ivy@example.com"],
                "apt_type": apt_dict["Teeth Whitening"],
                "resource": dr_james_resource,
                "slot": dr_james_slots[1] if len(dr_james_slots) > 1 else None,
                "status": BookingStatus.CANCELLED,
                "payment_status": PaymentStatus.PENDING
            },
            {
                "customer": user_dict["jack@example.com"],
                "apt_type": apt_dict["Hair Styling"],
                "resource": lisa_resource,
                "slot": lisa_slots[2] if len(lisa_slots) > 2 else None,
                "status": BookingStatus.CANCELLED,
                "payment_status": PaymentStatus.PENDING
            },
            # More varied bookings
            {
                "customer": user_dict["alice@example.com"],
                "apt_type": apt_dict["Massage Therapy"],
                "resource": emma_resource,
                "slot": emma_slots[3] if len(emma_slots) > 3 else None,
                "status": BookingStatus.CONFIRMED,
                "payment_status": PaymentStatus.PAID
            },
            {
                "customer": user_dict["bob@example.com"],
                "apt_type": apt_dict["Dental Checkup"],
                "resource": dr_james_resource,
                "slot": dr_james_slots[3] if len(dr_james_slots) > 3 else None,
                "status": BookingStatus.PENDING,
                "payment_status": PaymentStatus.PENDING
            },
            {
                "customer": user_dict["carol@example.com"],
                "apt_type": apt_dict["General Consultation"],
                "resource": dr_sarah_resource,
                "slot": dr_sarah_slots[4] if len(dr_sarah_slots) > 4 else None,
                "status": BookingStatus.CONFIRMED,
                "payment_status": PaymentStatus.PAID
            },
            {
                "customer": user_dict["david@example.com"],
                "apt_type": apt_dict["Hair Coloring"],
                "resource": lisa_resource,
                "slot": lisa_slots[4] if len(lisa_slots) > 4 else None,
                "status": BookingStatus.COMPLETED,
                "payment_status": PaymentStatus.PAID,
                "past": True
            },
            {
                "customer": user_dict["emma@example.com"],
                "apt_type": apt_dict["Wellness Coaching"],
                "resource": emma_resource,
                "slot": emma_slots[5] if len(emma_slots) > 5 else None,
                "status": BookingStatus.PENDING,
                "payment_status": PaymentStatus.PENDING
            },
        ]
        
        booking_objects = []
        for i, booking_data in enumerate(bookings_data):
            slot = booking_data.get("slot")
            is_past = booking_data.get("past", False)
            
            if slot:
                start_time = slot.start_time
                end_time = slot.end_time
                if is_past:
                    start_time = start_time - timedelta(days=7)
                    end_time = end_time - timedelta(days=7)
            else:
                # Default time for bookings without slots
                base_time = today + timedelta(days=i % 7, hours=10 + (i % 6))
                if is_past:
                    base_time = base_time - timedelta(days=7)
                start_time = base_time
                end_time = base_time + timedelta(minutes=booking_data["apt_type"].duration_minutes)
            
            booking = Booking(
                customer_id=booking_data["customer"].id,
                appointment_type_id=booking_data["apt_type"].id,
                resource_id=booking_data["resource"].id,
                slot_id=slot.id if slot else None,
                start_time=start_time,
                end_time=end_time,
                status=booking_data["status"],
                payment_status=booking_data["payment_status"]
            )
            db.add(booking)
            booking_objects.append(booking)
            
            # Update slot availability
            if slot:
                slot.is_available = False
                slot.current_bookings_count = 1
        
        db.commit()
        
        for booking in booking_objects:
            db.refresh(booking)
        
        print("📝 Creating booking answers...")
        # Create Booking Answers
        answers_data = [
            (booking_objects[0], questions[0], "Mild headache and fatigue for the past 3 days"),
            (booking_objects[0], questions[1], "Penicillin"),
            (booking_objects[1], questions[2], "Modern layered cut with some highlights"),
            (booking_objects[2], questions[4], "Lower back pain from sitting at desk"),
            (booking_objects[3], questions[5], "About 6 months ago"),
            (booking_objects[3], questions[6], "Sensitivity to cold"),
        ]
        
        for booking, question, answer in answers_data:
            answer_obj = BookingAnswer(
                booking_id=booking.id,
                question_id=question.id,
                answer_text=answer
            )
            db.add(answer_obj)
        
        db.commit()
        
        print("\n" + "=" * 50)
        print("✅ Database seeded successfully!")
        print("=" * 50)
        print(f"\n📊 Summary:")
        print(f"   • Users: {len(users)} (2 admins, 5 organisers, 10 customers)")
        print(f"   • Resources: {len(resources)}")
        print(f"   • Appointment Types: {len(appointment_types)}")
        print(f"   • Schedules: {len(resources) * 10} (5 days × 2 per resource)")
        print(f"   • Time Slots: {len(slot_records)}")
        print(f"   • Questions: {len(questions)}")
        print(f"   • Bookings: {len(booking_objects)}")
        print(f"   • Booking Answers: {len(answers_data)}")
        print("\n🔐 Test Login Credentials:")
        print("   Admin: admin@urbancare.com / admin123")
        print("   Doctor: dr.sarah@urbancare.com / doctor123")
        print("   Stylist: lisa.style@urbancare.com / stylist123")
        print("   Customer: alice@example.com / customer123")
        print("=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
