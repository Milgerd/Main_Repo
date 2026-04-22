from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("PostgreSQL connection successful:", result.fetchone())
except Exception as e:
    print("PostgreSQL connection failed:", e)
