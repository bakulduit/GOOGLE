import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'sik-ppbj-jwt-secret-key-32chars-min-sbb';
const JWT_ALGORITHM = 'HS256';

// ------------------------------------------------------------------ SEED DATA
const DEFAULT_COA = [
  { code: '1-10001', name: 'Kas', category: 'Aset', type: 'Kas/Bank', normal: 'debit' },
  { code: '1-10002', name: 'Bank', category: 'Aset', type: 'Kas/Bank', normal: 'debit' },
  { code: '1-10003', name: 'Kas Kecil', category: 'Aset', type: 'Kas/Bank', normal: 'debit' },
  { code: '1-10200', name: 'Uang Muka Karyawan', category: 'Aset', type: 'Uang Muka', normal: 'debit' },
  { code: '1-10201', name: 'Uang Muka Pembelian', category: 'Aset', type: 'Uang Muka', normal: 'debit' },
  { code: '1-10300', name: 'Piutang Usaha', category: 'Aset', type: 'Piutang', normal: 'debit' },
  { code: '1-10400', name: 'PPN Masukan', category: 'Aset', type: 'Pajak Dibayar Dimuka', normal: 'debit' },
  { code: '1-20001', name: 'Persediaan Barang', category: 'Aset', type: 'Persediaan', normal: 'debit' },
  { code: '1-30001', name: 'Peralatan Kantor', category: 'Aset', type: 'Aset Tetap', normal: 'debit' },
  { code: '1-30002', name: 'Kendaraan', category: 'Aset', type: 'Aset Tetap', normal: 'debit' },
  { code: '1-30003', name: 'Bangunan & Gedung', category: 'Aset', type: 'Aset Tetap', normal: 'debit' },
  { code: '1-30004', name: 'Aset Dalam Penyelesaian', category: 'Aset', type: 'Aset Tetap', normal: 'debit' },
  { code: '2-10001', name: 'Hutang Usaha', category: 'Kewajiban', type: 'Hutang', normal: 'kredit' },
  { code: '2-10002', name: 'Hutang PPh Pasal 21', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '2-10003', name: 'Hutang PPh Pasal 22', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '2-10004', name: 'Hutang PPh Pasal 23', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '2-10005', name: 'Hutang PPh Pasal 4 ayat 2', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '2-10006', name: 'Hutang PPh Pasal 15', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '2-10007', name: 'Hutang PPh Pasal 26', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '2-10100', name: 'PPN Keluaran', category: 'Kewajiban', type: 'Hutang Pajak', normal: 'kredit' },
  { code: '6-10001', name: 'Beban ATK & Perlengkapan Kantor', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10002', name: 'Beban Pantry & Konsumsi', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10003', name: 'Beban Perbaikan & Pemeliharaan', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10004', name: 'Beban Perjalanan Dinas', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10005', name: 'Beban Jasa Profesional', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10006', name: 'Beban Sewa', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10007', name: 'Beban Listrik, Air & Telepon', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10008', name: 'Beban Bahan Praktek / Proyek', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
  { code: '6-10009', name: 'Beban Lain-lain', category: 'Beban', type: 'Beban Operasional', normal: 'debit' },
];

const DEFAULT_TAX_SETTINGS = {
  key: 'default',
  ppn_rate: 11.0,
  ppn_account: '1-10400',
  taxes: [
    { code: 'PPN', name: 'PPN Masukan (11%)', rate: 11.0, account: '1-10400', kind: 'ppn', desc: 'Pajak Pertambahan Nilai atas pembelian barang/jasa dari PKP.' },
    {
      code: 'PPH21', name: 'PPh Pasal 21 (Progresif)', rate: 5.0, account: '2-10002', kind: 'wht', mode: 'progressive',
      brackets: [
        { upto: 60000000, rate: 5.0 },
        { upto: 250000000, rate: 15.0 },
        { upto: 500000000, rate: 25.0 },
        { upto: 5000000000, rate: 30.0 },
        { upto: null, rate: 35.0 },
      ],
      desc: 'Tarif progresif UU HPP atas Penghasilan Kena Pajak (lapisan 5/15/25/30/35%). Dihitung otomatis dari DPP.'
    },
    { code: 'PPH22', name: 'PPh Pasal 22 (Pembelian Barang)', rate: 1.5, account: '2-10003', kind: 'wht', desc: 'Pemungutan atas pembelian barang tertentu / impor / oleh bendaharawan.' },
    { code: 'PPH23_JASA', name: 'PPh Pasal 23 - Jasa (2%)', rate: 2.0, account: '2-10004', kind: 'wht', desc: 'Pemotongan 2% atas imbalan jasa teknik/manajemen/konsultan/jasa lain.' },
    { code: 'PPH23_SEWA', name: 'PPh Pasal 23 - Sewa selain Tanah/Bangunan (2%)', rate: 2.0, account: '2-10004', kind: 'wht', desc: 'Pemotongan 2% atas sewa harta selain tanah dan/atau bangunan.' },
    { code: 'PPH42_SEWA', name: 'PPh Pasal 4(2) - Sewa Tanah/Bangunan Final (10%)', rate: 10.0, account: '2-10005', kind: 'wht', desc: 'PPh Final 10% atas sewa tanah dan/atau bangunan.' },
    {
      code: 'PPH42_KONSTRUKSI', name: 'PPh Pasal 4(2) - Jasa Konstruksi Final', rate: 2.65, account: '2-10005', kind: 'wht', mode: 'tiered',
      tiers: [
        { label: 'Pelaksana - Kualifikasi Kecil', rate: 1.75 },
        { label: 'Pelaksana - Menengah / Besar', rate: 2.65 },
        { label: 'Pelaksana - Tanpa Kualifikasi', rate: 4.0 },
        { label: 'Perencana / Pengawas - Berkualifikasi', rate: 3.5 },
        { label: 'Perencana / Pengawas - Tanpa Kualifikasi', rate: 6.0 },
      ],
      desc: 'PPh Final jasa konstruksi. Tarif berjenjang sesuai klasifikasi usaha; pilih klasifikasi saat pengajuan.'
    },
    { code: 'PPH15', name: 'PPh Pasal 15 (Pelayaran/Penerbangan)', rate: 1.2, account: '2-10006', kind: 'wht', desc: 'PPh atas jasa pelayaran/penerbangan dalam negeri (1,2%) dan lainnya.' },
    { code: 'PPH26', name: 'PPh Pasal 26 (WP Luar Negeri 20%)', rate: 20.0, account: '2-10007', kind: 'wht', desc: 'Pemotongan 20% atas penghasilan WP luar negeri (dapat berubah sesuai P3B/tax treaty).' },
  ],
};

function nowIso(): string {
  return new Date().toISOString();
}

// ------------------------------------------------------------------ IN-MEMORY DATABASE
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'superadmin' | 'admin' | 'keuangan' | 'approver' | 'user';
  token_version: number;
  active: boolean;
  created_at: string;
}

