from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path
from app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///duo_leads.db":
    db_file = (Path(__file__).resolve().parent.parent.parent / "duo_leads.db").as_posix()
    db_url = f"sqlite:///{db_file}"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_migrations():
    """Ensure any newly added model columns exist on existing databases."""
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()

            if "leads" in existing_tables:
                columns = [c["name"] for c in inspector.get_columns("leads")]
                needed_columns = {
                    "category": "VARCHAR(255)",
                    "address": "TEXT",
                    "state": "VARCHAR(100)",
                    "phone": "VARCHAR(100)",
                    "website": "VARCHAR(500)",
                    "email": "VARCHAR(255)",
                    "review_count": "INTEGER DEFAULT 0",
                    "source": "VARCHAR(100) DEFAULT 'Google Places'",
                    "lead_score": "INTEGER DEFAULT 0",
                    "lead_status": "VARCHAR(50) DEFAULT 'NEW'"
                }
                for col_name, col_type in needed_columns.items():
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE leads ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            if "campaigns" in existing_tables:
                camp_cols = [c["name"] for c in inspector.get_columns("campaigns")]
                needed_camp_cols = {
                    "subject_template": "VARCHAR(500)",
                    "body_template": "TEXT",
                    "sender_email": "VARCHAR(255) DEFAULT 'contact.devworks7@gmail.com'",
                    "emails_per_minute": "INTEGER DEFAULT 10",
                    "max_emails": "INTEGER DEFAULT 200",
                    "total_recipients": "INTEGER DEFAULT 0",
                    "sent_count": "INTEGER DEFAULT 0",
                    "failed_count": "INTEGER DEFAULT 0",
                    "pending_count": "INTEGER DEFAULT 0",
                    "skipped_count": "INTEGER DEFAULT 0"
                }
                for col_name, col_type in needed_camp_cols.items():
                    if col_name not in camp_cols:
                        conn.execute(text(f"ALTER TABLE campaigns ADD COLUMN {col_name} {col_type}"))
                conn.commit()

    except Exception as e:
        import logging
        logging.getLogger("duo_systems.database").warning(f"Schema migration helper notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
