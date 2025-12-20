from sqlalchemy import text
from app.database import engine

conn = engine.connect()
# Check nullable status of appointment_id in payments table
result = conn.execute(text("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'appointment_id'"))
for r in result:
    print(r)
conn.close()