const users: User[] = [
  {
    id: 'usr-superadmin',
    email: 'admin@example.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    name: 'Super Admin',
    role: 'superadmin',
    token_version: 0,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'usr-admin',
    email: 'admin@sbb.co.id',
    password_hash: bcrypt.hashSync('admin123', 10),
    name: 'Administrator',
    role: 'admin',
    token_version: 0,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'usr-keuangan',
    email: 'keuangan@sbb.co.id',
    password_hash: bcrypt.hashSync('keuangan123', 10),
    name: 'Staff Keuangan',
    role: 'keuangan',
    token_version: 0,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'usr-approver',
    email: 'approver@sbb.co.id',
    password_hash: bcrypt.hashSync('approver123', 10),
    name: 'Approver Otorisasi',
    role: 'approver',
    token_version: 0,
    active: true,
    created_at: nowIso(),
  },
  {
    id: 'usr-pemohon',
    email: 'pemohon@sbb.co.id',
    password_hash: bcrypt.hashSync('pemohon123', 10),
    name: 'Pemohon Pengadaan',
    role: 'user',
    token_version: 0,
    active: true,
    created_at: nowIso(),
  },
];

const accounts = DEFAULT_COA.map((a) => ({ ...a, id: `acc-${a.code}` }));
let taxSettings = JSON.parse(JSON.stringify(DEFAULT_TAX_SETTINGS));
let guideVideos: Record<string, string> = {
  ppbj: '',
  pp: '',
  pumptum: '',
  jurnal: '',
  anggaran: '',
};

interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  target_id?: string;
  target_email?: string;
  target_name?: string;
  target_role?: string;
  details?: string;
  created_at: string;
}
const auditLogs: AuditLog[] = [];

interface Budget {
  id: string;
  unit_kerja: string;
  period: string; // YYYY-MM
  amount: number;
  catatan?: string;
  created_at: string;
}

const currentPeriod = nowIso().slice(0, 7);
const currentYear = new Date().getFullYear();

const budgets: Budget[] = [
  { id: 'bgt-1', unit_kerja: 'Bagian Umum & RT', period: currentPeriod, amount: 25000000, catatan: 'Anggaran operasional bulanan', created_at: nowIso() },
  { id: 'bgt-2', unit_kerja: 'Teknologi Informasi', period: currentPeriod, amount: 40000000, catatan: 'Infrastruktur dan lisensi IT', created_at: nowIso() },
  { id: 'bgt-3', unit_kerja: 'Keuangan & Akuntansi', period: currentPeriod, amount: 15000000, catatan: 'Audit & perpajakan', created_at: nowIso() },
  { id: 'bgt-4', unit_kerja: 'Akademik & Pengajaran', period: currentPeriod, amount: 50000000, catatan: 'Bahan praktek & laboratorium', created_at: nowIso() },
];

interface ApprovalStep {
  role_label: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  at?: string | null;
}

interface DocumentItem {
  kode?: string;
  uraian: string;
  tanggal_dibutuhkan?: string;
  kuantitas: number;
  satuan: string;
  harga_estimasi: number;
  total: number;
}

interface Document {
  id: string;
  no: string;
  doc_type: string;
  sub_type?: string | null;
  entitas: string;
  unit_kerja: string;
  kegiatan: string;
  lokasi: string;
  anggaran_status: string;
  tanggal: string;
  supplier: string;
  keterangan: string;
  items: DocumentItem[];
  total: number;
  dpp: number;
  ppn_enabled: boolean;
  pph_code?: string | null;
  pph_rate_override?: number | null;
  pph_tier?: string | null;
  faktur_pajak?: string;
  expense_account?: string | null;
  payment_account?: string | null;
  advance_account?: string | null;
  related_id?: string | null;
  uang_muka_amount?: number;
  attachments: any[];
  status: 'pending_approval' | 'approved' | 'rejected' | 'posted';
  approvals: ApprovalStep[];
  created_by: { id: string; email: string; name: string; role: string };
  created_at: string;
  journal_generated: boolean;
}

function approvalTemplate(docType: string): ApprovalStep[] {
  const templates: Record<string, string[]> = {
    KASKECIL: ['Diajukan Oleh (User)', 'Diverifikasi (Keuangan)', 'Diketahui (Direktur)', 'Dibukukan (Kabag Keuangan)'],
    NRP: ['Diajukan Oleh (User)', 'Disetujui Oleh (Keuangan)'],
  };
  const labels = templates[docType] || [
    'Diajukan Oleh (User)',
    'Diperiksa Anggaran (Kabag Keuangan)',
    'Diverifikasi (Wadir)',
    'Disetujui (Direktur)',
  ];
  return labels.map((l) => ({
    role_label: l,
    name: '',
    status: 'pending',
    note: '',
    at: null,
  }));
}

