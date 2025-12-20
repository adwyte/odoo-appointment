from sqlalchemy import text
from app.database import engine

conn = engine.connect()
# Check enum types
result = conn.execute(text("SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname IN ('paymentprovider', 'paymentstatus')"))
for r in result:
    print(r)
conn.close()
