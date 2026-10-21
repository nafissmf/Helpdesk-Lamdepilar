"""Seed: settings table."""
import os

from sqlalchemy.orm import Session

from app.models.common import Setting


def seed_settings(db: Session) -> None:
    """Initialize default settings."""
    print("Sedang melakukan seeding settings...")

    default_settings = [
        {
            "group": "general",
            "name": "site_name",
            "payload": "Helpdesk System",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "site_tagline",
            "payload": "Layanan tanya jawab LAMDEPILAR",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "site_description",
            "payload": "Portal bantuan dan tanya jawab Lembaga Akreditasi Mandiri Desain, Perencanaan, Lingkungan, dan Arsitektur.",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "company_name",
            "payload": "LAMDEPILAR",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "company_email",
            "payload": "sekretariat@lamdepilar.or.id",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "company_phone",
            "payload": "+621234567890",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "company_address",
            "payload": "Jl. Contoh No. 123, Kota, Provinsi",
            "locked": 0,
        },
        {
            "group": "general",
            "name": "copyright_text",
            "payload": f"© 2026 {os.getenv('PROJECT_NAME', 'Your App')}. All rights reserved.",
            "locked": 0,
        },
        {
            "group": "appearance",
            "name": "site_logo",
            "payload": "",
            "locked": 0,
        },
        {
            "group": "appearance",
            "name": "site_logo_dark",
            "payload": "",
            "locked": 0,
        },
        {
            "group": "appearance",
            "name": "brand_logo_square",
            "payload": "",
            "locked": 0,
        },
        {
            "group": "appearance",
            "name": "brand_logo_square_dark",
            "payload": "",
            "locked": 0,
        },
        {
            "group": "appearance",
            "name": "site_favicon",
            "payload": "",
            "locked": 0,
        },
        {
            "group": "helpdesk",
            "name": "ticket_description_max",
            "payload": 150,
            "locked": 0,
        },
        {
            "group": "helpdesk",
            "name": "ticket_attachment_max_bytes",
            "payload": 5242880,
            "locked": 0,
        },
        {
            "group": "helpdesk",
            "name": "ticket_attachment_mimes",
            "payload": [
                "application/pdf",
                "image/png",
                "image/jpeg",
                "image/webp",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ],
            "locked": 0,
        },
        {
            "group": "helpdesk",
            "name": "allowed_email_domains",
            "payload": [],
            "locked": 0,
        },
    ]

    for setting_data in default_settings:
        existing_setting = db.query(Setting).filter(
            Setting.group == setting_data["group"],
            Setting.name == setting_data["name"]
        ).first()

        if not existing_setting:
            setting = Setting(**setting_data)
            db.add(setting)
            db.flush()
            print(f'✓ Setting "{setting_data["group"]}.{setting_data["name"]}" berhasil dibuat')
        else:
            print(f'✓ Setting "{setting_data["group"]}.{setting_data["name"]}" sudah ada, dilewati')

    db.commit()
