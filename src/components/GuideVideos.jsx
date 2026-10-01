import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import {
  PlayCircle, Video, Settings2, X, Save, Loader2, ExternalLink,
  FileText, Receipt, Wallet, BookOpen, PiggyBank,
} from "lucide-react";

const FLOWS = [
  { key: "ppbj", label: "PPBJ — Permintaan Pengadaan", desc: "Cara mengajukan pengadaan barang & jasa.", icon: FileText },
  { key: "pp", label: "PP — Permohonan Pembayaran", desc: "Mengajukan pembayaran vendor beserta pajak.", icon: Receipt },
  { key: "pumptum", label: "PUM & PTUM — Uang Muka", desc: "Mengajukan uang muka & pertanggungjawaban.", icon: Wallet },
  { key: "jurnal", label: "Jurnal Umum — Ekspor Accurate", desc: "Menjurnal dokumen & ekspor ke Accurate.", icon: BookOpen },
  { key: "anggaran", label: "Anggaran Bulanan — Rekap", desc: "Memantau pagu vs realisasi & unduh rekap.", icon: PiggyBank },
];

// Ubah beragam bentuk URL YouTube menjadi URL embed.
export function toYouTubeEmbed(url) {
  if (!url) return null;
  const u = url.trim();
  let id = null;
  try {
    const m1 = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
    if (m1) id = m1[1];
    else if (/^[A-Za-z0-9_-]{11}$/.test(u)) id = u; // hanya ID (tepat 11 karakter, standar YouTube)
  } catch { id = null; }
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

const CAN_MANAGE = ["admin", "keuangan", "superadmin"];

export default function GuideVideos() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user?.role);
  const [videos, setVideos] = useState({ ppbj: "", pp: "", pumptum: "", jurnal: "", anggaran: "" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/guide-videos");
      setVideos({ ppbj: "", pp: "", pumptum: "", jurnal: "", anggaran: "", ...(r.data || {}) });
    } catch { /* biarkan default */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEditor = () => { setForm({ ...videos }); setEditing(true); };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/guide-videos", form);
      setVideos({ ppbj: "", pp: "", pumptum: "", jurnal: "", anggaran: "", ...(r.data || {}) });
      setEditing(false);
      toast.success("Video panduan disimpan.");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Gagal menyimpan video.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="video" className="bg-white border border-slate-200 rounded-xl shadow-sm p-6" data-testid="video-section">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2.5 font-heading text-lg font-bold text-slate-900">
          <span className="w-8 h-8 rounded-lg bg-[#0d3c45] text-white flex items-center justify-center">
            <Video className="w-4 h-4" />
          </span>
          Video Panduan
        </h2>
        {canManage && (
          <button type="button" onClick={openEditor} data-testid="manage-videos-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-teal-50 hover:text-[#14758a] hover:border-[#14758a] transition-colors">
            <Settings2 className="w-4 h-4" /> Kelola Video
          </button>
        )}
      </div>

      <p className="text-[15px] text-slate-600 leading-relaxed mb-4">
        Tonton video singkat untuk memahami tiap alur utama. {canManage && "Sebagai Admin/Keuangan, Anda dapat menempelkan tautan YouTube melalui tombol \u201CKelola Video\u201D."}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat video…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FLOWS.map((f) => {
            const embed = toYouTubeEmbed(videos[f.key]);
            const Icon = f.icon;
            return (
              <div key={f.key} data-testid={`video-card-${f.key}`}
                className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                <div className="aspect-video bg-slate-900/90 relative">
                  {embed ? (
                    <iframe
                      className="w-full h-full"
                      src={embed}
                      title={f.label}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                      <PlayCircle className="w-10 h-10 opacity-60" />
                      <span className="text-xs font-medium">Belum ada video</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 text-[#14758a] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-sm leading-snug">{f.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Kelola Video */}
      {editing && form && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" data-testid="manage-videos-modal">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && setEditing(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#0d3c45] text-white">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-5 h-5" />
                <h3 className="font-heading font-bold text-base">Kelola Video Panduan</h3>
              </div>
              <button type="button" onClick={() => !saving && setEditing(false)} aria-label="Tutup"
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 thin-scroll">
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Tempel tautan YouTube untuk tiap alur (mis. https://www.youtube.com/watch?v=XXXX atau https://youtu.be/XXXX). Kosongkan untuk menghapus video.
              </p>
              {FLOWS.map((f) => {
                const embed = toYouTubeEmbed(form[f.key]);
                const invalid = form[f.key] && !embed;
                return (
                  <div key={f.key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
                    <input
                      data-testid={`video-input-${f.key}`}
                      value={form[f.key] || ""}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="Tempel tautan YouTube…"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#14758a]/30 focus:border-[#14758a] ${invalid ? "border-red-300" : "border-slate-300"}`}
                    />
                    {invalid && <p className="text-[11px] text-red-500 mt-1">Tautan YouTube tidak dikenali.</p>}
                    {embed && (
                      <a href={form[f.key]} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#14758a] font-semibold mt-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Pratinjau tautan
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-200 p-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} disabled={saving}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>
              <button type="button" onClick={save} disabled={saving} data-testid="save-videos-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14758a] hover:bg-[#0d3c45] text-white text-sm font-bold disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
