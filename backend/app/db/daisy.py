"""Read-only connection to db_daisy (master univ/jurusan)."""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None


def daisy_enabled() -> bool:
    return bool(settings.DAISY_DB_ENABLED and settings.DAISY_DATABASE_URL)


def get_daisy_engine() -> Engine | None:
    global _engine, _SessionLocal
    if not daisy_enabled():
        return None
    if _engine is None:
        _engine = create_engine(
            settings.DAISY_DATABASE_URL,
            connect_args={"charset": "utf8mb4"},
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine


def DaisySession() -> Session | None:
    get_daisy_engine()
    if _SessionLocal is None:
        return None
    return _SessionLocal()
