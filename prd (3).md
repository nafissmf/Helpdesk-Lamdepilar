# PRD — Helpdesk System LAMDEPILAR

| Item | Keterangan |
|---|---|
| Nama Produk | Helpdesk System LAMDEPILAR |
| Organisasi | LAMDEPILAR — Lembaga Akreditasi Mandiri Desain, Perencanaan, Lingkungan, dan Arsitektur |
| Jenis Layanan | Layanan tanya jawab dan permintaan bantuan (bukan khusus IT) |
| Platform | Aplikasi web responsif |
| Bahasa Antarmuka | Indonesia (default) dan Inggris |
| Status Dokumen | Draft v1.1 (revisi: cakupan diperluas dari helpdesk IT menjadi layanan tanya jawab LAMDEPILAR) |
| Tanggal | 19 Oktober 2026 |
| Acuan Tampilan | Screenshot antarmuka: Dasbor, Form Tiket Baru, Panduan Mandiri, Panduan Manual, Laporan |

> **Catatan revisi:** Screenshot acuan masih memakai identitas ITK dan istilah "Staf IT". Pada versi ini seluruh identitas, peran, dan contoh konten disesuaikan untuk LAMDEPILAR. Tata letak dan alur halaman tetap sama dengan screenshot.

---

## 1. Ringkasan Produk

Helpdesk System LAMDEPILAR adalah portal layanan tanya jawab dan bantuan bagi para pemangku kepentingan LAMDEPILAR, misalnya perguruan tinggi dan program studi yang mengajukan akreditasi, asesor, serta pihak internal. Pengguna dapat mengajukan pertanyaan atau permintaan bantuan dalam bentuk **tiket**, memantau tanggapan dari petugas, mencari jawaban lewat artikel **Panduan Mandiri** (FAQ), membaca **Panduan Manual** penggunaan sistem, dan melihat **Laporan** tiket pribadi.

Istilah "tiket" dipertahankan sebagai satuan permintaan. Satu tiket dapat berupa pertanyaan, permintaan informasi, permohonan bantuan, atau pelaporan kendala (termasuk kendala teknis pada sistem akreditasi).

## 2. Tujuan

1. Menyediakan satu pintu resmi bagi pertanyaan seputar layanan LAMDEPILAR.
2. Mengurangi pertanyaan berulang melalui FAQ dan panduan mandiri.
3. Memberi transparansi status pertanyaan (total, dalam proses, diselesaikan).
4. Mendokumentasikan seluruh komunikasi layanan secara terstruktur dan dapat dilaporkan.
5. Menyediakan laporan pribadi yang dapat diekspor ke PDF.

## 3. Peran Pengguna

| Peran | Deskripsi | Hak Akses |
|---|---|---|
| Pemohon (Requester) | Pengguna terdaftar: perwakilan perguruan tinggi/program studi, asesor, dan pengguna umum terdaftar | Membuat dan memantau tiket sendiri, membaca panduan, melihat laporan pribadi |
| Supervisor / Kepala Unit | Penanggung jawab unit di LAMDEPILAR | Dapat membuat tiket dan (asumsi) memantau tiket unitnya |
| Petugas Layanan | Pengganti "Staf IT"; sekretariat atau staf yang menjawab pertanyaan | Menanggapi dan menutup tiket |
| Administrator | Pengelola sistem | Akses penuh (pengguna, layanan, kategori, artikel, panduan) |

Pengguna pada screenshot: **DENNY HULDIANSYAH**, peran **Dosen**. Daftar peran/tipe pengguna LAMDEPILAR perlu dikonfirmasi (lihat bagian 12).

## 4. Cakupan

### 4.1 Dalam Cakupan
- Login dan sesi
- Layout global (sidebar, top bar)
- Dasbor "Tiket Dukungan Saya"
- Form Tiket Baru (modal)
- Tiket Saya, termasuk percakapan tanya jawab per tiket
- Panduan Mandiri (FAQ/knowledge base)
- Panduan Manual
- Laporan Tiket Saya dan ekspor PDF