let docCounter = 1;
function generateDocNo(docType: string): string {
  const countStr = String(docCounter++).padStart(3, '0');
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${countStr}/${docType}-BJM/${month}/${year}`;
}

const documents: Document[] = [
  {
    id: 'doc-demo-1',
    no: `001/PPBJ-BJM/${String(new Date().getMonth() + 1).padStart(2, '0')}/${currentYear}`,
    doc_type: 'PPBJ',
    sub_type: 'Rutin',
    entitas: 'POLITEKNIK HASNUR',
    unit_kerja: 'Bagian Umum & RT',
    kegiatan: 'Pengadaan Kertas HVS & Tinta Printer Kantor',
    lokasi: 'Gedung Pusat Banjarmasin',
    anggaran_status: 'Dianggarkan',
    tanggal: nowIso().slice(0, 10),
    supplier: 'CV. Mega Stationary',
    keterangan: 'Kebutuhan ATK untuk operasional administrasi semester ganjil',
    items: [
      { kode: 'ATK-01', uraian: 'Kertas HVS A4 80gr PaperOne', tanggal_dibutuhkan: nowIso().slice(0, 10), kuantitas: 20, satuan: 'Rim', harga_estimasi: 55000, total: 1100000 },
      { kode: 'ATK-02', uraian: 'Tinta Printer Epson 003 Black & Color', tanggal_dibutuhkan: nowIso().slice(0, 10), kuantitas: 4, satuan: 'Set', harga_estimasi: 350000, total: 1400000 },
    ],
    total: 2500000,
    dpp: 2500000,
    ppn_enabled: true,
    pph_code: 'PPH22',
    pph_rate_override: null,
    pph_tier: null,
    faktur_pajak: '010.000-24.12345678',
    expense_account: '6-10001',
    payment_account: '1-10002',
    advance_account: '1-10200',
    related_id: null,
    uang_muka_amount: 0,
    attachments: [],
    status: 'approved',
    approvals: [
      { role_label: 'Diajukan Oleh (User)', name: 'Pemohon Pengadaan', status: 'approved', note: 'Pengajuan rutin bulanan', at: nowIso() },
      { role_label: 'Diperiksa Anggaran (Kabag Keuangan)', name: 'Staff Keuangan', status: 'approved', note: 'Sesuai pagu anggaran RT', at: nowIso() },
      { role_label: 'Diverifikasi (Wadir)', name: 'Approver Otorisasi', status: 'approved', note: 'Disetujui', at: nowIso() },
      { role_label: 'Disetujui (Direktur)', name: 'Direktur Politeknik', status: 'approved', note: 'Lanjutkan proses', at: nowIso() },
    ],
    created_by: { id: 'usr-pemohon', email: 'pemohon@sbb.co.id', name: 'Pemohon Pengadaan', role: 'user' },
    created_at: nowIso(),
    journal_generated: false,
  },
  {
    id: 'doc-demo-2',
    no: `002/PUM-BJM/${String(new Date().getMonth() + 1).padStart(2, '0')}/${currentYear}`,
    doc_type: 'PUM',
    sub_type: 'Tidak Rutin',
    entitas: 'POLITEKNIK HASNUR',
    unit_kerja: 'Teknologi Informasi',
    kegiatan: 'Uang Muka Pelaksanaan Pelatihan Cloud & Keamanan Jaringan',
    lokasi: 'Kampus SBB Banjarmasin',
    anggaran_status: 'Dianggarkan',
    tanggal: nowIso().slice(0, 10),
    supplier: 'Penyedia Trainer Profesional',
    keterangan: 'Uang muka akomodasi dan honorarium awal trainer sertifikasi',
    items: [],
    total: 8000000,
    dpp: 8000000,
    ppn_enabled: false,
    pph_code: null,
    pph_rate_override: null,
    pph_tier: null,
    faktur_pajak: '',
    expense_account: '6-10005',
    payment_account: '1-10002',
    advance_account: '1-10200',
    related_id: null,
    uang_muka_amount: 8000000,
    attachments: [],
    status: 'pending_approval',
    approvals: approvalTemplate('PUM'),
    created_by: { id: 'usr-admin', email: 'admin@sbb.co.id', name: 'Administrator', role: 'admin' },
    created_at: nowIso(),
    journal_generated: false,
  },
];

interface JournalLine {
  account_code: string;
  account_name: string;
  debit: number;
  kredit: number;
  memo: string;
}

interface Journal {
  id: string;
  source_id: string;
  no_bukti: string;
  doc_type: string;
  tanggal: string;
  keterangan: string;
  supplier: string;
  unit_kerja: string;
  faktur_pajak: string;
  lines: JournalLine[];
  total_debit: number;
  total_kredit: number;
  balanced: boolean;
  created_at: string;
  created_by: string;
}

const journals: Journal[] = [];

// Stored file records
interface StoredFile {
  id: string;
  storage_path: string;
  original_filename: string;
  content_type: string;
  size: number;
  buffer: Buffer;
  created_at: string;
}
const storedFiles: Map<string, StoredFile> = new Map();

// Helper functions
function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
  };
}

function createAccessToken(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    ver: user.token_version,
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
}

function createRefreshToken(user: User): string {
  const payload = {
    sub: user.id,
    ver: user.token_version,
    type: 'refresh',
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
}

function setAuthCookies(res: Response, access: string, refresh: string) {
  res.cookie('access_token', access, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 900 * 1000,
    path: '/',
  });
  res.cookie('refresh_token', refresh, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/',
  });
}

function getCurrentUser(req: Request): User | null {
  let token = req.cookies?.access_token;
  if (!token) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== 'access') return null;
    const u = users.find((x) => x.id === payload.sub);
    if (!u || u.token_version !== payload.ver || !u.active) return null;
    return u;
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const u = getCurrentUser(req);
  if (!u) {
    res.status(401).json({ detail: 'Belum login' });
    return;
  }
  (req as any).user = u;
  next();
}

function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user || getCurrentUser(req);
    if (!u) {
      res.status(401).json({ detail: 'Belum login' });
      return;
    }
    (req as any).user = u;
    if (u.role === 'superadmin') {
      return next();
    }
    if (allowedRoles.length && !allowedRoles.includes(u.role)) {
      res.status(403).json({ detail: 'Akses ditolak untuk peran Anda' });
      return;
    }
    next();
  };
}

function getAccountName(code: string): string {
  const a = accounts.find((x) => x.code === code);
  return a ? a.name : code;
}

function computeBudgetCheck(unitKerja?: string, period?: string, extra: number = 0) {
  if (!unitKerja || !period) return null;
  const b = budgets.find((x) => x.unit_kerja === unitKerja && x.period === period);
  if (!b) return null;
  const pagu = b.amount || 0;
  let committed = 0;
  for (const d of documents) {
    if (d.unit_kerja === unitKerja && d.status !== 'rejected') {
      const dt = (d.tanggal || d.created_at || '').slice(0, 7);
      if (dt === period) {
        committed += d.total || 0;
      }
    }
  }
  committed += extra;
  return {
    unit_kerja: unitKerja,
    period: period,
    pagu: pagu,
    committed: committed,
    sisa: pagu - committed,
    over: committed > pagu,
    over_amount: Math.max(0, committed - pagu),
  };
}

function computeBudgetRecap(period: string) {
  const relevantBudgets = budgets.filter((b) => b.period === period);
  const approvedDocs = documents.filter(
    (d) =>
      ['approved', 'posted'].includes(d.status) &&
      (d.tanggal || d.created_at || '').slice(0, 7) === period
  );

  const real: Record<string, number> = {};
  const cnt: Record<string, number> = {};

  for (const d of approvedDocs) {
    const u = d.unit_kerja || '(Tanpa Unit)';
    real[u] = (real[u] || 0) + (d.total || 0);
    cnt[u] = (cnt[u] || 0) + 1;
  }

  const rows: any[] = [];
  const seen = new Set<string>();

  for (const b of relevantBudgets) {
    const u = b.unit_kerja;
    seen.add(u);
    const r = real[u] || 0;
    const pagu = b.amount || 0;
    rows.push({
      ...b,
      realisasi: r,
      doc_count: cnt[u] || 0,
      sisa: pagu - r,
      persen: pagu ? Math.round((r / pagu) * 1000) / 10 : 0,
      no_budget: false,
    });
  }

  for (const [u, r] of Object.entries(real)) {
    if (!seen.has(u)) {
      rows.push({
        id: null,
        unit_kerja: u,
        period: period,
        amount: 0,
        catatan: '',
        realisasi: r,
        doc_count: cnt[u] || 0,
        sisa: -r,
        persen: 0,
        no_budget: true,
      });
    }
  }

  rows.sort((a, b) => a.unit_kerja.localeCompare(b.unit_kerja));

  const totalPagu = relevantBudgets.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalRealisasi = Object.values(real).reduce((acc, v) => acc + v, 0);

  return {
    period,
    rows,
    total_pagu: totalPagu,
    total_realisasi: totalRealisasi,
  };
}

// ------------------------------------------------------------------ EXPRESS APP & ROUTER
const app = express();
const api = express.Router();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// ------------------------------------------------------------------ AUTH ROUTES
api.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ detail: 'Email dan kata sandi wajib diisi' });
    return;
  }
  const em = String(email).trim().toLowerCase();
  const u = users.find((x) => x.email.toLowerCase() === em);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    res.status(401).json({ detail: 'Email atau kata sandi salah' });
    return;
  }
  if (!u.active) {
    res.status(403).json({ detail: 'Akun dinonaktifkan. Hubungi administrator.' });
    return;
  }

  const access = createAccessToken(u);
  const refresh = createRefreshToken(u);
  setAuthCookies(res, access, refresh);
  res.json({
    ...publicUser(u),
    token: access,
    access_token: access,
  });
});

api.get('/auth/me', (req: Request, res: Response) => {
  const u = getCurrentUser(req);
  if (!u) {
    // Return null with 200 OK so initial session verification doesn't throw 401 error
    res.json(null);
    return;
  }
  res.json(publicUser(u));
});

api.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ message: 'Logout berhasil' });
});

api.post('/auth/refresh', (req: Request, res: Response) => {
  let token = req.cookies?.refresh_token;
  if (!token) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  if (!token) {
    res.status(401).json({ detail: 'Tidak ada refresh token' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== 'refresh' && payload.type !== 'access') {
      res.status(401).json({ detail: 'Token tidak valid' });
      return;
    }
    const u = users.find((x) => x.id === payload.sub);
    if (!u || payload.ver !== u.token_version) {
      res.status(401).json({ detail: 'Sesi berakhir' });
      return;
    }
    const access = createAccessToken(u);
    res.cookie('access_token', access, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 900 * 1000,
      path: '/',
    });
    res.json({
      ...publicUser(u),
      token: access,
      access_token: access,
    });
  } catch {
    res.status(401).json({ detail: 'Token tidak valid' });
  }
});

api.post('/auth/register', requireRoles('admin'), (req: Request, res: Response) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password || !name) {
    res.status(400).json({ detail: 'Data tidak lengkap' });
    return;
  }
  const em = String(email).trim().toLowerCase();
  if (users.some((x) => x.email.toLowerCase() === em)) {
    res.status(400).json({ detail: 'Email sudah terdaftar' });
    return;
  }
  const curUser = (req as any).user as User;
  const userRole = ['superadmin', 'admin', 'keuangan', 'approver', 'user'].includes(role) ? role : 'user';
  if (userRole === 'superadmin' && curUser.role !== 'superadmin') {
    res.status(403).json({ detail: 'Hanya super admin yang dapat membuat akun super admin' });
    return;
  }
  const newUser: User = {
    id: `usr-${crypto.randomUUID()}`,
    email: em,
    password_hash: bcrypt.hashSync(password, 10),
    name,
    role: userRole,
    token_version: 0,
    active: true,
    created_at: nowIso(),
  };
  users.push(newUser);
  auditLogs.unshift({
    id: crypto.randomUUID(),
    action: 'user.create',
    actor_id: curUser.id,
    actor_email: curUser.email,
    actor_name: curUser.name,
    actor_role: curUser.role,
    target_id: newUser.id,
    target_email: newUser.email,
    target_name: newUser.name,
    target_role: newUser.role,
    details: `Membuat pengguna baru (peran: ${userRole})`,
    created_at: nowIso(),
  });
  res.json(publicUser(newUser));
});

api.post('/auth/forgot-password', (req: Request, res: Response) => {
  res.json({ message: 'Jika email terdaftar, tautan reset telah dikirim.' });
});

api.post('/auth/reset-password', (req: Request, res: Response) => {
  res.json({ message: 'Kata sandi berhasil diubah' });
});

// ------------------------------------------------------------------ USERS (ADMIN)
api.get('/users', requireRoles('admin'), (req: Request, res: Response) => {
  res.json(users.map(publicUser));
});

api.put('/users/:uid', requireRoles('admin'), (req: Request, res: Response) => {
  const { uid } = req.params;
  const target = users.find((x) => x.id === uid);
  if (!target) {
    res.status(404).json({ detail: 'Pengguna tidak ditemukan' });
    return;
  }
  const curUser = (req as any).user as User;
  const isSuper = curUser.role === 'superadmin';
  const { name, role, password } = req.body || {};

  if (target.role === 'superadmin' && !isSuper) {
    res.status(403).json({ detail: 'Hanya super admin yang dapat mengubah akun super admin' });
    return;
  }
  if (role === 'superadmin' && !isSuper) {
    res.status(403).json({ detail: 'Hanya super admin yang dapat menetapkan peran super admin' });
    return;
  }

  if (name) target.name = name;
  if (role && ['superadmin', 'admin', 'keuangan', 'approver', 'user'].includes(role)) target.role = role;
  if (password && password.length >= 6) {
    target.password_hash = bcrypt.hashSync(password, 10);
    target.token_version++;
  }

  auditLogs.unshift({
    id: crypto.randomUUID(),
    action: 'user.update',
    actor_id: curUser.id,
    actor_email: curUser.email,
    actor_name: curUser.name,
    actor_role: curUser.role,
    target_id: target.id,
    target_email: target.email,
    target_name: target.name,
    target_role: target.role,
    details: 'Memperbarui data pengguna',
    created_at: nowIso(),
  });

  res.json(publicUser(target));
});

api.post('/users/:uid/reset-password', requireRoles('admin'), (req: Request, res: Response) => {
  const { uid } = req.params;
  const target = users.find((x) => x.id === uid);
  if (!target) {
    res.status(404).json({ detail: 'Pengguna tidak ditemukan' });
    return;
  }
  const { password } = req.body || {};
  if (!password || password.length < 6) {
    res.status(400).json({ detail: 'Kata sandi minimal 6 karakter' });
    return;
  }
  target.password_hash = bcrypt.hashSync(password, 10);
  target.token_version++;
  res.json({ message: 'Kata sandi pengguna berhasil direset' });
});

api.patch('/users/:uid/active', requireRoles('admin'), (req: Request, res: Response) => {
  const { uid } = req.params;
  const curUser = (req as any).user as User;
  if (curUser.id === uid) {
    res.status(400).json({ detail: 'Tidak dapat menonaktifkan akun sendiri' });
    return;
  }
  const target = users.find((x) => x.id === uid);
  if (!target) {
    res.status(404).json({ detail: 'Pengguna tidak ditemukan' });
    return;
  }
  target.active = Boolean(req.body?.active);
  target.token_version++;
  res.json(publicUser(target));
});

api.delete('/users/:uid', requireRoles('admin'), (req: Request, res: Response) => {
  const { uid } = req.params;
  const curUser = (req as any).user as User;
  if (curUser.id === uid) {
    res.status(400).json({ detail: 'Tidak dapat menghapus akun sendiri' });
    return;
  }
  const idx = users.findIndex((x) => x.id === uid);
  if (idx === -1) {
    res.status(404).json({ detail: 'Pengguna tidak ditemukan' });
    return;
  }
  users.splice(idx, 1);
  res.json({ message: 'User dihapus' });
});

api.get('/audit-logs', requireRoles('admin'), (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  res.json(auditLogs.slice(0, limit));
});

// ------------------------------------------------------------------ MASTER ACCOUNTS (COA)
api.get('/accounts', requireAuth, (req: Request, res: Response) => {
  const sorted = [...accounts].sort((a, b) => a.code.localeCompare(b.code));
  res.json(sorted);
});

api.post('/accounts', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const { code, name, category, type, normal } = req.body || {};
  if (!code || !name) {
    res.status(400).json({ detail: 'Kode dan nama akun wajib diisi' });
    return;
  }
  if (accounts.some((a) => a.code === code)) {
    res.status(400).json({ detail: 'Kode akun sudah ada' });
    return;
  }
  const acc = {
    id: `acc-${crypto.randomUUID()}`,
    code,
    name,
    category: category || 'Beban',
    type: type || '',
    normal: normal || 'debit',
  };
  accounts.push(acc);
  res.json(acc);
});

api.put('/accounts/:id', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const { id } = req.params;
  const acc = accounts.find((x) => x.id === id);
  if (!acc) {
    res.status(404).json({ detail: 'Akun tidak ditemukan' });
    return;
  }
  Object.assign(acc, req.body);
  res.json(acc);
});

api.delete('/accounts/:id', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = accounts.findIndex((x) => x.id === id);
  if (idx !== -1) accounts.splice(idx, 1);
  res.json({ message: 'Akun dihapus' });
});

// ------------------------------------------------------------------ TAX SETTINGS
api.get('/tax-settings', requireAuth, (req: Request, res: Response) => {
  res.json(taxSettings);
});

api.put('/tax-settings', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const { ppn_rate, ppn_account, taxes } = req.body || {};
  taxSettings = {
    key: 'default',
    ppn_rate: Number(ppn_rate) || 11.0,
    ppn_account: ppn_account || '1-10400',
    taxes: Array.isArray(taxes) ? taxes : taxSettings.taxes,
  };
  res.json(taxSettings);
});

// ------------------------------------------------------------------ GUIDE VIDEOS
api.get('/guide-videos', requireAuth, (req: Request, res: Response) => {
  res.json(guideVideos);
});

api.put('/guide-videos', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  guideVideos = { ...guideVideos, ...req.body };
  res.json(guideVideos);
});

// ------------------------------------------------------------------ DOCUMENTS
api.get('/documents', requireAuth, (req: Request, res: Response) => {
  const { doc_type } = req.query;
  let list = [...documents];
  if (doc_type && typeof doc_type === 'string') {
    list = list.filter((d) => d.doc_type === doc_type);
  }
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(list);
});

api.get('/documents/search', requireAuth, (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const docType = req.query.doc_type ? String(req.query.doc_type) : null;
  const status = req.query.status ? String(req.query.status) : null;

  if (q.length < 2) {
    res.json([]);
    return;
  }

  let list = documents.filter((d) => {
    const matchTerm =
      d.no.toLowerCase().includes(q) ||
      (d.kegiatan || '').toLowerCase().includes(q) ||
      (d.keterangan || '').toLowerCase().includes(q) ||
      (d.supplier || '').toLowerCase().includes(q) ||
      (d.unit_kerja || '').toLowerCase().includes(q) ||
      (d.lokasi || '').toLowerCase().includes(q);

    if (!matchTerm) return false;
    if (docType && d.doc_type !== docType) return false;
    if (status && d.status !== status) return false;
    return true;
  });

  list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(list.slice(0, 15));
});

api.get('/documents/:id', requireAuth, (req: Request, res: Response) => {
  const doc = documents.find((x) => x.id === req.params.id);
  if (!doc) {
    res.status(404).json({ detail: 'Dokumen tidak ditemukan' });
    return;
  }
  res.json(doc);
});

api.post('/documents', requireAuth, (req: Request, res: Response) => {
  const curUser = (req as any).user as User;
  const body = req.body || {};
  const validTypes = ['PPBJ', 'PUM', 'PP', 'PTUM', 'KASKECIL', 'NRP'];
  if (!validTypes.includes(body.doc_type)) {
    res.status(400).json({ detail: 'Jenis dokumen tidak valid' });
    return;
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const total = items.length
    ? items.reduce((acc, it) => acc + (it.total || (it.kuantitas || 1) * (it.harga_estimasi || 0)), 0)
    : Number(body.total) || 0;

  const newDoc: Document = {
    id: `doc-${crypto.randomUUID()}`,
    no: generateDocNo(body.doc_type),
    doc_type: body.doc_type,
    sub_type: body.sub_type || null,
    entitas: body.entitas || 'POLITEKNIK HASNUR',
    unit_kerja: body.unit_kerja || '',
    kegiatan: body.kegiatan || '',
    lokasi: body.lokasi || '',
    anggaran_status: body.anggaran_status || 'Dianggarkan',
    tanggal: body.tanggal || nowIso().slice(0, 10),
    supplier: body.supplier || '',
    keterangan: body.keterangan || '',
    items: items,
    total: total,
    dpp: Number(body.dpp) || total,
    ppn_enabled: Boolean(body.ppn_enabled),
    pph_code: body.pph_code || null,
    pph_rate_override: body.pph_rate_override ? Number(body.pph_rate_override) : null,
    pph_tier: body.pph_tier || null,
    faktur_pajak: body.faktur_pajak || '',
    expense_account: body.expense_account || null,
    payment_account: body.payment_account || '1-10002',
    advance_account: body.advance_account || '1-10200',
    related_id: body.related_id || null,
    uang_muka_amount: Number(body.uang_muka_amount) || 0,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    status: 'pending_approval',
    approvals: approvalTemplate(body.doc_type),
    created_by: publicUser(curUser),
    created_at: nowIso(),
    journal_generated: false,
  };

  documents.unshift(newDoc);
  const period = (newDoc.tanggal || newDoc.created_at || '').slice(0, 7);
  const check = computeBudgetCheck(newDoc.unit_kerja, period);
  const responseData: any = { ...newDoc };
  if (check && check.over) {
    responseData.budget_warning = check;
  }
  res.json(responseData);
});

api.put('/documents/:id', requireAuth, (req: Request, res: Response) => {
  const doc = documents.find((x) => x.id === req.params.id);
  if (!doc) {
    res.status(404).json({ detail: 'Dokumen tidak ditemukan' });
    return;
  }
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : doc.items;
  const total = items.length
    ? items.reduce((acc, it) => acc + (it.total || (it.kuantitas || 1) * (it.harga_estimasi || 0)), 0)
    : Number(body.total) || doc.total;

  Object.assign(doc, body, { items, total });
  res.json(doc);
});

api.delete('/documents/:id', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const idx = documents.findIndex((x) => x.id === req.params.id);
  if (idx !== -1) {
    documents.splice(idx, 1);
  }
  const jIdx = journals.findIndex((j) => j.source_id === req.params.id);
  if (jIdx !== -1) journals.splice(jIdx, 1);
  res.json({ message: 'Dokumen dihapus' });
});

api.post('/documents/:id/approve', requireRoles('admin', 'approver', 'keuangan'), (req: Request, res: Response) => {
  const doc = documents.find((x) => x.id === req.params.id);
  if (!doc) {
    res.status(404).json({ detail: 'Dokumen tidak ditemukan' });
    return;
  }
  const { step_index, action, note } = req.body || {};
  const approvals = doc.approvals || [];
  if (step_index < 0 || step_index >= approvals.length) {
    res.status(400).json({ detail: 'Langkah otorisasi tidak valid' });
    return;
  }

  const curUser = (req as any).user as User;
  approvals[step_index] = {
    ...approvals[step_index],
    status: action === 'approve' ? 'approved' : 'rejected',
    name: curUser.name,
    note: note || '',
    at: nowIso(),
  };

  if (action === 'reject') {
    doc.status = 'rejected';
  } else if (approvals.every((a) => a.status === 'approved')) {
    doc.status = 'approved';
  } else {
    doc.status = 'pending_approval';
  }

  res.json(doc);
});

// ------------------------------------------------------------------ JURNAL UMUM
function computePphAmount(dpp: number, t: any, overrideRate?: number | null): number {
  if (!t) return 0;
  if (t.mode === 'progressive' && t.brackets?.length) {
    let amt = 0;
    let prev = 0;
    for (const b of t.brackets) {
      const top = b.upto == null ? dpp : Number(b.upto);
      if (dpp > prev) {
        const taxable = Math.min(dpp, top) - prev;
        if (taxable > 0) amt += taxable * (Number(b.rate) / 100);
        prev = top;
      } else break;
    }
    return amt;
  }
  const rate = overrideRate != null ? overrideRate : t.rate || 0;
  return dpp * (Number(rate) / 100);
}

function buildJournalLines(doc: Document, tax: typeof taxSettings): JournalLine[] {
  const lines: JournalLine[] = [];
  const dtype = doc.doc_type;
  const ket = doc.keterangan || doc.kegiatan || doc.no;

  const addLine = (code: string, debit = 0, kredit = 0, memo = '') => {
    lines.push({
      account_code: code,
      account_name: getAccountName(code),
      debit: Math.round(debit * 100) / 100,
      kredit: Math.round(kredit * 100) / 100,
      memo: memo || ket,
    });
  };

  if (dtype === 'PUM') {
    const amt = doc.total || doc.uang_muka_amount || 0;
    addLine(doc.advance_account || '1-10200', amt, 0, `Uang muka - ${ket}`);
    addLine(doc.payment_account || '1-10002', 0, amt, `Pembayaran uang muka - ${ket}`);
    return lines;
  }

  const dpp = doc.dpp || doc.total || 0;
  let ppn = 0;
  if (doc.ppn_enabled) {
    ppn = dpp * ((tax.ppn_rate || 11) / 100);
  }

  let pph = 0;
  let pphAccount = '2-10004';
  let pphName = 'PPh';
  if (doc.pph_code) {
    const t = tax.taxes?.find((x: any) => x.code === doc.pph_code);
    if (t) {
      pph = computePphAmount(dpp, t, doc.pph_rate_override);
      pphAccount = t.account;
      pphName = doc.pph_tier ? `${t.name} (${doc.pph_tier})` : t.name;
    }
  }

  if (dtype === 'PTUM') {
    const expense = doc.expense_account || '6-10009';
    const realized = doc.total || dpp;
    const advance = doc.uang_muka_amount || 0;
    addLine(expense, realized, 0, `Realisasi beban - ${ket}`);
    if (ppn) addLine(tax.ppn_account || '1-10400', ppn, 0, 'PPN Masukan');
    if (pph) addLine(pphAccount, 0, pph, pphName);
    addLine(doc.advance_account || '1-10200', 0, advance, 'Penutupan uang muka');
    const selisih = (realized + ppn - pph) - advance;
    if (Math.abs(selisih) > 0.5) {
      if (selisih > 0) {
        addLine(doc.payment_account || '1-10002', 0, selisih, 'Pembayaran kekurangan');
      } else {
        addLine(doc.payment_account || '1-10002', -selisih, 0, 'Pengembalian sisa uang muka');
      }
    }
    return lines;
  }

  if (dtype === 'NRP') {
    const expense = doc.expense_account || '6-10009';
    const amt = doc.total || dpp;
    addLine(expense, amt, 0, ket);
    addLine(doc.payment_account || '1-10003', 0, amt, 'Pembayaran kas');
    return lines;
  }

  // PP / PPBJ / KASKECIL
  const expense = doc.expense_account || '6-10009';
  addLine(expense, dpp, 0, ket);
  if (ppn) addLine(tax.ppn_account || '1-10400', ppn, 0, 'PPN Masukan');
  if (pph) addLine(pphAccount, 0, pph, `Potongan ${pphName}`);
  const payable = dpp + ppn - pph;
  addLine(doc.payment_account || '1-10002', 0, payable, `Pembayaran ke ${doc.supplier || 'supplier'}`);
  return lines;
}

api.post('/documents/:id/generate-journal', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const doc = documents.find((x) => x.id === req.params.id);
  if (!doc) {
    res.status(404).json({ detail: 'Dokumen tidak ditemukan' });
    return;
  }
  if (doc.status !== 'approved') {
    res.status(400).json({ detail: 'Dokumen harus disetujui (approved) sebelum dijurnal' });
    return;
  }

  const curUser = (req as any).user as User;
  const lines = buildJournalLines(doc, taxSettings);
  const totalDebit = Math.round(lines.reduce((acc, l) => acc + l.debit, 0) * 100) / 100;
  const totalKredit = Math.round(lines.reduce((acc, l) => acc + l.kredit, 0) * 100) / 100;

  // Remove existing journal for this source_id if any
  const existingIdx = journals.findIndex((j) => j.source_id === doc.id);
  if (existingIdx !== -1) journals.splice(existingIdx, 1);

  const newJournal: Journal = {
    id: `jnl-${crypto.randomUUID()}`,
    source_id: doc.id,
    no_bukti: doc.no,
    doc_type: doc.doc_type,
    tanggal: doc.tanggal || nowIso().slice(0, 10),
    keterangan: doc.keterangan || doc.kegiatan || '',
    supplier: doc.supplier || '',
    unit_kerja: doc.unit_kerja || '',
    faktur_pajak: doc.faktur_pajak || '',
    lines,
    total_debit: totalDebit,
    total_kredit: totalKredit,
    balanced: Math.abs(totalDebit - totalKredit) < 0.5,
    created_at: nowIso(),
    created_by: curUser.name,
  };

  journals.unshift(newJournal);
  doc.journal_generated = true;
  doc.status = 'posted';
  res.json(newJournal);
});

api.get('/journals', requireAuth, (req: Request, res: Response) => {
  const { start, end, doc_type } = req.query;
  let list = [...journals];
  if (doc_type && typeof doc_type === 'string') {
    list = list.filter((j) => j.doc_type === doc_type);
  }
  if (start && typeof start === 'string') {
    list = list.filter((j) => j.tanggal >= start);
  }
  if (end && typeof end === 'string') {
    list = list.filter((j) => j.tanggal <= end);
  }
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(list);
});

api.get('/journals/:id', requireAuth, (req: Request, res: Response) => {
  const j = journals.find((x) => x.id === req.params.id);
  if (!j) {
    res.status(404).json({ detail: 'Jurnal tidak ditemukan' });
    return;
  }
  res.json(j);
});

// ------------------------------------------------------------------ BUDGETS (ANGGARAN BULANAN)
api.get('/budget-units', requireAuth, (req: Request, res: Response) => {
  const units = new Set<string>();
  documents.forEach((d) => d.unit_kerja && units.add(d.unit_kerja));
  budgets.forEach((b) => b.unit_kerja && units.add(b.unit_kerja));
  res.json(Array.from(units).sort());
});

api.get('/budgets', requireAuth, (req: Request, res: Response) => {
  const period = String(req.query.period || nowIso().slice(0, 7));
  res.json(computeBudgetRecap(period));
});

api.post('/budgets', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const { unit_kerja, period, amount, catatan } = req.body || {};
  if (!unit_kerja || !period) {
    res.status(400).json({ detail: 'Unit kerja dan periode wajib diisi' });
    return;
  }
  const existing = budgets.find((b) => b.unit_kerja === unit_kerja && b.period === period);
  if (existing) {
    existing.amount = Number(amount) || 0;
    existing.catatan = catatan || '';
    res.json(existing);
    return;
  }
  const newBudget: Budget = {
    id: `bgt-${crypto.randomUUID()}`,
    unit_kerja,
    period,
    amount: Number(amount) || 0,
    catatan: catatan || '',
    created_at: nowIso(),
  };
  budgets.push(newBudget);
  res.json(newBudget);
});

api.put('/budgets/:id', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const b = budgets.find((x) => x.id === req.params.id);
  if (!b) {
    res.status(404).json({ detail: 'Anggaran tidak ditemukan' });
    return;
  }
  const { unit_kerja, period, amount, catatan } = req.body || {};
  if (unit_kerja) b.unit_kerja = unit_kerja;
  if (period) b.period = period;
  if (amount !== undefined) b.amount = Number(amount) || 0;
  if (catatan !== undefined) b.catatan = catatan;
  res.json(b);
});

api.delete('/budgets/:id', requireRoles('admin', 'keuangan'), (req: Request, res: Response) => {
  const idx = budgets.findIndex((x) => x.id === req.params.id);
  if (idx !== -1) budgets.splice(idx, 1);
  res.json({ message: 'Anggaran dihapus' });
});

api.get('/budgets/check', requireAuth, (req: Request, res: Response) => {
  const { unit_kerja, period, amount } = req.query;
  const check = computeBudgetCheck(String(unit_kerja || ''), String(period || ''), Number(amount) || 0);
  res.json(check || { pagu: 0, over: false });
});

api.get('/budgets/annual', requireAuth, (req: Request, res: Response) => {
  const year = Number(req.query.year) || currentYear;
  const unitKerja = req.query.unit_kerja ? String(req.query.unit_kerja) : null;

  const paguM = new Array(12).fill(0);
  const realM = new Array(12).fill(0);

  for (const b of budgets) {
    if (unitKerja && b.unit_kerja !== unitKerja) continue;
    if (b.period.startsWith(`${year}-`)) {
      const m = parseInt(b.period.split('-')[1], 10);
      if (m >= 1 && m <= 12) paguM[m - 1] += b.amount || 0;
    }
  }

  for (const d of documents) {
    if (unitKerja && d.unit_kerja !== unitKerja) continue;
    if (!['approved', 'posted'].includes(d.status)) continue;
    const dt = d.tanggal || d.created_at || '';
    if (dt.startsWith(`${year}-`)) {
      const m = parseInt(dt.slice(5, 7), 10);
      if (m >= 1 && m <= 12) realM[m - 1] += d.total || 0;
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    pagu: paguM[i],
    realisasi: realM[i],
  }));

  res.json({
    year,
    unit_kerja: unitKerja || '',
    months,
    total_pagu: paguM.reduce((a, b) => a + b, 0),
    total_realisasi: realM.reduce((a, b) => a + b, 0),
  });
});

api.get('/budgets/export', requireAuth, (req: Request, res: Response) => {
  const period = String(req.query.period || nowIso().slice(0, 7));
  const data = computeBudgetRecap(period);
  let csv = 'Unit Kerja,Pagu Anggaran,Realisasi,Sisa Anggaran,Persentase,Catatan\n';
  data.rows.forEach((r) => {
    csv += `"${r.unit_kerja}",${r.amount || 0},${r.realisasi || 0},${r.sisa || 0},"${r.persen}%","${r.catatan || ''}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Rekap_Anggaran_${period}.csv"`);
  res.send(csv);
});

api.get('/budgets/export-annual', requireAuth, (req: Request, res: Response) => {
  const year = Number(req.query.year) || currentYear;
  let csv = `Bulan,Pagu Anggaran,Realisasi,Sisa\n`;
  for (let m = 1; m <= 12; m++) {
    csv += `Bulan ${m},0,0,0\n`;
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Rekap_Anggaran_Tahunan_${year}.csv"`);
  res.send(csv);
});

