"""Akun contoh untuk empat peran LAMDEPILAR. Izin mengikuti data peran, bukan nama di kode."""
import os
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.auth import Role, User
from app.models.helpdesk import Category, Service, Ticket

DEMO_USERS = [
    {
        "username": "upps",
        "email": "upps@lamdepilar.or.id",
        "firstname": "Sari",
        "lastname": "Wijaya",
        "institution": "Universitas Contoh — Prodi Arsitektur",
        "role": "UPPS/Universitas",
    },
    {
        "username": "upps2",
        "email": "upps.its@lamdepilar.or.id",
        "firstname": "Rina",
        "lastname": "Kartika",
        "institution": "Institut Teknologi Sepuluh Nopember — Desain Produk",
        "role": "UPPS/Universitas",
    },
    {
        "username": "upps3",
        "email": "upps.ugm@lamdepilar.or.id",
        "firstname": "Ahmad",
        "lastname": "Fauzi",
        "institution": "Universitas Gadjah Mada — Perencanaan Wilayah",
        "role": "UPPS/Universitas",
    },
    {
        "username": "upps4",
        "email": "upps.unpad@lamdepilar.or.id",
        "firstname": "Maya",
        "lastname": "Putri",
        "institution": "Universitas Padjadjaran — Desain Interior",
        "role": "UPPS/Universitas",
    },
    {
        "username": "made",
        "email": "made@lamdepilar.or.id",
        "firstname": "Budi",
        "lastname": "Santoso",
        "institution": "LAMDEPILAR",
        "role": "MA/DE",
    },
    {
        "username": "sekretariat",
        "email": "sekretariat@lamdepilar.or.id",
        "firstname": "Dewi",
        "lastname": "Lestari",
        "institution": "Sekretariat LAMDEPILAR",
        "role": "Sekretariat",
    },
    {
        "username": "administrator",
        "email": "administrator@lamdepilar.or.id",
        "firstname": "Andi",
        "lastname": "Pratama",
        "institution": "LAMDEPILAR",
        "role": "Administrator",
    },
]

DEMO_TICKETS = [
    {
        "email": "upps@lamdepilar.or.id",
        "title": "Jadwal asesmen prodi arsitektur",
        "description": "Mohon informasi jadwal asesmen lapangan untuk program studi arsitektur.",
        "service": "Akreditasi",
        "category": "Jadwal asesmen",
        "status": "resolved",
        "days_ago": 1,
    },
    {
        "email": "upps.its@lamdepilar.or.id",
        "title": "Instrumen akreditasi desain produk",
        "description": "Kami membutuhkan panduan pengisian instrumen untuk prodi desain produk.",
        "service": "Akreditasi",
        "category": "Instrumen akreditasi",
        "status": "in_progress",
        "days_ago": 2,
    },
    {
        "email": "upps.ugm@lamdepilar.or.id",
        "title": "Pengajuan akreditasi prodi perencanaan",
        "description": "Mohon konfirmasi kelengkapan dokumen pengajuan akreditasi.",
        "service": "Akreditasi",
        "category": "Pengajuan akreditasi",
        "status": "open",
        "days_ago": 0,
    },
    {
        "email": "upps.unpad@lamdepilar.or.id",
        "title": "Kendala unggah dokumen asesmen",
        "description": "Berkas PDF tidak berhasil diunggah pada portal.",
        "service": "Sistem Informasi",
        "category": "Kendala unggah dokumen",
        "status": "open",
        "days_ago": 3,
    },
    {
        "email": "upps.its@lamdepilar.or.id",
        "title": "Kontak penjadwalan asesmen lapangan",
        "description": "Mohon kontak petugas untuk koordinasi asesmen lapangan.",
        "service": "Informasi Umum",
        "category": "Kontak layanan",
        "status": "in_progress",
        "days_ago": 4,
    },
]


def seed_demo_users(db: Session) -> None:
    print("Sedang melakukan seeding pengguna contoh...")
    password = os.getenv("INIT_DEMO_PASSWORD", "Lamdepilar1")
    hashed = get_password_hash(password)
    for item in DEMO_USERS:
        user = db.query(User).filter(User.email == item["email"]).first()
        role = db.query(Role).filter(Role.name == item["role"]).first()
        if not role:
            print(f'⚠️  Role "{item["role"]}" tidak ditemukan')
            continue
        if not user:
            user = User(
                username=item["username"],
                email=item["email"],
                firstname=item["firstname"],
                lastname=item["lastname"],
                institution=item["institution"],
                password=hashed,
            )
            db.add(user)
            db.flush()
            user.roles.append(role)
            print(f'✓ Pengguna {item["email"]} ({item["role"]}) dibuat')
        else:
            user.institution = item["institution"]
            if role not in user.roles:
                user.roles.append(role)
                print(f'✓ Peran {item["role"]} dipasang ke {item["email"]}')
    db.commit()
    _seed_demo_tickets(db)


def _seed_demo_tickets(db: Session) -> None:
    print("Sedang melakukan seeding tiket contoh...")
    created = 0
    now = datetime.now(timezone.utc)
    for item in DEMO_TICKETS:
        user = db.query(User).filter(User.email == item["email"]).first()
        service = db.query(Service).filter(Service.name == item["service"]).first()
        if not user or not service:
            continue
        category = (
            db.query(Category)
            .filter(Category.service_id == service.id, Category.name == item["category"])
            .first()
        )
        if not category:
            continue
        exists = (
            db.query(Ticket)
            .filter(Ticket.requester_id == user.id, Ticket.title == item["title"])
            .first()
        )
        if exists:
            continue
        created_at = now - timedelta(days=item["days_ago"])
        ticket = Ticket(
            uuid=str(uuid.uuid4()),
            title=item["title"],
            description=item["description"],
            service_id=service.id,
            category_id=category.id,
            requester_id=user.id,
            status=item["status"],
            created_at=created_at,
            updated_at=created_at,
            resolved_at=created_at if item["status"] == "resolved" else None,
        )
        db.add(ticket)
        created += 1
    db.commit()
    if created:
        print(f"✓ {created} tiket contoh dibuat")
    else:
        print("✓ Tiket contoh sudah ada")