### 4.2 Di Luar Cakupan / Belum Terlihat
Halaman daftar dan detail tiket secara visual, isi dropdown notifikasi, hasil pencarian global, panel admin dan petugas, SLA, serta integrasi sistem akreditasi. Diperlakukan sebagai asumsi (bagian 12).

---

## 5. Layout Global

### 5.1 Sidebar
- Logo **LAMDEPILAR** + teks **Helpdesk System** di bagian atas.
- Tombol collapse/expand sidebar.
- Menu (urutan tetap):

| No | Menu | Ikon | Rute |
|---|---|---|---|
| 1 | Dasbor | grid | `/dashboard` |
| 2 | Tiket Saya | tiket | `/tickets` |
| 3 | Panduan Mandiri | buku terbuka | `/knowledge-base` |
| 4 | Panduan Manual | dokumen | `/manual` |
| 5 | Laporan | grafik batang | `/reports` |

- Menu aktif: latar biru solid, teks dan ikon putih.

### 5.2 Top Bar
- Judul halaman aktif.
- Kolom pencarian **"Cari tiket..."** dengan shortcut **Ctrl+K**.
- Pemilih bahasa (**ID**).
- Ikon notifikasi.
- Profil pengguna: avatar inisial, nama kapital, peran, dropdown akun.

### 5.3 Gaya Visual
- Warna utama biru untuk tombol primer dan menu aktif (warna final menyesuaikan identitas LAMDEPILAR).
- Latar abu terang, konten dalam kartu putih bersudut membulat.
- Status: biru (total), kuning/oranye (dalam proses), hijau (diselesaikan).

---

## 6. Kebutuhan Fungsional

### 6.1 Login & Sesi
| ID | Kebutuhan |
|---|---|
| AUTH-01 | Pengguna masuk dengan email dan password. |
| AUTH-02 | Domain email yang diterima ditentukan LAMDEPILAR (screenshot memakai pola `nama@itk.ac.id`, `nama@staff.itk.ac.id`, `nama@student.itk.ac.id`; **harus diganti** dengan domain LAMDEPILAR dan/atau email institusi mitra). |
| AUTH-03 | Password 8–16 karakter. |
| AUTH-04 | Sesi login aktif **3 jam**, setelah itu login ulang. |
| AUTH-05 | Halaman login menampilkan logo LAMDEPILAR dan pemilih bahasa di pojok kanan atas. |
| AUTH-06 | Reset password tersedia dan dijelaskan pada artikel panduan. |

### 6.2 Dasbor — "Tiket Dukungan Saya"
Subjudul: *Lacak permintaan Anda dan dapatkan bantuan dari tim dukungan kami*.

| ID | Kebutuhan |
|---|---|
| DASH-01 | Tombol primer **+ Tiket Baru** di kanan atas membuka modal Tiket Baru. |
| DASH-02 | Tiga kartu statistik: **Total Permintaan**, **Dalam Proses**, **Diselesaikan**. |
| DASH-03 | Panel **Permintaan Saya** memuat tiket terbaru pengguna dan tautan **Lihat semua >**. |
| DASH-04 | Empty state: ikon tiket, **Belum ada permintaan**, teks *Ajukan permintaan dukungan pertama Anda dan kami akan segera merespons*, tombol **+ Ajukan Permintaan**. |
| DASH-05 | Statistik dihitung dari tiket milik pengguna yang login. |

### 6.3 Form Tiket Baru (Modal)
Judul: **New Ticket** (diterjemahkan sesuai bahasa aktif). Subjudul: *Fill in the details to create a support ticket*.

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| Title | Teks | Ya | Ringkasan singkat pertanyaan atau masalah |
| Layanan | Select dengan pencarian | Ya | Mis. layanan akreditasi, informasi umum, keanggotaan asesor, sistem informasi (daftar final dari LAMDEPILAR) |
| Kategori Masalah | Select dengan pencarian | Ya | Bergantung pada Layanan (asumsi) |
| Toggle prioritas | Switch (default off) | Tidak | Pada screenshot: *"Klik/Pilih untuk tiket yang kendala/masalah terselesaikan terlebih dahulu oleh Staf IT"*; label diganti menjadi **Petugas Layanan** |
| Description | Textarea | Ya | Penjelasan detail; penghitung karakter **0/150** |
| Attachment | Dropzone | Tidak | Dokumen pendukung (mis. PDF, gambar) |

