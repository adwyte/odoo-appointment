from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, 
    Text, Enum, Interval, Time
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import datetime
import enum

Base = declarative_base()

# Enums
class UserRole(enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    ORGANISER = "organiser"

class BookingStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    MREFUNDED = "refunded"

class ResourceAssignmentType(enum.Enum):
    AUTO = "auto"
    MANUAL = "manual"

class QuestionType(enum.Enum):
    TEXT = "text"
    CHOICE = "choice"
    CHECKBOX = "checkbox"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    MREFUNDED = "refunded"
# Models

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bookings = relationship("Booking", back_populates="customer")
    # For organisers/admins who own appointment types
    appointment_types = relationship("AppointmentType", back_populates="owner")

class Resource(Base):
    """
    Represents a person (e.g., Doctor) or object (e.g., Room) that can be booked.
    """
    __tablename__ = 'resources'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    calendar_color = Column(String)
    
    # If this resource is linked to a specific system user (e.g. a Doctor logging in)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    slots = relationship("Slot", back_populates="resource")
    bookings = relationship("Booking", back_populates="resource")
    appointment_types = relationship("AppointmentType", secondary="appointment_type_resources", back_populates="resources")
    schedules = relationship("Schedule", back_populates="resource")

class AppointmentType(Base):
    """
    Defines the service being booked (e.g., "General Consultation").
    """
    __tablename__ = 'appointment_types'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, default=30)
    price = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    
    owner_id = Column(Integer, ForeignKey('users.id')) # The organiser creating this
    
    # Configuration
    max_bookings_per_slot = Column(Integer, default=1)
    advance_payment_required = Column(Boolean, default=False)
    requires_confirmation = Column(Boolean, default=False)
    resource_assignment_type = Column(Enum(ResourceAssignmentType), default=ResourceAssignmentType.AUTO)

    # Relationships
    owner = relationship("User", back_populates="appointment_types")
    resources = relationship("Resource", secondary="appointment_type_resources", back_populates="appointment_types")
    questions = relationship("QuestionDefinition", back_populates="appointment_type")
    bookings = relationship("Booking", back_populates="appointment_type")

# Association table for Many-to-Many between AppointmentType and Resource
class AppointmentTypeResource(Base):
    __tablename__ = 'appointment_type_resources'
    
    appointment_type_id = Column(Integer, ForeignKey('appointment_types.id'), primary_key=True)
    resource_id = Column(Integer, ForeignKey('resources.id'), primary_key=True)

class Schedule(Base):
    """
    Defines working hours for a resource (e.g., Mon 9am-5pm).
    """
    __tablename__ = 'schedules'

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=False)
    day_of_week = Column(Integer, nullable=False) # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_unavailable = Column(Boolean, default=False) # If true, this represents a break

    resource = relationship("Resource", back_populates="schedules")

class Slot(Base):
    """
    Pre-generated time slots based on Resource Schedule and AppointmentType duration.
    """
    __tablename__ = 'slots'

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True)
    current_bookings_count = Column(Integer, default=0)

    # Relationships
    resource = relationship("Resource", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

class QuestionDefinition(Base):
    """
    Questions configured for a specific appointment type.
    """
    __tablename__ = 'question_definitions'

    id = Column(Integer, primary_key=True, index=True)
    appointment_type_id = Column(Integer, ForeignKey('appointment_types.id'))
    question_text = Column(String, nullable=False)
    question_type = Column(Enum(QuestionType), default=QuestionType.TEXT)
    is_required = Column(Boolean, default=False)

    appointment_type = relationship("AppointmentType", back_populates="questions")

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    appointment_type_id = Column(Integer, ForeignKey('appointment_types.id'), nullable=False)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=True) # Assigned resource
    slot_id = Column(Integer, ForeignKey('slots.id'), nullable=True) # Specific slot
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Relationships
    customer = relationship("User", back_populates="bookings")
    appointment_type = relationship("AppointmentType", back_populates="bookings")
    resource = relationship("Resource", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")
    answers = relationship("BookingAnswer", back_populates="booking")

class BookingAnswer(Base):
    __tablename__ = 'booking_answers'

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey('bookings.id'))
    question_id = Column(Integer, ForeignKey('question_definitions.id')) # Link to the definition
    answer_text = Column(Text)

    booking = relationship("Booking", back_populates="answers")
