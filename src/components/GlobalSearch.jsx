import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X, Clock, SlidersHorizontal } from "lucide-react";
import api, { rupiah } from "@/lib/api";

const TYPE_STYLE = {
  PPBJ: "bg-teal-50 text-teal-700 border-teal-200",
  PUM: "bg-amber-50 text-amber-700 border-amber-200",
  PP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PTUM: "bg-purple-50 text-purple-700 border-purple-200",
  KASKECIL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NRP: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABEL = {
  draft: "Draft",
  pending_approval: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  posted: "Dijurnal",
};

const DOC_TYPES = ["PPBJ", "PUM", "PP", "PTUM", "KASKECIL", "NRP"];
const STATUSES = ["draft", "pending_approval", "approved", "rejected", "posted"];
const RECENTS_KEY = "doc-search-recents";
const MAX_RECENTS = 6;

function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, MAX_RECENTS) : [];
  } catch { return []; }
}

function saveRecents(list) {
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS))); } catch { /* ignore */ }
}

// Sorot bagian teks yang cocok dengan kata kunci.
function highlightText(text, term) {
  const str = text == null ? "" : String(text);
  if (!term || term.length < 2 || !str) return str;
  try {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = str.split(new RegExp(`(${esc})`, "ig"));
    return parts.map((p, i) =>
      p.toLowerCase() === term.toLowerCase()
        ? <mark key={i} className="bg-amber-200/80 text-slate-900 rounded px-0.5">{p}</mark>
        : <span key={i}>{p}</span>
    );
  } catch { return str; }
}

export default function GlobalSearch() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [docType, setDocType] = useState("");
  const [status, setStatus] = useState("");
  const [recents, setRecents] = useState(loadRecents);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const timer = useRef(null);

  const term = q.trim();

  // Debounced search (ikut memperhatikan filter)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const params = { q: term };
        if (docType) params.doc_type = docType;
        if (status) params.status = status;
        const r = await api.get(`/documents/search`, { params });
        setResults(Array.isArray(r.data) ? r.data : []);
        setOpen(true);
        setActive(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [term, docType, status]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const commitRecent = useCallback((value) => {
    const v = (value || "").trim();
    if (v.length < 2) return;
    setRecents((prev) => {
      const next = [v, ...prev.filter((s) => s.toLowerCase() !== v.toLowerCase())].slice(0, MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, []);

  const goTo = useCallback((doc) => {
    commitRecent(term);
    setOpen(false);
    setQ("");
    setResults([]);
    nav(`/documents/${doc.id}`);
  }, [nav, term, commitRecent]);

  const clearRecents = () => { setRecents([]); saveRecents([]); };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "Enter") {
      if (open && active >= 0 && results[active]) { e.preventDefault(); goTo(results[active]); }
      else if (term.length >= 2) { commitRecent(term); }
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
  };

  const hasFilter = docType || status;
  const showResults = open && term.length >= 2;
  const showRecents = open && term.length < 2 && recents.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-md" data-testid="global-search">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          data-testid="global-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari dokumen: nomor, kegiatan, supplier…"
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#14758a]/30 focus:border-[#14758a] focus:bg-white transition-colors"
        />
        {loading && <Loader2 className="w-4 h-4 text-[#14758a] absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
        {!loading && q && (
          <button type="button" onClick={() => { setQ(""); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600" aria-label="Bersihkan">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown: Riwayat pencarian */}
      {showRecents && (
        <div data-testid="search-recents"
          className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pencarian Terakhir
            </span>
            <button type="button" onClick={clearRecents} data-testid="clear-recents"
              className="text-[11px] font-semibold text-slate-400 hover:text-red-500">Hapus</button>
          </div>
          <div className="py-1">
            {recents.map((r, i) => (
              <button key={i} type="button" onClick={() => { setQ(r); inputRef.current?.focus(); }}
                data-testid={`search-recent-${i}`}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="truncate">{r}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown: Hasil pencarian + filter */}
      {showResults && (
        <div data-testid="global-search-results"
          className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-fade-in">
          {/* Filter */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50/60">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select data-testid="filter-doctype" value={docType} onChange={(e) => setDocType(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#14758a]/40 cursor-pointer">
              <option value="">Semua Jenis</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select data-testid="filter-status" value={status} onChange={(e) => setStatus(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#14758a]/40 cursor-pointer">
              <option value="">Semua Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            {hasFilter && (
              <button type="button" onClick={() => { setDocType(""); setStatus(""); }} data-testid="clear-filters"
                className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-[#14758a]">Reset</button>
            )}
          </div>

          {loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">Mencari…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Tidak ada dokumen cocok dengan “{term}”{hasFilter ? " pada filter ini" : ""}.
            </div>
          )}
          {results.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto thin-scroll py-1">
              <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {results.length} dokumen ditemukan
              </div>
              {results.map((d, i) => (
                <button key={d.id} type="button" onClick={() => goTo(d)}
                  onMouseEnter={() => setActive(i)}
                  data-testid={`search-result-${i}`}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${active === i ? "bg-teal-50" : "hover:bg-slate-50"}`}>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded border text-[11px] font-bold shrink-0 mt-0.5 ${TYPE_STYLE[d.doc_type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {d.doc_type}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 truncate">{highlightText(d.no, term)}</span>
                      {d.status && (
                        <span className="text-[10px] font-semibold text-slate-400">• {STATUS_LABEL[d.status] || d.status}</span>
                      )}
                    </span>
                    <span className="block text-sm font-semibold text-slate-800 truncate">
                      {highlightText(d.kegiatan || d.keterangan || d.supplier || "(Tanpa keterangan)", term)}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">
                      {highlightText([d.unit_kerja, d.supplier].filter(Boolean).join(" · "), term)}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-slate-700 tabular shrink-0 mt-0.5">{rupiah(d.total)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