| ID | Kebutuhan |
|---|---|
| TKT-01 | **Create Ticket** mengirim tiket; **Cancel** menutup modal tanpa menyimpan. |
| TKT-02 | Validasi field wajib dengan pesan error per field. |
| TKT-03 | Deskripsi dibatasi 150 karakter dengan penghitung real-time (batas perlu dikonfirmasi, lihat bagian 12). |
| TKT-04 | Isi modal dapat di-scroll; footer tombol selalu terlihat. |
| TKT-05 | Setelah berhasil: modal tertutup, tiket muncul di Permintaan Saya, statistik ter-update, tampil notifikasi sukses. |
| TKT-06 | Modal dapat dibuka dari Dasbor dan halaman Tiket Saya. |

### 6.4 Tiket Saya dan Tanya Jawab
| ID | Kebutuhan |
|---|---|
| MYT-01 | Menampilkan semua tiket pengguna (status, judul, layanan, tanggal). |
| MYT-02 | Pencarian tiket via "Cari tiket..." / Ctrl+K. |
| MYT-03 | Detail tiket menampilkan percakapan (pertanyaan, jawaban petugas, balasan lanjutan) berurutan waktu. |
| MYT-04 | Pemohon dapat membalas dan menambah lampiran selama tiket belum ditutup. |
| MYT-05 | Status tiket: **Baru/Open**, **Dalam Proses**, **Diselesaikan**. |
| MYT-06 | Pemohon menerima notifikasi saat petugas menjawab atau status berubah. |

### 6.5 Panduan Mandiri (FAQ / Knowledge Base)
Judul: **Pengetahuan Dasar Mandiri**. Subjudul: *{n} artikel dipublikasikan*.

| ID | Kebutuhan |
|---|---|
| KB-01 | Kolom pencarian **Cari artikel...**. |
| KB-02 | Kartu artikel grid 3 kolom: strip warna atas, judul, cuplikan (± 3 baris), label **Article**, tautan **Read more >**. |
| KB-03 | Hanya artikel berstatus *published* yang tampil. |
| KB-04 | Cuplikan dirender sebagai teks bersih: decode HTML entity (`&#039;`) dan hapus sintaks markdown (`**`). Pada screenshot keduanya tampil mentah dan harus diperbaiki. |
| KB-05 | Di halaman tiket baru, sistem dapat menyarankan artikel terkait berdasarkan judul yang diketik (opsional, untuk mengurangi pertanyaan berulang). |

Artikel awal pada screenshot masih bertema IT kampus dan **perlu diganti** dengan konten LAMDEPILAR. Contoh topik yang diusulkan (isi final dari LAMDEPILAR):

| Judul usulan | Keterangan |
|---|---|
| Cara Reset Password Akun | Tetap relevan, sesuaikan dengan sistem LAMDEPILAR |
| Cara Mengajukan Pertanyaan atau Tiket Helpdesk | Tetap relevan; login, klik Tiket Baru, pilih layanan dan kategori |
| Informasi Umum Layanan Akreditasi LAMDEPILAR | Pengganti artikel WiFi kampus; ringkasan alur dan kontak layanan |

### 6.6 Panduan Manual
Dokumentasi penggunaan sistem berformat Markdown, dengan breadcrumb **< Panduan Manual**, kartu putih di tengah, heading H1/H2/H3 bergaris pemisah, daftar, tabel, kode inline (merah, monospace), dan gambar.

| ID | Kebutuhan |
|---|---|
| MAN-01 | Konten Markdown dirender dengan tipografi dokumen. |
| MAN-02 | Mendukung heading, daftar, tebal, kode inline, tabel, dan gambar. |
| MAN-03 | Breadcrumb kembali ke indeks Panduan Manual. |

