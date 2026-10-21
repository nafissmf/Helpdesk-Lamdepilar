"""Seed: assign permissions to roles (extend as needed for your domain)."""
from sqlalchemy.orm import Session

from app.models.auth import Permission, Role


# Penempatan awal di tabel role_has_permissions. Diubah lewat halaman Roles, bukan di kode akses.
_OFFICER = [
    "view_dashboard",
    "view_all_ticket",
    "reply_ticket",
    "close_ticket",
    "delete_ticket",
    "view_all_report",
    "export_all_report",
    "view_article",
    "manage_article",
    "view_manual",
    "manage_manual",
    "manage_service",
    "view_notification",
    "view_myprofile",
    "update_myprofile",
    "view_user",
    "create_user",
    "update_user",
    "delete_user",
    "restore_user",
    "force_delete_user",
    "view_role",
    "create_role",
    "update_role",
    "delete_role",
    "view_setting",
    "create_setting",
    "update_setting",
    "delete_setting",
    "view_unit",
    "create_unit",
    "update_unit",
    "delete_unit",
    "view_role_scope",
    "update_role_scope",
]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "UPPS/Universitas": [
        "view_dashboard",
        "create_ticket",
        "view_own_ticket",
        "reply_own_ticket",
        "view_own_report",
        "export_own_report",
        "view_article",
        "view_manual",
        "view_notification",
        "view_myprofile",
        "update_myprofile",
    ],
    "MA/DE": [
        "view_dashboard",
        "view_all_ticket",
        "reply_ticket",
        "view_article",
        "view_manual",
        "view_notification",
        "view_myprofile",
        "update_myprofile",
    ],
    "Sekretariat": _OFFICER,
    "Administrator": _OFFICER,
}


def seed_role_permissions(db: Session) -> None:
    """Assign permissions listed in ROLE_PERMISSIONS to matching roles."""
    print("Sedang melakukan seeding role permissions...")

    if not ROLE_PERMISSIONS:
        print("✓ ROLE_PERMISSIONS kosong — tidak ada assignment tambahan")
        return

    for role_name, perm_names in ROLE_PERMISSIONS.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            print(f'⚠️  Role "{role_name}" tidak ditemukan, dilewati')
            continue

        db.refresh(role, ["permissions"])
        existing_ids = {p.id for p in (role.permissions or [])}
        to_add = []

        for perm_name in perm_names:
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if not perm:
                print(f'⚠️  Permission "{perm_name}" tidak ditemukan')
                continue
            if perm.id not in existing_ids:
                to_add.append(perm)

        if to_add:
            role.permissions.extend(to_add)
            db.commit()
            print(f'✓ {len(to_add)} permissions di-assign ke role "{role_name}"')
        else:
            print(f'✓ Role "{role_name}" sudah memiliki semua permissions yang diperlukan')
