from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import time
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.models import Schedule, Resource, User, UserRole

router = APIRouter()


# Schemas
class ScheduleCreate(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str   # "HH:MM" format
    end_time: str     # "HH:MM" format
    is_unavailable: bool = False


class ScheduleOut(BaseModel):
    id: int
    resource_id: int
    day_of_week: int
    start_time: str
    end_time: str
    is_unavailable: bool

    class Config:
        from_attributes = True


class ScheduleUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_unavailable: Optional[bool] = None


def parse_time(time_str: str) -> time:
    """Parse HH:MM string to time object"""
    parts = time_str.split(":")
    return time(int(parts[0]), int(parts[1]))


def format_time(t: time) -> str:
    """Format time object to HH:MM string"""
    return t.strftime("%H:%M")


def get_or_create_resource_for_user(user_id: int, db: Session) -> Resource:
    """Get or create a resource linked to this user"""
    resource = db.query(Resource).filter(Resource.user_id == user_id).first()
    if not resource:
        # Create a default resource for this user
        user = db.query(User).filter(User.id == user_id).first()
        resource = Resource(
            name=user.full_name if user else f"User {user_id}",
            description="Auto-created resource for organiser",
            user_id=user_id
        )
        db.add(resource)
        db.commit()
        db.refresh(resource)
    return resource


@router.get("/schedules", response_model=List[ScheduleOut])
def get_schedules(
    user_id: int = Query(..., description="User ID to get schedules for"),
    db: Session = Depends(get_db),
):
    """
    Get all schedules for a user's resource.
    """
    resource = db.query(Resource).filter(Resource.user_id == user_id).first()
    if not resource:
        return []

    schedules = db.query(Schedule).filter(Schedule.resource_id == resource.id).all()
    
    return [
        ScheduleOut(
            id=s.id,
            resource_id=s.resource_id,
            day_of_week=s.day_of_week,
            start_time=format_time(s.start_time),
            end_time=format_time(s.end_time),
            is_unavailable=s.is_unavailable
        )
        for s in schedules
    ]


@router.post("/schedules", response_model=ScheduleOut)
def create_or_update_schedule(
    schedule_data: ScheduleCreate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db),
):
    """
    Create or update a schedule for a specific day.
    If a schedule exists for that day, it will be updated.
    """
    resource = get_or_create_resource_for_user(user_id, db)

    # Check if schedule for this day already exists
    existing = db.query(Schedule).filter(
        Schedule.resource_id == resource.id,
        Schedule.day_of_week == schedule_data.day_of_week
    ).first()

    start = parse_time(schedule_data.start_time)
    end = parse_time(schedule_data.end_time)

    if existing:
        # Update existing
        existing.start_time = start
        existing.end_time = end
        existing.is_unavailable = schedule_data.is_unavailable
        db.commit()
        db.refresh(existing)
        schedule = existing
    else:
        # Create new
        schedule = Schedule(
            resource_id=resource.id,
            day_of_week=schedule_data.day_of_week,
            start_time=start,
            end_time=end,
            is_unavailable=schedule_data.is_unavailable
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)

    return ScheduleOut(
        id=schedule.id,
        resource_id=schedule.resource_id,
        day_of_week=schedule.day_of_week,
        start_time=format_time(schedule.start_time),
        end_time=format_time(schedule.end_time),
        is_unavailable=schedule.is_unavailable
    )


@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a schedule entry.
    """
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    db.delete(schedule)
    db.commit()

    return {"message": "Schedule deleted successfully"}


@router.post("/schedules/bulk")
def bulk_update_schedules(
    schedules: List[ScheduleCreate],
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db),
):
    """
    Bulk update all schedules for a user.
    Replaces all existing schedules with the provided list.
    """
    resource = get_or_create_resource_for_user(user_id, db)

    # Delete all existing schedules for this resource
    db.query(Schedule).filter(Schedule.resource_id == resource.id).delete()

    # Create new schedules
    created = []
    for schedule_data in schedules:
        schedule = Schedule(
            resource_id=resource.id,
            day_of_week=schedule_data.day_of_week,
            start_time=parse_time(schedule_data.start_time),
            end_time=parse_time(schedule_data.end_time),
            is_unavailable=schedule_data.is_unavailable
        )
        db.add(schedule)
        created.append(schedule)

    db.commit()

    return {
        "message": f"Successfully updated {len(created)} schedules",
        "count": len(created)
    }