Halaman awal:

**a. Memulai Penggunaan Sistem** — selamat datang di Sistem Helpdesk LAMDEPILAR; Login: (1) buka aplikasi di browser; (2) masukkan email terdaftar; (3) masukkan password 8–16 karakter; (4) klik **Login**; sesi aktif **3 jam**; disertai gambar halaman login.

**b. Membuat Tiket** — siapa yang bisa membuat tiket (Pemohon: semua pengguna terdaftar; Supervisor/Kepala Unit; Administrator: akses penuh); langkah: (1) klik **+ Buat Tiket** di Dasbor atau halaman Tiket; (2) isi detail tiket pada tabel **Field / Keterangan / Wajib**.

### 6.7 Laporan — "Laporan Tiket Saya"
Subjudul: *Tiket yang Anda ajukan — diperbarui {tanggal}*.

| ID | Kebutuhan |
|---|---|
| REP-01 | Tombol **Segarkan** memuat ulang data dan tanggal pembaruan. |
| REP-02 | Tombol **Ekspor PDF** mengunduh laporan sesuai periode. |
| REP-03 | Filter periode: **7**, **30** (default), **90 hari terakhir**. |
| REP-04 | Kartu **TOTAL TIKET**: angka besar dan *"{n} tiket dalam periode"*. |
| REP-05 | Grafik **Ticket Volume** (*Created vs resolved — weekly breakdown*): seri Created (biru) dan Resolved (hijau), sumbu X rentang mingguan (mis. `Sep22–Sep28` … `Oct13–Oct19`), legenda di bawah. |
| REP-06 | Grafik **Category Breakdown** (*Tickets by support category*) di sisi kanan. |
| REP-07 | Empty state: **No data for this period** pada Category Breakdown; Ticket Volume tampil dengan sumbu kosong. |
| REP-08 | Data hanya milik pengguna yang login. |

---

## 7. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Sesi 3 jam, akses berbasis peran, sanitasi input/output, validasi lampiran. Dokumen akreditasi dapat bersifat rahasia sehingga lampiran hanya dapat diakses pemohon dan petugas terkait |
| Kinerja | Halaman utama < 3 detik; dropdown pencarian dengan debounce |
| Responsif | Nyaman di desktop dan tablet; sidebar dapat dilipat |
| Lokalisasi | Teks mengikuti pemilih bahasa; hilangkan campuran ID/EN |
| Aksesibilitas | Kontras memadai, navigasi keyboard, shortcut Ctrl+K |
| Ketersediaan | Target uptime 99% pada jam kerja |

---

## 8. Model Data (Usulan)

- **User**: id, nama, email, password_hash, role (`requester`, `supervisor`, `agent`, `admin`), instansi (perguruan tinggi/program studi/unit), bahasa.
- **Ticket**: id, judul, deskripsi, service_id, category_id, prioritas (boolean), status (`open`, `in_progress`, `resolved`), requester_id, assigned_to, created_at, resolved_at, updated_at.
- **TicketReply**: id, ticket_id, author_id, isi, created_at.
- **Service**, **Category**: id, nama, warna (Category memiliki service_id).
- **Attachment**: id, ticket_id/reply_id, nama_file, path, ukuran, mime.
- **Article**: id, judul, isi (markdown), status, warna_kartu, created_at.
- **ManualPage**: id, judul, slug, isi (markdown), urutan.
- **Notification**: id, user_id, pesan, dibaca, created_at.

