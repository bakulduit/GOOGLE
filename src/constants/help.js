// Konten bantuan kontekstual per halaman modul (Bahasa Indonesia formal, langkah demi langkah).
// Struktur setiap entri:
//   title    : judul modul
//   purpose  : ringkasan tujuan modul
//   roles    : daftar peran yang umumnya memakai modul ini
//   steps    : langkah penggunaan berurutan
//   tips      : kiat singkat agar lebih optimal
//   caution  : hal penting yang perlu diperhatikan (opsional)
//   related  : tautan cepat ke modul terkait { label, to }
export const HELP = {
  dashboard: {
    title: "Dashboard",
    purpose: "Menyajikan ringkasan kondisi pengajuan dan status penjurnalan secara sekilas.",
    roles: ["Semua peran"],
    steps: [
      "Perhatikan kartu jumlah dokumen per jenis (PPBJ, PUM, PP, PTUM) di bagian atas.",
      "Pantau kartu status: Menunggu, Disetujui, Jurnal Dibuat, dan Total Nilai Pengajuan.",
      "Klik kartu jenis dokumen untuk membuka daftar dokumen terkait.",
      "Tinjau tabel \u201CPengajuan Terbaru\u201D untuk melihat aktivitas terkini.",
    ],
    tips: [
      "Angka diperbarui otomatis mengikuti dokumen yang disetujui/diposkan.",
      "Jadikan Dashboard titik awal harian untuk melihat apa yang butuh tindakan.",
    ],
    related: [
      { label: "Buka PPBJ", to: "/ppbj" },
      { label: "Lihat Anggaran", to: "/anggaran" },
    ],
  },
  ppbj: {
    title: "PPBJ \u2014 Permintaan Pengadaan Barang & Jasa",
    purpose: "Mengajukan kebutuhan pengadaan barang/jasa untuk diverifikasi anggaran dan disetujui.",
    roles: ["User (Pemohon)", "Admin", "Keuangan", "Approver"],
    steps: [
      "Klik \u201CBuat PPBJ\u201D di kanan atas.",
      "Isi unit kerja, kegiatan, tanggal, dan lokasi.",
      "Tambahkan rincian item: uraian, kuantitas, satuan, dan harga estimasi.",
      "Periksa total yang terhitung otomatis, lampirkan nota/penawaran bila ada.",
      "Klik Simpan untuk draft, atau Ajukan agar masuk proses persetujuan bertingkat.",
    ],
    tips: [
      "Gunakan kolom pencarian untuk menemukan dokumen berdasarkan nomor, kegiatan, atau supplier.",
      "Isi rincian item selengkap mungkin agar approver tidak perlu bertanya ulang.",
    ],
    caution: "Sistem memberi peringatan bila pengajuan melebihi pagu anggaran unit kerja pada bulan berjalan.",
    related: [
      { label: "Cek pagu di Anggaran", to: "/anggaran" },
      { label: "Lanjut ke PUM", to: "/pum" },
    ],
  },
  pum: {
    title: "PUM \u2014 Permohonan Uang Muka",
    purpose: "Mengajukan pencairan uang muka atas kegiatan yang telah disetujui.",
    roles: ["User (Pemohon)", "Admin", "Keuangan", "Approver"],
    steps: [
      "Klik \u201CBuat PUM\u201D.",
      "Isi unit kerja, keterangan, dan nilai uang muka yang diminta.",
      "Tentukan akun pembayaran dan akun uang muka bila diperlukan.",
      "Simpan sebagai draft, atau Ajukan ke Approver/Keuangan.",
    ],
    tips: [
      "Ajukan uang muka sesuai kebutuhan nyata agar mudah dipertanggungjawabkan.",
      "Simpan bukti kegiatan sejak awal untuk mempermudah pembuatan PTUM nanti.",
    ],
    caution: "Setiap uang muka yang dicairkan WAJIB dipertanggungjawabkan melalui dokumen PTUM.",
    related: [{ label: "Buat pertanggungjawaban (PTUM)", to: "/ptum" }],
  },
  pp: {
    title: "PP \u2014 Permohonan Pembayaran",
    purpose: "Mengajukan pembayaran kepada pihak ketiga/vendor lengkap dengan perhitungan pajak.",
    roles: ["User (Pemohon)", "Admin", "Keuangan", "Approver"],
    steps: [
      "Klik \u201CBuat PP\u201D.",
      "Isi penerima/supplier, keterangan, dan Dasar Pengenaan Pajak (DPP).",
      "Aktifkan PPN bila berlaku dan pilih jenis PPh yang sesuai.",
      "Periksa perhitungan pajak otomatis (mengikuti Pengaturan Pajak).",
      "Simpan untuk diproses persetujuan.",
    ],
    tips: [
      "Tarif PPN/PPh diambil dari menu Pengaturan Pajak; ubah di sana bila regulasi berubah.",
      "Isi Nomor Faktur Pajak agar ikut terekspor ke Accurate.",
      "Periksa kembali nilai bersih (setelah pajak) sebelum mengajukan.",
    ],
    related: [
      { label: "Atur tarif di Pengaturan Pajak", to: "/pajak" },
      { label: "Lihat hasil di Jurnal Umum", to: "/jurnal" },
    ],
  },
  ptum: {
    title: "PTUM \u2014 Pertanggungjawaban Uang Muka",
    purpose: "Melaporkan realisasi penggunaan uang muka (PUM) yang telah dicairkan.",
    roles: ["User (Pemohon)", "Admin", "Keuangan", "Approver"],
    steps: [
      "Klik \u201CBuat PTUM\u201D.",
      "Kaitkan dengan dokumen PUM terkait.",
      "Rinci realisasi penggunaan beserta nilai dan pajak bila ada.",
      "Sistem menghitung selisih (sisa/kelebihan) uang muka secara otomatis.",
      "Simpan untuk diverifikasi Bagian Keuangan.",
    ],
    tips: [
      "Lampirkan bukti/nota pengeluaran agar verifikasi lebih cepat.",
      "Buat PTUM segera setelah kegiatan selesai agar tidak menumpuk.",
    ],
    caution: "Selisih lebih akan dikembalikan ke kas; selisih kurang akan dibayarkan sebagai tambahan.",
    related: [{ label: "Lihat PUM terkait", to: "/pum" }],
  },
  kaskecil: {
    title: "Kas Kecil",
    purpose: "Mengajukan pengeluaran atau pengisian kas kecil operasional bernilai kecil.",
    roles: ["User (Pemohon)", "Admin", "Keuangan", "Approver"],
    steps: [
      "Klik \u201CBuat KASKECIL\u201D.",
      "Isi keterangan pengeluaran dan rincian nominal.",
      "Pilih akun pembayaran (umumnya Kas Kecil).",
      "Simpan untuk persetujuan.",
    ],
    tips: [
      "Gunakan Kas Kecil untuk pengeluaran rutin bernilai kecil, bukan pembayaran vendor besar.",
      "Untuk pembayaran ke vendor dengan pajak, gunakan modul PP.",
    ],
    related: [{ label: "Pembayaran vendor \u2192 PP", to: "/pp" }],
  },
  nrp: {
    title: "NRP \u2014 No Receipt Payment",
    purpose: "Mencatat pembayaran yang tidak memiliki kuitansi/bukti formal.",
    roles: ["User (Pemohon)", "Admin", "Keuangan", "Approver"],
    steps: [
      "Klik \u201CBuat NRP\u201D.",
      "Isi tujuan pembayaran, keterangan, dan nilainya.",
      "Simpan untuk ditinjau.",
    ],
    tips: [
      "Umumnya tanpa pajak dan dibayar melalui kas kecil.",
      "Tuliskan keterangan sejelas mungkin karena tidak ada bukti formal yang menyertainya.",
    ],
  },
  jurnal: {
    title: "Jurnal Umum",
    purpose: "Mengubah dokumen yang telah disetujui menjadi jurnal akuntansi siap ekspor ke Accurate Online.",
    roles: ["Keuangan", "Admin", "Approver"],
    steps: [
      "Jurnal dibuat dari halaman detail dokumen berstatus Disetujui (tombol \u201CBuat Jurnal Umum\u201D).",
      "Di halaman ini, gunakan filter Jenis/Tanggal untuk menyaring jurnal.",
      "Klik ikon mata untuk memeriksa rincian baris debit/kredit.",
      "Pastikan setiap jurnal berstatus \u201CBalance\u201D.",
      "Klik \u201CCSV\u201D atau \u201CExport Excel\u201D untuk mengunduh berkas impor Accurate.",
    ],
    tips: [
      "Format ekspor mengikuti template \u201CImpor Bukti Jurnal Umum\u201D Accurate Online.",
      "Kode akun mengacu pada Master Akun (COA) \u2014 pastikan COA sudah lengkap.",
    ],
    caution: "Jangan mengekspor jurnal yang belum \u201CBalance\u201D \u2014 impor ke Accurate akan gagal.",
    related: [
      { label: "Master Akun (COA)", to: "/akun" },
      { label: "Pengaturan Pajak", to: "/pajak" },
    ],
  },
  anggaran: {
    title: "Anggaran Bulanan",
    purpose: "Memantau pagu vs realisasi per unit kerja dan mengekspor rekap untuk pelaporan.",
    roles: ["Semua peran (kelola: Admin/Keuangan)"],
    steps: [
      "Tab \u201CBulanan\u201D: pilih periode untuk melihat pagu, realisasi, sisa, dan serapan per unit.",
      "Klik \u201CTambah Anggaran\u201D untuk menetapkan pagu unit kerja (peran Admin/Keuangan).",
      "Klik \u201CExport Excel\u201D untuk rekap satu bulan, atau \u201CRentang\u201D untuk beberapa bulan.",
      "Tab \u201CTahunan\u201D: lihat tren 12 bulan dan \u201CExport Excel\u201D rekap tahunan.",
    ],
    tips: [
      "Realisasi dihitung dari dokumen berstatus Disetujui/Diposkan pada periode terkait.",
      "Berkas Excel dilengkapi kop/logo, grafik, dan kolom tanda tangan, siap dicetak.",
      "Pantau kolom \u201CSerapan (%)\u201D untuk mendeteksi unit yang mendekati pagu.",
    ],
    related: [{ label: "Ajukan pengadaan \u2192 PPBJ", to: "/ppbj" }],
  },
  pajak: {
    title: "Pengaturan Pajak",
    purpose: "Mengatur tarif dan jenis pajak (PPN/PPh) yang dipakai pada perhitungan dokumen.",
    roles: ["Admin", "Keuangan"],
    steps: [
      "Atur Tarif PPN (%) dan pilih akun PPN Masukan.",
      "Pada tabel PPh, tambah/ubah kode, nama, tarif, dan akun hutang pajak.",
      "Isi keterangan agar mudah dikenali pengguna lain.",
      "Klik \u201CSimpan\u201D \u2014 tarif langsung dipakai pada modul PP/PTUM.",
    ],
    tips: [
      "Tarif mengikuti ketentuan perpajakan Indonesia; perbarui bila ada perubahan regulasi.",
      "Pastikan akun pajak sudah ada di Master Akun sebelum menautkannya.",
    ],
    caution: "Perubahan tarif berlaku untuk dokumen baru; dokumen lama tidak dihitung ulang otomatis.",
    related: [{ label: "Master Akun (COA)", to: "/akun" }],
  },
  akun: {
    title: "Master Akun (COA)",
    purpose: "Mengelola Chart of Accounts sebagai dasar penjurnalan.",
    roles: ["Admin", "Keuangan"],
    steps: [
      "Klik \u201CTambah Akun\u201D.",
      "Isi kode akun, nama, kategori, tipe, dan saldo normal (debit/kredit).",
      "Sesuaikan kode dengan struktur akun Accurate Online Anda.",
      "Simpan \u2014 akun menjadi pilihan saat penjurnalan & pengaturan pajak.",
    ],
    tips: [
      "Gunakan pencarian untuk menemukan akun berdasarkan kode atau nama.",
      "Samakan kode akun dengan Accurate agar impor jurnal langsung cocok.",
    ],
    related: [{ label: "Gunakan di Jurnal Umum", to: "/jurnal" }],
  },
  pengguna: {
    title: "Pengguna & Peran",
    purpose: "Mengelola akun pengguna, peran, status aktif, dan reset kata sandi.",
    roles: ["Admin", "Super Admin"],
    steps: [
      "Klik \u201CTambah Pengguna\u201D, isi nama, email, kata sandi, dan tetapkan peran.",
      "Gunakan filter peran untuk menyaring daftar pengguna.",
      "Gunakan ikon kunci untuk reset kata sandi, dan ikon daya untuk aktif/nonaktif.",
      "Ikon pensil untuk mengubah data; ikon tempat sampah untuk menghapus.",
    ],
    tips: [
      "Hanya Super Admin yang dapat mengelola akun Super Admin.",
      "Berikan peran seminimal mungkin sesuai kebutuhan (prinsip hak akses terkecil).",
    ],
    caution: "Anda tidak dapat menonaktifkan atau menghapus akun Anda sendiri.",
    related: [{ label: "Tinjau jejak audit", to: "/log-aktivitas" }],
  },
  log: {
    title: "Log Aktivitas",
    purpose: "Menelusuri jejak audit tindakan pada akun pengguna.",
    roles: ["Admin", "Super Admin"],
    steps: [
      "Gunakan filter aksi (Membuat, Mengubah, Reset Sandi, dll.) untuk menyaring.",
      "Baca kolom Waktu, Dilakukan Oleh, Aksi, Target, dan Detail.",
      "Klik \u201CMuat Ulang\u201D untuk memperbarui data terbaru.",
    ],
    tips: [
      "Gunakan log ini untuk keperluan audit dan keamanan.",
      "Tinjau log secara berkala untuk mendeteksi aktivitas tak lazim.",
    ],
  },
};
