from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(prefix="/payments", tags=["payments"])


# ---------- Schemas ----------
class PaymentInitIn(BaseModel):
    booking_id: int
    amount: int
    currency: str = "INR"
    provider: str = "mock"  # must match enum paymentprovider


class PaymentSuccessIn(BaseModel):
    payment_id: int


# ---------- Helpers ----------
def _row_or_404(row, msg: str):
    if not row:
        raise HTTPException(status_code=404, detail=msg)
    return row


# ---------- Routes ----------
@router.get("/checkout")
def get_checkout_details(
    booking_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Returns price + service + customer details for a booking.
    """
    row = db.execute(
        text("""
            SELECT
                b.id AS booking_id,
                u.full_name AS customer_name,
                u.email AS customer_email,
                at.name AS service_name,
                COALESCE(s.price_amount, 1000) AS price,
                COALESCE(s.currency, 'INR') AS currency,
                b.start_time AS start_time,
                b.end_time AS end_time
            FROM bookings b
            JOIN users u ON u.id = b.customer_id
            JOIN appointment_types at ON at.id = b.appointment_type_id
            LEFT JOIN services s ON s.name = at.name
            WHERE b.id = :booking_id
        """),
        {"booking_id": booking_id}
    ).mappings().first()

    _row_or_404(row, "Booking not found")

    price = int(row["price"])
    tax = int(round(price * 0.10))
    total = price + tax

    return {
        "booking_id": row["booking_id"],
        "customer_name": row["customer_name"],
        "customer_email": row["customer_email"],
        "service_name": row["service_name"],
        "price": price,
        "tax": tax,
        "total": total,
        "currency": row["currency"],
        "start_time": str(row["start_time"]),
        "end_time": str(row["end_time"]),
    }


@router.post("/init")
def init_payment(payload: PaymentInitIn, db: Session = Depends(get_db)):
    """
    Creates a payment row with status = initiated (or succeeded if you want).
    """
    # verify booking exists
    booking = db.execute(
        text("SELECT id FROM bookings WHERE id = :bid"),
        {"bid": payload.booking_id}
    ).mappings().first()
    _row_or_404(booking, "Booking not found")

    row = db.execute(
        text("""
            INSERT INTO payments (booking_id, amount, currency, provider, status, provider_ref)
            VALUES (
                :booking_id,
                :amount,
                :currency,
                (:provider)::paymentprovider,
                ('initiated')::paymentstatus,
                NULL
            )
            RETURNING
                id,
                booking_id,
                amount,
                currency,
                provider::text AS provider,
                status::text AS status,
                created_at
        """),
        {
            "booking_id": payload.booking_id,
            "amount": payload.amount,
            "currency": payload.currency,
            "provider": payload.provider,
        }
    ).mappings().first()

    db.commit()

    return dict(row)


@router.post("/success")
def mark_payment_success(payload: PaymentSuccessIn, db: Session = Depends(get_db)):
    """
    Marks payment as succeeded and updates booking.payment_status to 'paid'.
    """
    payment = db.execute(
        text("SELECT id, booking_id FROM payments WHERE id = :pid"),
        {"pid": payload.payment_id}
    ).mappings().first()
    _row_or_404(payment, "Payment not found")

    db.execute(
        text("""
            UPDATE payments
            SET status = ('succeeded')::paymentstatus,
                updated_at = now()
            WHERE id = :pid
        """),
        {"pid": payload.payment_id}
    )

    # your bookings.payment_status is TEXT currently, so update text value
    db.execute(
        text("""
            UPDATE bookings
            SET payment_status = 'paid'
            WHERE id = :bid
        """),
        {"bid": payment["booking_id"]}
    )

    db.commit()

    return {"ok": True, "payment_id": payload.payment_id, "booking_id": payment["booking_id"]}


@router.get("/receipt")
def get_receipt(
    payment_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Returns receipt details for a given payment_id.
    """
    row = db.execute(
        text("""
            SELECT
                p.id AS payment_id,
                p.booking_id AS booking_id,
                p.amount AS amount,
                p.currency AS currency,
                p.provider::text AS provider,
                p.status::text AS status,
                p.created_at AS paid_at,

                b.start_time AS start_time,
                b.end_time AS end_time,

                u.full_name AS customer_name,
                u.email AS customer_email,

                at.name AS service_name,
                COALESCE(s.price_amount, 1000) AS base_price
            FROM payments p
            JOIN bookings b ON b.id = p.booking_id
            JOIN users u ON u.id = b.customer_id
            JOIN appointment_types at ON at.id = b.appointment_type_id
            LEFT JOIN services s ON s.name = at.name
            WHERE p.id = :pid
        """),
        {"pid": payment_id}
    ).mappings().first()

    _row_or_404(row, "Receipt not found")

    base_price = int(row["base_price"])
    tax = int(round(base_price * 0.10))
    total = base_price + tax

    return {
        "receipt_no": f"URB-{row['payment_id']:06d}",
        "payment_id": row["payment_id"],
        "booking_id": row["booking_id"],
        "status": row["status"],
        "provider": row["provider"],
        "currency": row["currency"],

        "customer_name": row["customer_name"],
        "customer_email": row["customer_email"],
        "service_name": row["service_name"],

        "base_price": base_price,
        "tax": tax,
        "total": total,

        "paid_at": str(row["paid_at"]),
        "start_time": str(row["start_time"]),
        "end_time": str(row["end_time"]),
    }