## 9. Usulan Endpoint API

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/me` | Profil pengguna |
| GET | `/api/dashboard/summary` | Total, dalam proses, diselesaikan |
| GET | `/api/tickets` | Daftar tiket pengguna |
| POST | `/api/tickets` | Buat tiket (+ lampiran) |
| GET | `/api/tickets/{id}` | Detail dan percakapan |
| POST | `/api/tickets/{id}/replies` | Balas tiket |
| GET | `/api/services` | Daftar layanan |
| GET | `/api/services/{id}/categories` | Kategori per layanan |
| GET | `/api/articles` | Artikel published (`?q=`) |
| GET | `/api/articles/{id}` | Detail artikel |
| GET | `/api/manual` | Indeks Panduan Manual |
| GET | `/api/manual/{slug}` | Isi halaman manual |
| GET | `/api/reports/my-tickets?range=7\|30\|90` | Data laporan |
| GET | `/api/reports/my-tickets/export?range=` | Ekspor PDF |
| GET | `/api/notifications` | Notifikasi |

## 10. Alur Pengguna Utama

**Mengajukan pertanyaan**
1. Login, masuk ke Dasbor.
2. Klik **+ Tiket Baru**.
3. Isi Title, pilih Layanan dan Kategori, isi Description, lampirkan dokumen bila perlu.
4. Klik **Create Ticket**; tiket muncul di Permintaan Saya.
5. Petugas menjawab; pemohon menerima notifikasi dan dapat membalas.

**Mencari jawaban mandiri:** Panduan Mandiri, cari artikel, **Read more**.

**Melihat laporan:** Laporan, pilih periode, lihat KPI dan grafik, **Ekspor PDF**.

## 11. Kriteria Penerimaan (Ringkas)

- [ ] Seluruh identitas (logo, nama, teks) memakai LAMDEPILAR; tidak ada sisa teks "ITK" atau "Staf IT".
- [ ] Sidebar memuat 5 menu sesuai urutan dan dapat dilipat.
- [ ] Top bar memuat pencarian (Ctrl+K), bahasa, notifikasi, dan profil.
- [ ] Dasbor memuat 3 kartu statistik, panel Permintaan Saya, dan empty state sesuai teks.
- [ ] Form Tiket Baru memuat Title, Layanan, Kategori Masalah, toggle, Description (0/150), Attachment, dengan validasi.
- [ ] Tiket memiliki percakapan tanya jawab antara pemohon dan petugas.
- [ ] Panduan Mandiri berisi FAQ LAMDEPILAR dengan cuplikan bersih (tanpa entity/markdown mentah).
- [ ] Panduan Manual merender dua halaman awal lengkap dengan tabel, kode inline, dan gambar.
- [ ] Laporan memuat filter 7/30/90 hari, Total Tiket, Ticket Volume, Category Breakdown, Segarkan, Ekspor PDF, dan empty state.

---

## 12. Asumsi, Risiko, dan Pertanyaan Terbuka

1. **Pengguna dan peran LAMDEPILAR:** siapa saja yang boleh login (perguruan tinggi, program studi, asesor, publik)? Apakah pendaftaran mandiri atau dibuat admin?
2. **Domain email:** domain resmi LAMDEPILAR dan apakah email institusi mitra diterima.
3. **Daftar Layanan dan Kategori Masalah** LAMDEPILAR perlu ditentukan (contoh: akreditasi, asesmen, sertifikat, keanggotaan asesor, sistem informasi, informasi umum).
4. Makna toggle prioritas perlu dikonfirmasi dan labelnya diganti dari "Staf IT".
5. Batas **150 karakter** pada deskripsi terlalu pendek untuk pertanyaan akreditasi; disarankan dinaikkan.
6. Konten Panduan Mandiri dan Panduan Manual pada screenshot (WiFi, helpdesk.itk.ac.id) harus diganti sepenuhnya.
7. Bahasa antarmuka masih bercampur ID/EN; format tanggal Laporan masih gaya Inggris (*Oct 19, 2026*).
8. Batas ukuran dan tipe lampiran, serta kebijakan kerahasiaan dokumen akreditasi, belum ditentukan.
9. Label tombol tidak konsisten (Buat Tiket, Tiket Baru, Ajukan Permintaan); perlu diseragamkan.
10. Perlu diputuskan apakah istilah "Tiket" diganti menjadi "Pertanyaan" agar sesuai dengan layanan tanya jawab.
11. Kanal tambahan (email, WhatsApp) dan target waktu respons (SLA) belum ditentukan.
