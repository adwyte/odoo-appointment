from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(prefix="/payments", tags=["payments"])


# --------- Schemas ---------
class PaymentInitIn(BaseModel):
    booking_id: int
    amount: int
    currency: str = "INR"
    provider: str = "razorpay"   # must match enum paymentprovider (stripe or razorpay)


class PaymentSuccessIn(BaseModel):
    payment_id: int


# --------- Helpers ---------
def _calc_tax(price: int) -> int:
    return int(round(price * 0.10))  # 10%


# --------- APIs ---------
@router.get("/checkout")
def get_checkout_details(
    booking_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Returns price + service + customer details for a booking.
    Joins:
      bookings -> users
      bookings -> appointment_types
      appointment_types.name -> services.name (case-insensitive)
    """
    row = db.execute(
        text("""
            SELECT
                b.id AS booking_id,
                u.full_name AS customer_name,
                u.email AS customer_email,
                at.name AS service_name,
                COALESCE(
                    NULLIF(regexp_replace(at.price, '[^0-9]', '', 'g'), '')::int,
                    1000
                ) AS price,
                'INR' AS currency
            FROM bookings b
            JOIN users u ON u.id = b.customer_id
            JOIN appointment_types at ON at.id = b.appointment_type_id
            WHERE b.id = :booking_id
        """),
        {"booking_id": booking_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")

    price = int(row["price"])
    tax = _calc_tax(price)
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
    }


@router.post("/init")
def init_payment(payload: PaymentInitIn, db: Session = Depends(get_db)):
    """
    Creates a payment row linked to booking_id.
    NOTE: We do NOT touch appointment_id here (your FK caused issues earlier).
    """
    # sanity check: booking exists
    booking_exists = db.execute(
        text("SELECT 1 FROM bookings WHERE id = :bid"),
        {"bid": payload.booking_id},
    ).scalar()

    if not booking_exists:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        row = db.execute(
            text("""
                INSERT INTO payments (booking_id, amount, currency, provider, status, provider_ref)
                VALUES (
                    :booking_id,
                    :amount,
                    :currency,
                    :provider,
                    'PENDING',
                    NULL
                )
                RETURNING
                    id,
                    booking_id,
                    amount,
                    currency,
                    provider,
                    status,
                    provider_ref,
                    created_at
            """),
            {
                "booking_id": payload.booking_id,
                "amount": payload.amount,
                "currency": payload.currency,
                "provider": payload.provider,
            },
        ).mappings().first()

        db.commit()
        return dict(row)
    except Exception as e:
        db.rollback()
        print(f"PAYMENT INIT ERROR: {e}")  # Checking actual error
        raise HTTPException(status_code=400, detail=f"Payment init failed: {e}")


@router.post("/success")
def mark_payment_success(payload: PaymentSuccessIn, db: Session = Depends(get_db)):
    """
    Marks payment as succeeded and updates booking.payment_status to 'paid'.
    Your bookings.payment_status column is TEXT, so we store 'paid'.
    """
    try:
        p = db.execute(
            text("SELECT id, booking_id FROM payments WHERE id = :pid"),
            {"pid": payload.payment_id},
        ).mappings().first()

        if not p:
            raise HTTPException(status_code=404, detail="Payment not found")

        # update payment
        db.execute(
            text("""
                UPDATE payments
                SET status = 'PAID',
                    updated_at = NOW()
                WHERE id = :pid
            """),
            {"pid": payload.payment_id},
        )

        # update booking payment_status (TEXT column)
        db.execute(
            text("""
                UPDATE bookings
                SET payment_status = 'paid'
                WHERE id = :bid
            """),
            {"bid": p["booking_id"]},
        )

        db.commit()
        return {"ok": True, "payment_id": payload.payment_id, "booking_id": p["booking_id"]}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"PAYMENT SUCCESS ERROR: {e}")
        raise HTTPException(status_code=400, detail=f"Payment success failed: {e}")


@router.get("/receipt")
def get_payment_receipt(
    payment_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Returns receipt details for a succeeded payment.
    """
    row = db.execute(
        text("""
            SELECT
                p.id AS payment_id,
                p.amount,
                p.currency,
                p.provider,
                p.status,
                p.created_at AS paid_at,
                b.id AS booking_id,
                b.start_time,
                b.end_time,
                u.full_name AS customer_name,
                u.email AS customer_email,
                at.name AS service_name,
                at.duration_minutes
            FROM payments p
            JOIN bookings b ON b.id = p.booking_id
            JOIN users u ON u.id = b.customer_id
            JOIN appointment_types at ON at.id = b.appointment_type_id
            WHERE p.id = :pid
        """),
        {"pid": payment_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Receipt not found")

    # Simple logic to reverse-calc base price & tax if we only stored total amount
    # logic: total = base + 10% tax => total = 1.1 * base => base = total / 1.1
    total = row["amount"]
    base_price = int(total / 1.1)
    tax = total - base_price

    return {
        "receipt_no": f"RCT-{row['payment_id']:06d}",
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
        "paid_at": row["paid_at"],
        "start_time": row["start_time"],
        "end_time": row["end_time"],
    }