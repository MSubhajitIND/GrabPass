// web/src/api.js
import axios from "axios";

// Use Vite environment variable injected at build time
// If not set, fall back to localhost for local dev
const base =
  import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const API = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
});

// helper to set/remove Authorization header
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
}

// convenience: read token from localStorage and set on startup
if (typeof window !== "undefined") {
  const t =
    localStorage.getItem("gp_token") ||
    sessionStorage.getItem("gp_token");
  if (t) setAuthToken(t);
}

export default API;
