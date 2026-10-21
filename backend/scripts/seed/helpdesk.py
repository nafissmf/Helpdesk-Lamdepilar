"""Seed layanan, artikel, dan panduan manual LAMDEPILAR."""
from sqlalchemy.orm import Session

from app.models.helpdesk import Article, Category, ManualPage, Service

SERVICES = [
    {
        "name": "Akreditasi",
        "categories": [
            ("Pengajuan akreditasi", "#2B7DE0"),
            ("Instrumen akreditasi", "#7C3AED"),
            ("Jadwal asesmen", "#F79009"),
            ("Banding", "#12B76A"),
        ],
    },
    {
        "name": "Informasi Umum",
        "categories": [
            ("Kontak layanan", "#2B7DE0"),
            ("Persyaratan umum", "#12B76A"),
            ("Lainnya", "#667085"),
        ],
    },
    {
        "name": "Keanggotaan Asesor",
        "categories": [
            ("Pendaftaran asesor", "#7C3AED"),
            ("Penugasan asesor", "#F79009"),
        ],
    },
    {
        "name": "Sistem Informasi",
        "categories": [
            ("Kendala login", "#F04438"),
            ("Kendala unggah dokumen", "#F79009"),
            ("Lainnya", "#667085"),
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
        "title": "Cara Mengajukan Pertanyaan atau Tiket Helpdesk",
        "card_color": "#12B76A",
        "body": (
            "Setelah login, klik **Tiket Baru** di Dasbor atau halaman Tiket. "
            "Isi judul, pilih layanan, pilih kategori masalah, tulis penjelasan, "
            "lalu kirim. Petugas layanan akan menjawab di percakapan tiket."
        ),
    },
    {
        "title": "Informasi Umum Layanan Akreditasi LAMDEPILAR",
        "card_color": "#F79009",
        "body": (
            "LAMDEPILAR mengakreditasi program studi pada rumpun desain, perencanaan, "
            "lingkungan, dan arsitektur. Pertanyaan tentang alur pengajuan, instrumen, "
            "atau jadwal asesmen dapat dikirim sebagai tiket pada layanan **Akreditasi**."
        ),
    },
]

MANUALS = [
    {
        "title": "Memulai Penggunaan Sistem",
        "slug": "memulai-penggunaan-sistem",
        "sort_order": 1,
        "body": """Selamat datang di Sistem Helpdesk LAMDEPILAR.

## Login

1. Buka aplikasi helpdesk di browser.
2. Masukkan email terdaftar, misalnya `nama@lamdepilar.or.id`.
3. Masukkan password (8–16 karakter).
4. Klik **Login**.

Sesi login aktif **3 jam**. Setelah itu Anda perlu masuk kembali.

![Halaman login](/manual/login.svg)
""",
    },
    {
        "title": "Membuat Tiket",
        "slug": "membuat-tiket",
        "sort_order": 2,
        "body": """Panduan membuat dan mengirim tiket bantuan.

## Siapa yang Bisa Membuat Tiket?

- Pemohon dari UPPS atau universitas yang akunnya terdaftar.
- Sekretariat dan Administrator mengelola sistem. Menjawab tiket dilakukan oleh MA/DE, Sekretariat, dan Administrator sesuai izin yang terpasang pada peran.

## Langkah Membuat Tiket

1. Buka form tiket dari tombol **Tiket Baru** di Dasbor atau halaman Tiket.
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
            service = Service(name=item["name"], is_active=True)
            db.add(service)
            db.flush()
            print(f'✓ Layanan "{item["name"]}" dibuat')
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
