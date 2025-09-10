// web/src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api", // change to your server host if needed
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

// convenience: read token from localStorage and set on startup (optional)
if (typeof window !== "undefined") {
  const t = localStorage.getItem("gp_token") || sessionStorage.getItem("gp_token");
  if (t) setAuthToken(t);
}

export default API;