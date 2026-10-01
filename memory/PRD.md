# PRD — Sistem Keuangan PT. Sumber Berdaya Bersama (PT. SBB)

## Problem Statement (asli)
Membangun aplikasi sistem keuangan untuk PT. SBB berdasarkan form Excel PPBJ (Permintaan Pengadaan Barang & Jasa). Alur pengadaan barang/jasa mengikuti file Excel. Output utama: **Jurnal Umum** siap input ke **Accurate Online**, lengkap **rincian pajak Indonesia** yang update. Logo tersemat digunakan sebagai identitas sistem.

## User Choices
- Alur end-to-end: PPBJ → PUM/PP → PTUM → Jurnal Umum (bertahap)
- Login + peran (admin, keuangan, approver, user)
- Tarif pajak default (PPN 11%, PPh 23 2%, dll) dengan halaman Pengaturan Pajak yang dapat diubah
- Output Jurnal Umum: tabel di layar + export Excel/CSV
- COA standar Indonesia yang dapat diedit
- Tema warna mengikuti logo (teal #14758a, oranye #f2941f, biru #4a90d9)

## Arsitektur
- Backend: FastAPI + MongoDB (motor). Auth JWT httpOnly cookies + RBAC. `server.py`, `seed_data.py`.
- Frontend: React 19 + Tailwind + shadcn, React Router, sonner. Brand: Plus Jakarta Sans / Inter.

## Personas
- Admin: kelola pengguna, COA, pajak, semua dokumen & jurnal.
- Keuangan: buat/proses dokumen, generate jurnal, export, kelola COA & pajak.
- Approver: menyetujui/menolak dokumen sesuai matriks otorisasi.
- User: mengajukan dokumen.

## Implemented (2026-06)
- Auth lengkap (login, me, refresh, logout, forgot/reset password), RBAC 4 peran, brute-force & rate limit, seed admin (mutiamute28@gmail.com) + demo keuangan.
- Master COA standar Indonesia (editable) + Pengaturan Pajak (PPN & PPh editable).
- Dokumen PPBJ (Rutin/Investasi/Tidak Rutin dengan line items), PUM, PP (panel pajak DPP/PPN/PPh/Faktur), PTUM (settlement uang muka).
- Matriks otorisasi multi-level (User → Kabag Keuangan → Wadir → Direktur).
- Generator Jurnal Umum otomatis dengan logika akuntansi & pajak Indonesia (Debit beban/aset + PPN Masukan, Kredit hutang PPh + kas/bank). Balanced.
- Halaman Jurnal Umum: filter, ringkasan debit/kredit, detail baris, export CSV & Excel format Accurate Online.
- Dashboard ringkasan. Testing agent: 100% backend & frontend pass.

- Form Kas Kecil & NRP, cetak PDF formulir A4 (PrintDoc.js), lampiran link.
- (2026-06, fork) Upload Nota nyata ke Emergent Object Storage (POST /api/upload, GET /api/files/{path}) + UI thumbnail di form & detail (`lib/tax.js`, DocumentForm, DocumentDetail).
- (2026-06, fork) PPh 21 progresif otomatis (breakdown lapisan) & PPh 4(2) konstruksi berjenjang (dropdown klasifikasi → pph_tier/pph_rate_override). Testing agent iteration_3: semua lolos.

- (2026-06, fork) **Anggaran Bulanan**: halaman `/anggaran` — pagu per unit kerja per bulan vs realisasi otomatis (hanya dokumen approved+posted). CRUD (admin/keuangan), stat cards, progress serapan, baris "belum dianggarkan". Endpoints: GET/POST/PUT/DELETE `/api/budgets`, GET `/api/budget-units`. Testing agent iteration_4: 100% lolos (backend 10/10 + frontend).

## Backlog
- P1 (BLOCKED, menunggu file template dari user): Format export Jurnal sesuai template import Accurate Online spesifik.
- P2: lampiran ATK/Pantry, nomor form kustom.
- P2: Notifikasi approval, laporan buku besar per akun.
- Cosmetic: render nilai kartu "Total Nilai Pengajuan" bila total 0.

## Next Tasks
- Konfirmasi format kolom import Accurate Online dari user, sesuaikan export.
- Tambah form Kas Kecil & NRP mengikuti Excel.

---
## Import & Setup + Iterasi (2026-09-25)
- Import dari `SIK-PPBJ-3-main.zip`; stack dipertahankan (React 19 + FastAPI + MongoDB). Backend & frontend boot tanpa error, DB terhubung.
- `.env` backend dilengkapi: JWT_SECRET, FRONTEND_URL, ADMIN_EMAIL/PASSWORD, EMERGENT_LLM_KEY (object storage), EMAIL_FROM_NAME.
- Superadmin diganti: nashoharizal@gmail.com (default admin@example.com dihapus).
- Data awal (seed_demo.py, idempoten): 4 unit kerja + pagu anggaran periode berjalan + 6 dokumen realisasi contoh → Dashboard & Rekap Anggaran terisi.
- Uji E2E: backend 24/24 pytest, frontend 100% (login, 10 halaman, alur PPBJ→PUM→PP→PTUM, approval, generate jurnal PPN/PPh balanced). Fix UI kartu "Total Nilai Pengujian" (inline style) diverifikasi.
- CATATAN: Email reset password belum dikonfigurasi (EMERGENT_EMAIL_KEY kosong) — link dicatat ke log, tidak dikirim email.


---
## Pembaruan (Sesi Impor & Penyempurnaan)
- Import repo GitHub SIK-PPBJ + install dependencies (backend & frontend) — aplikasi berjalan.
- Penyempurnaan Panduan Pengguna: hero gradient, grid Akses Cepat, bagian "Tips & Praktik Terbaik" (6 kartu), TOC diperluas.
- Bantuan kontekstual (ModuleHelp) dirombak: badge peran, kotak Perhatian, tautan Terkait (navigasi antar modul), footer "Buka Panduan Lengkap", body-scroll lock.
- help.js diperkaya (roles, caution, related, tips tambahan). TourModal: header gradient + tombol "Lewati tur".
- Perbaikan bug render escape unicode literal (\u2014/\u2026) di JSX menjadi karakter — dan ….
- Peningkatan UI global (brand tetap): tipografi (line-height, letter-spacing, font-features), radius kartu 0.625rem, bayangan lembut modern, focus-ring aksesibel, kontras sidebar/header naik.
- Terverifikasi via frontend testing agent: 20/20 skenario lulus.


---
## Pembaruan (Fitur: Tur Otomatis, Video Panduan, Cari Global)
- **Tur Otomatis Pertama**: TourModal muncul otomatis saat login pertama (localStorage "tour-seen"); tidak berulang setelah ditutup. (frontend: Layout.jsx)
- **Cari Global**: kotak pencarian di header (GlobalSearch.jsx) memanggil GET /api/documents/search (regex no/kegiatan/keterangan/supplier/unit_kerja/lokasi, debounce 300ms, dropdown + navigasi ke /documents/:id). Endpoint didefinisikan sebelum /documents/{doc_id}.
- **Video Panduan**: bagian baru di halaman Panduan (GuideVideos.jsx) dengan 5 slot alur (PPBJ, PP, PUM&PTUM, Jurnal, Anggaran). Admin/Keuangan dapat menempel tautan YouTube via tombol "Kelola Video" (validasi ID 11 karakter, reaktif). Tersimpan di DB via GET/PUT /api/guide-videos (PUT require_roles admin,keuangan).
- Terverifikasi: backend 32/32, frontend 19/19 + verifikasi perbaikan validasi 9/9.


---
## Pembaruan (Cari Global lanjutan + Naskah Video)
- **Filter Pencarian**: GET /api/documents/search kini menerima param opsional doc_type & status; UI header punya dropdown filter Jenis & Status + tombol Reset.
- **Sorot Kata Kunci**: hasil pencarian menyorot bagian teks yang cocok (<mark> amber).
- **Riwayat Pencarian**: query tersimpan di localStorage (maks 6), tampil saat input kosong, satu klik untuk mengulang, tombol Hapus.
- Terverifikasi: backend filter (semua skenario) + frontend 14/14. Dokumen uji sementara sudah dibersihkan (DB kembali 0 dokumen).
- **Deliverable non-kode**: naskah + storyboard video 1 menit (formal, Bahasa Indonesia) disimpan di /app/naskah_video_sik-ppbj.md.