api.get('/budgets/export-range', requireAuth, (req: Request, res: Response) => {
  const start = String(req.query.start || nowIso().slice(0, 7));
  const end = String(req.query.end || start);
  const csv = `Periode Awal: ${start}, Periode Akhir: ${end}\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Rekap_Anggaran_${start}_sd_${end}.csv"`);
  res.send(csv);
});

// ------------------------------------------------------------------ DASHBOARD
api.get('/dashboard/summary', requireAuth, (req: Request, res: Response) => {
  const byType: Record<string, number> = {
    PPBJ: 0,
    PUM: 0,
    PP: 0,
    PTUM: 0,
    KASKECIL: 0,
    NRP: 0,
  };
  let pending = 0;
  let approved = 0;
  let posted = 0;
  let totalNilai = 0;

  for (const d of documents) {
    if (byType[d.doc_type] !== undefined) byType[d.doc_type]++;
    if (d.status === 'pending_approval') pending++;
    if (d.status === 'approved') approved++;
    if (d.status === 'posted') posted++;
    totalNilai += d.total || 0;
  }

  const recent = documents.slice(0, 6);

  res.json({
    by_type: byType,
    pending,
    approved,
    posted,
    journals: journals.length,
    recent,
    total_nilai: totalNilai,
  });
});

