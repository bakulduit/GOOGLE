import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle, X, ListChecks, Lightbulb, Target, ShieldCheck,
  AlertTriangle, ArrowRight, BookOpen,
} from "lucide-react";
import { HELP } from "@/constants/help";

// Tombol + panel Bantuan kontekstual untuk tiap halaman modul.
export default function ModuleHelp({ id, className = "" }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const data = HELP[id];

  const onKey = useCallback((e) => { if (e.key === "Escape") setOpen(false); }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onKey]);

  if (!data) return null;

  const go = (to) => { setOpen(false); nav(to); };

  return (
    <>
      <button type="button" data-testid={`help-${id}`} onClick={() => setOpen(true)}
        title="Bantuan penggunaan halaman ini"
        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-teal-50 hover:text-[#14758a] hover:border-[#14758a] transition-colors ${className}`}>
        <HelpCircle className="w-4 h-4" /> Bantuan
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
          data-testid={`help-panel-${id}`} onClick={() => setOpen(false)}>
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-4 bg-[#0d3c45] text-white">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-teal-200/90 font-bold">Bantuan Halaman</div>
                <h3 className="font-heading font-bold text-base leading-snug mt-0.5">{data.title}</h3>
              </div>
              <button type="button" data-testid={`help-close-${id}`} onClick={() => setOpen(false)} aria-label="Tutup bantuan"
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 thin-scroll prose-readable">
              {/* Peran */}
              {data.roles?.length > 0 && (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#14758a] mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {data.roles.map((r) => (
                      <span key={r} className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-50 text-[#0d3c45] text-[11px] font-semibold border border-teal-100">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tujuan */}
              <div>
                <div className="flex items-center gap-2 text-[#0d3c45] font-bold text-sm mb-1.5">
                  <Target className="w-4 h-4 text-[#14758a]" /> Tujuan
                </div>
                <p className="text-[15px] text-slate-700 leading-relaxed">{data.purpose}</p>
              </div>

              {/* Langkah */}
              <div>
                <div className="flex items-center gap-2 text-[#0d3c45] font-bold text-sm mb-2.5">
                  <ListChecks className="w-4 h-4 text-[#14758a]" /> Langkah-langkah
                </div>
                <ol className="space-y-2.5">
                  {data.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-[15px] text-slate-700">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#14758a] text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Perhatian */}
              {data.caution && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-4 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-700 font-bold text-sm mb-0.5">Perhatian</div>
                    <p className="text-[13px] text-red-700/90 leading-relaxed">{data.caution}</p>
                  </div>
                </div>
              )}

              {/* Tips */}
              {data.tips?.length > 0 && (
                <div className="rounded-lg bg-orange-50 border border-orange-100 p-4">
                  <div className="flex items-center gap-2 text-[#0d3c45] font-bold text-sm mb-2">
                    <Lightbulb className="w-4 h-4 text-[#f2941f]" /> Tips
                  </div>
                  <ul className="space-y-2">
                    {data.tips.map((t, i) => (
                      <li key={i} className="text-[13px] text-slate-700 leading-relaxed flex gap-2">
                        <span className="text-[#f2941f] font-bold mt-0.5">•</span> <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tautan terkait */}
              {data.related?.length > 0 && (
                <div>
                  <div className="text-[#0d3c45] font-bold text-sm mb-2">Terkait</div>
                  <div className="flex flex-col gap-1.5">
                    {data.related.map((r) => (
                      <button key={r.to} type="button" onClick={() => go(r.to)}
                        className="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:border-[#14758a] hover:text-[#14758a] hover:bg-teal-50/50 transition-colors text-left">
                        {r.label} <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4">
              <button type="button" onClick={() => go("/panduan")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0d3c45] hover:bg-[#14758a] text-white text-sm font-bold transition-colors">
                <BookOpen className="w-4 h-4" /> Buka Panduan Lengkap
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
