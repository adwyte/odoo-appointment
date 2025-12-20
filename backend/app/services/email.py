import smtplib
from email.message import EmailMessage
import os

def send_otp_email(to_email: str, otp: str):
    msg = EmailMessage()
    msg["Subject"] = "UrbanCare Password Reset OTP"
    msg["From"] = os.getenv("GMAIL_USER")
    msg["To"] = to_email
    msg.set_content(f"Your OTP is: {otp}")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(
            os.getenv("GMAIL_USER"),
            os.getenv("GMAIL_APP_PASSWORD"),
        )
        server.send_message(msg)