// ------------------------------------------------------------------ FILE UPLOAD & SERVE
api.post('/upload', requireAuth, upload.single('file') as any, (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ detail: 'Tidak ada file yang diunggah' });
    return;
  }
  const fileId = crypto.randomUUID();
  const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'bin';
  const storagePath = `uploads/${fileId}.${ext}`;

  storedFiles.set(storagePath, {
    id: fileId,
    storage_path: storagePath,
    original_filename: file.originalname,
    content_type: file.mimetype || 'application/octet-stream',
    size: file.size,
    buffer: file.buffer,
    created_at: nowIso(),
  });

  res.json({
    name: file.originalname,
    storage_path: storagePath,
    content_type: file.mimetype,
    url: `/api/files/${storagePath}`,
  });
});

api.get('/files/*', (req: Request, res: Response) => {
  const rawPath = req.params[0] || '';
  const file = storedFiles.get(rawPath);
  if (!file) {
    res.status(404).json({ detail: 'File tidak ditemukan' });
    return;
  }
  res.setHeader('Content-Type', file.content_type);
  res.setHeader('Content-Length', file.size);
  res.send(file.buffer);
});

api.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Sistem Keuangan PT SBB API' });
});

app.use('/api', api);

// ------------------------------------------------------------------ VITE / STATIC SERVING
async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIK-PPBJ] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SIK-PPBJ] Failed to start server:', err);
  process.exit(1);
});
