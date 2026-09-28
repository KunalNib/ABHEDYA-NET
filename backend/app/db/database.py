"""
CHRONOS-WS Database Connection & Engine Setup.
Supports PostgreSQL with local SQLite fallback for testing.
"""

import os
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("CHRONOS-WS.Database")

# Determine base directory and database path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = BASE_DIR / "chronos_ws.db"
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_FILE}"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# SQLite requires check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    try:
        with engine.connect() as conn:
            return True
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return False


def hash_password(password: str) -> str:
    """SHA-256 password hash with static salt for local demo security."""
    salt = "chronos_defence_sec_salt"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()


def seed_initial_data(db):
    from app.db.models import UserRecord, AuditLogRecord

    # Check if users already seeded
    existing_user = db.query(UserRecord).first()
    if not existing_user:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        seeded_users = [
            UserRecord(
                id="usr-admin-01",
                name="Kunal (Admin)",
                email="admin@defence.local",
                password_hash=hash_password("adminpassword123"),
                role="ADMIN",
                status="ACTIVE",
                last_login=now_str
            ),
            UserRecord(
                id="usr-analyst-01",
                name="Sarah Chen (SOC Analyst)",
                email="analyst@defence.local",
                password_hash=hash_password("analystpassword123"),
                role="SOC_ANALYST",
                status="ACTIVE",
                last_login=now_str
            ),
            UserRecord(
                id="usr-eng-01",
                name="Marcus Vance (SecOps Eng)",
                email="engineer@defence.local",
                password_hash=hash_password("engineerpassword123"),
                role="SECURITY_ENGINEER",
                status="ACTIVE",
                last_login=now_str
            ),
            UserRecord(
                id="usr-viewer-01",
                name="Audit Observer",
                email="viewer@defence.local",
                password_hash=hash_password("viewerpassword123"),
                role="VIEWER",
                status="ACTIVE",
                last_login=now_str
            )
        ]
        db.add_all(seeded_users)
        db.commit()
        logger.info("Default RBAC users seeded into database successfully.")

    # Check if audit logs seeded
    existing_audit = db.query(AuditLogRecord).first()
    if not existing_audit:
        seeded_audits = [
            AuditLogRecord(
                id="aud-01",
                timestamp="2026-09-04 03:28:10",
                user="Kunal (Admin)",
                role="ADMIN",
                action="Update Defence Policy POL-001",
                target="Adaptive Defence Engine",
                result="SUCCESS",
                ip="10.0.0.5",
                details="Updated real asset protection boundary enforcement"
            ),
            AuditLogRecord(
                id="aud-02",
                timestamp="2026-09-04 03:25:44",
                user="Sarah Chen",
                role="SOC_ANALYST",
                action="View Attack Path Graph",
                target="Attack Path Engine",
                result="SUCCESS",
                ip="10.0.0.12",
                details="Inspected credential harvesting progression"
            ),
            AuditLogRecord(
                id="aud-03",
                timestamp="2026-09-04 03:22:15",
                user="Marcus Vance",
                role="SECURITY_ENGINEER",
                action="Activate Adaptive Decoy DB",
                target="Deception Zone VLAN 99",
                result="SUCCESS",
                ip="10.0.0.15",
                details="Policy-validated decoy honeypot activation"
            ),
            AuditLogRecord(
                id="aud-04",
                timestamp="2026-09-04 03:18:02",
                user="Audit Observer",
                role="VIEWER",
                action="Attempt Decoy Activation",
                target="Deception Engine",
                result="DENIED",
                ip="10.0.0.99",
                details="RBAC blocked unauthorized mutation attempt by VIEWER role"
            )
        ]
        db.add_all(seeded_audits)
        db.commit()
        logger.info("Initial audit logs seeded into database successfully.")


def init_db():
    try:
        # Import models so SQLAlchemy Base knows about all tables
        import app.db.models
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")

        db = SessionLocal()
        try:
            seed_initial_data(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
