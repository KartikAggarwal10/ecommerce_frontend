import { store } from "./store";
import { logout } from "./userdt";

const BASE = import.meta.env.VITE_API_BASE ?? ""; // "" = use Vite proxy path in dev

let refreshing = null; // every caller waits on the same refresh

function refreshSession() {
  refreshing ??= fetch(`${BASE}/user/refresh`, { method: "POST", credentials: "include" })
    .then((r) => r.ok).catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function apiFetch(path, options = {}) {
  // path arrives as "/api/product/..." — strip /api prefix since BASE already has the host
  const url = `${BASE}${path.replace(/^\/api/, "")}`;
  const opts = { ...options, credentials: "include" };
  const res = await fetch(url, opts);
  if (res.status !== 401 || path.includes("/user/login") || path.includes("/user/refresh")) return res;

  if (await refreshSession()) return fetch(url, opts); // retry once
  store.dispatch(logout());
  window.location.assign("/login");
  return res;
}
