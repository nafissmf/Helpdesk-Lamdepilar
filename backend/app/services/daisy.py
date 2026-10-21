"""Lookup univ/jurusan and authenticate accounts from db_daisy."""
from __future__ import annotations

import logging
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.db.daisy import DaisySession, daisy_enabled
from app.models.auth import Role, User

logger = logging.getLogger(__name__)

DEFAULT_DAISY_ROLE = "UPPS/Universitas"


def format_institution(univ: str | None, prodi: str | None, fallback: str | None = None) -> str | None:
    univ = (univ or "").strip()
    prodi = (prodi or "").strip()
    if univ and prodi:
        return f"{univ} — {prodi}"
    if univ:
        return univ
    if prodi:
        return prodi
    fb = (fallback or "").strip()
    return fb or None


def _fetch_daisy_user_by_email(email: str) -> dict | None:
    if not daisy_enabled() or not email:
        return None
    session = DaisySession()
    if session is None:
        return None
    try:
        row = session.execute(
            text(
                """
                SELECT
                    u.id AS daisy_user_id,
                    u.name,
                    u.email,
                    u.password,
                    u.phone,
                    u.institution AS institution_raw,
                    un.name AS university_name,
                    COALESCE(NULLIF(sp.full_name, ''), sp.name) AS study_program_name
                FROM users u
                LEFT JOIN universities un ON un.id = u.id_university
                LEFT JOIN study_programs sp ON sp.id = u.id_study_program
                WHERE LOWER(u.email) = LOWER(:email)
                LIMIT 1
                """
            ),
            {"email": email.strip()},
        ).mappings().first()
        return dict(row) if row else None
    except Exception:
        logger.exception("Daisy user lookup failed for %s", email)
        return None
    finally:
        session.close()


def lookup_institution_by_email(email: str) -> dict | None:
    """
    Return institution label for a Daisy user matched by email.
    Shape: { institution, university, study_program, daisy_user_id }
    """
    row = _fetch_daisy_user_by_email(email)
    if not row:
        return None
    label = format_institution(
        row.get("university_name"),
        row.get("study_program_name"),
        row.get("institution_raw"),
    )
    if not label:
        return None
    return {
        "daisy_user_id": row["daisy_user_id"],
        "university": row.get("university_name"),
        "study_program": row.get("study_program_name"),
        "institution": label,
    }


def authenticate_daisy(email: str, password: str) -> dict | None:
    """Verify email/password against db_daisy.users. Returns Daisy profile if valid."""
    row = _fetch_daisy_user_by_email(email)
    if not row or not row.get("password"):
        return None
    if not verify_password(password, row["password"]):
        return None
    label = format_institution(
        row.get("university_name"),
        row.get("study_program_name"),
        row.get("institution_raw"),
    )
    return {
        "daisy_user_id": row["daisy_user_id"],
        "name": (row.get("name") or "").strip(),
        "email": row["email"],
        "phone": row.get("phone"),
        "institution": label,
        "university": row.get("university_name"),
        "study_program": row.get("study_program_name"),
    }


def _split_name(full_name: str) -> tuple[str, str]:
    parts = [p for p in (full_name or "").strip().split() if p]
    if not parts:
        return "User", "Daisy"
    if len(parts) == 1:
        return parts[0], "Daisy"
    return parts[0], " ".join(parts[1:])


def _unique_username(db: Session, email: str, daisy_user_id: int) -> str:
    local = re.sub(r"[^a-zA-Z0-9._-]", "", (email.split("@")[0] or "daisy").lower())[:40]
    base = local or f"daisy{daisy_user_id}"
    candidate = base
    n = 2
    while db.query(User).filter(User.username == candidate).first():
        candidate = f"{base}-{n}"
        n += 1
    return candidate


def ensure_helpdesk_user_from_daisy(db: Session, daisy: dict, plain_password: str) -> User:
    """
    Create or update a helpdesk user from a validated Daisy login.
    Stores a local password hash so subsequent logins can use helpdesk DB too.
    """
    email = daisy["email"].strip()
    user = db.query(User).filter(User.email == email).first()
    firstname, lastname = _split_name(daisy.get("name") or "")
    institution = daisy.get("institution")
    phone = (daisy.get("phone") or None)

    if user:
        if user.deleted_at is not None:
            user.deleted_at = None
        user.firstname = firstname
        user.lastname = lastname
        user.password = get_password_hash(plain_password)
        if institution:
            user.institution = institution
        if phone and not user.phone_number:
            user.phone_number = str(phone)[:255]
        db.add(user)
        db.commit()
        db.refresh(user, ["roles"])
        return user

    user = User(
        username=_unique_username(db, email, int(daisy["daisy_user_id"])),
        email=email,
        firstname=firstname,
        lastname=lastname,
        phone_number=str(phone)[:255] if phone else None,
        institution=institution,
        password=get_password_hash(plain_password),
    )
    role = db.query(Role).filter(Role.name == DEFAULT_DAISY_ROLE).first()
    if role:
        user.roles = [role]
    db.add(user)
    db.commit()
    db.refresh(user, ["roles"])
    for role in user.roles or []:
        db.refresh(role, ["permissions"])
    return user


def sync_user_institution(db: Session, user: User, *, force: bool = False) -> bool:
    """
    Fill/update helpdesk users.institution from db_daisy when email matches.
    Returns True if the user row was changed.
    """
    if not user or not user.email:
        return False
    if user.institution and not force:
        return False
    found = lookup_institution_by_email(user.email)
    if not found:
        return False
    label = found["institution"]
    if user.institution == label:
        return False
    user.institution = label
    db.add(user)
    return True
