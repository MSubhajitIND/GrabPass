// mobile/src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.31.53:4000/api", // Android emulator default. Use http://localhost:4000/api for iOS simulator.
  // If testing on a real phone, replace with your machine's LAN IP like:
  // baseURL: "http://192.168.1.12:4000/api"
  headers: { "Content-Type": "application/json" },
});

// helper to set auth token for all requests
export function setToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export default api;