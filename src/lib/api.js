import axios from "axios";

const API = "/api";

const api = axios.create({ baseURL: API, withCredentials: true });

// Attach token from localStorage if present (for reliable iframe & cross-origin auth)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("sbb_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      try {
        localStorage.removeItem("sbb_access_token");
      } catch {}
    }
    return Promise.reject(err);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const rupiah = (n) =>
  "Rp " + (Number(n) || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

export const rupiahNum = (n) =>
  (Number(n) || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default api;
