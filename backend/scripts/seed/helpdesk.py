"""Seed layanan, artikel, dan panduan manual LAMDEPILAR."""
from sqlalchemy.orm import Session

from app.models.helpdesk import Article, Category, ManualPage, Service

SERVICES = [
    {
        "name": "Akreditasi",
        "description": "Informasi dan bantuan terkait proses akreditasi program studi dan perguruan tinggi.",
        "group": "info",
        "sort_order": 1,
        "card_color": "#2B7DE0",
        "categories": [
            ("Pengajuan akreditasi", "#2B7DE0"),
            ("Instrumen akreditasi", "#7C3AED"),
            ("Jadwal asesmen", "#F79009"),
            ("Banding", "#12B76A"),
        ],
    },
    {
        "name": "Informasi Umum",
        "description": "Pertanyaan umum seputar layanan LAMDEPILAR, kontak, dan persyaratan.",
        "group": "info",
        "sort_order": 2,
        "card_color": "#12B76A",
        "categories": [
            ("Kontak layanan", "#2B7DE0"),
            ("Persyaratan umum", "#12B76A"),
            ("Lainnya", "#667085"),
        ],
    },
    {
        "name": "Keanggotaan Asesor",
        "description": "Pendaftaran, penugasan, dan informasi keanggotaan asesor LAMDEPILAR.",
        "group": "info",
        "sort_order": 3,
        "card_color": "#7C3AED",
        "categories": [
            ("Pendaftaran asesor", "#7C3AED"),
            ("Penugasan asesor", "#F79009"),
        ],
    },
    {
        "name": "Sistem Informasi",
        "description": "Bantuan teknis terkait akun, login, dan unggah dokumen pada sistem LAMDEPILAR.",
        "group": "info",
        "sort_order": 4,
        "card_color": "#F79009",
        "categories": [
            ("Kendala login", "#F04438"),
            ("Kendala unggah dokumen", "#F79009"),
            ("Lainnya", "#667085"),
        ],
    },
    {
        "name": "Pengaduan Pelayanan",
        "description": "Sampaikan keluhan terkait proses pelayanan, keterlambatan, atau sikap petugas.",
        "group": "complaint",
        "sort_order": 10,
        "card_color": "#F04438",
        "categories": [
            ("Keterlambatan layanan", "#F79009"),
            ("Kualitas pelayanan", "#F04438"),
            ("Lainnya", "#667085"),
        ],
    },
    {
        "name": "Pengaduan Lainnya",
        "description": "Pengaduan di luar kategori yang tersedia terkait layanan LAMDEPILAR.",
        "group": "complaint",
        "sort_order": 11,
        "card_color": "#667085",
        "categories": [
            ("Umum", "#667085"),
        ],
    },
]

ARTICLES = [
    {
        "title": "Cara Reset Password Akun",
        "card_color": "#7C3AED",
        "body": (
            "Buka halaman login Helpdesk LAMDEPILAR, lalu pilih **Lupa password**. "
            "Masukkan email terdaftar. Tautan reset dikirim ke email tersebut. "
            "Password baru terdiri dari 8 sampai 16 karakter. "
            "Contoh penulisan: akun&#039;s harus tampil sebagai teks biasa, bukan kode."
        ),
    },
    {
        "title": "Cara Mengajukan Tiket Baru",
        "card_color": "#2B7DE0",
        "body": (
            "Pada portal publik, pilih layanan yang sesuai lalu isi formulir pengajuan. "
            "Simpan **kode pelacakan** yang muncul setelah tiket terkirim. "
            "Pengguna terdaftar juga dapat membuat tiket dari Dasbor setelah masuk."
        ),
    },
    {
        "title": "Melacak Status Tiket",
        "card_color": "#12B76A",
        "body": (
            "Buka **Lacak Tiket**, masukkan kode pelacakan dan email yang dipakai saat pengajuan. "
            "Status tiket: Baru/Open, Dalam Proses, atau Diselesaikan."
        ),
    },
]

MANUALS = [
    {
        "title": "Pengantar Helpdesk LAMDEPILAR",
        "slug": "pengantar",
        "sort_order": 1,
        "body": """# Pengantar

Helpdesk LAMDEPILAR adalah saluran resmi untuk pertanyaan dan permintaan bantuan terkait layanan akreditasi, asesor, dan sistem informasi.

## Siapa yang dapat mengajukan?

- Tamu tanpa akun lewat portal publik (simpan kode pelacakan).
- Pemohon dari UPPS atau universitas yang akunnya terdaftar.
- Sekretariat dan Administrator mengelola sistem. Menjawab tiket dilakukan oleh MA/DE, Sekretariat, dan Administrator sesuai izin yang terpasang pada peran.

## Langkah Membuat Tiket

1. Buka form tiket dari portal publik atau tombol **Tiket Baru** di Dasbor.
2. Isi detail tiket.

| Field | Keterangan | Wajib |
| --- | --- | --- |
| Title | Ringkasan singkat pertanyaan | Ya |
| Layanan | Pilih layanan, misalnya Akreditasi | Ya |
| Kategori Masalah | Pilihan mengikuti layanan | Ya |
| Prioritas petugas | Minta petugas layanan menangani lebih dulu | Tidak |
| Description | Penjelasan, dibatasi sesuai pengaturan sistem | Ya |
| Attachment | PDF atau gambar pendukung | Tidak |
""",
    },
]


def seed_helpdesk(db: Session) -> None:
    print("Sedang melakukan seeding helpdesk...")
    for item in SERVICES:
        service = db.query(Service).filter(Service.name == item["name"]).first()
        if not service:
            service = Service(
                name=item["name"],
                description=item.get("description"),
                group=item.get("group", "info"),
                sort_order=item.get("sort_order", 0),
                card_color=item.get("card_color", "#2B7DE0"),
                is_active=True,
            )
            db.add(service)
            db.flush()
            print(f'✓ Layanan "{item["name"]}" dibuat')
        else:
            # Keep catalog fields fresh without wiping categories
            service.description = item.get("description") or service.description
            service.group = item.get("group", service.group or "info")
            service.sort_order = item.get("sort_order", service.sort_order or 0)
            service.card_color = item.get("card_color", service.card_color or "#2B7DE0")
            db.add(service)
        for name, color in item["categories"]:
            exists = (
                db.query(Category)
                .filter(Category.service_id == service.id, Category.name == name)
                .first()
            )
            if not exists:
                db.add(Category(service_id=service.id, name=name, color=color))
    for item in ARTICLES:
        exists = db.query(Article).filter(Article.title == item["title"]).first()
        if not exists:
            db.add(Article(title=item["title"], body=item["body"], status="published", card_color=item["card_color"]))
            print(f'✓ Artikel "{item["title"]}" dibuat')
    for item in MANUALS:
        exists = db.query(ManualPage).filter(ManualPage.slug == item["slug"]).first()
        if not exists:
            db.add(ManualPage(**item))
            print(f'✓ Manual "{item["title"]}" dibuat')
    db.commit()
