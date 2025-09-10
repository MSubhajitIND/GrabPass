// web/src/components/CreateStaffModal.jsx
import React, { useEffect, useState } from "react";
import API from "../api";

export default function CreateStaffModal({ open, onClose, onCreated, initial }) {
  // initial = optional user object for edit { _id, email, name, role }
  const [email, setEmail] = useState(initial?.email || "");
  const [name, setName] = useState(initial?.name || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initial?.role || "staff");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setEmail(initial?.email || "");
    setName(initial?.name || "");
    setRole(initial?.role || "staff");
    setPassword("");
    setErr("");
  }, [initial, open]);

  if (!open) return null;

  async function handleSubmit() {
    setErr("");
    if (!email) return setErr("Email required");
    if (!initial && !password) return setErr("Password required for new account");
    setBusy(true);
    try {
      if (initial) {
        // edit existing user
        const payload = { name, role };
        if (password) payload.password = password;
        const res = await API.patch(`/staff/${initial._id}`, payload);
        if (onCreated) onCreated(res.data.user);
      } else {
        // create
        const res = await API.post("/staff", { email, name, password, role });
        if (onCreated) onCreated(res.data.user);
      }
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      console.error(e);
      setErr(e?.response?.data?.error || e.message || "Failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{initial ? "Edit staff" : "Create staff"}</h3>

        <label className="block text-sm text-gray-600 dark:text-gray-300">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!initial} // don't editable email on edit
          className="w-full p-2 rounded border mt-1 mb-3 bg-white text-gray-900 dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
          placeholder="staff@example.com"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded border mt-1 mb-3 bg-white text-gray-900 dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
          placeholder="Staff name"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300">Password {initial ? "(leave blank to keep)" : ""}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded border mt-1 mb-3 bg-white text-gray-900 dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
          placeholder={initial ? "••••••••" : "Choose a password"}
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 rounded border mt-1 mb-3 bg-white dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>

        {err ? <div className="text-red-500 text-sm mb-2">{err}</div> : null}

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={() => !busy && onClose()} disabled={busy}>Cancel</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSubmit} disabled={busy}>{busy ? "Saving..." : initial ? "Save" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}