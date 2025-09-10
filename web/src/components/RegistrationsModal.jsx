// web/src/components/RegistrationsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../api";

/**
 * Admin-focused registrations modal
 * Props:
 *   - eventId
 *   - title
 *   - onClose
 */
export default function RegistrationsModal({ eventId, title, onClose }) {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filterPaid, setFilterPaid] = useState("all"); // all/paid/unpaid
  const [filterChecked, setFilterChecked] = useState("all"); // all/checked/not
  const [busyId, setBusyId] = useState(null);

  const token = localStorage.getItem("gp_token") || sessionStorage.getItem("gp_token");

  useEffect(() => {
    if (!eventId) return;
    fetchRegs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function fetchRegs() {
    try {
      setLoading(true);
      const res = await API.get(`/registrations?eventId=${eventId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      setRegs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchRegs error", err);
      alert("Could not load registrations: " + (err?.response?.data?.error || err?.message));
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = regs.slice();
    if (q) {
      const term = q.toLowerCase();
      list = list.filter(r =>
        (r.userName || "").toLowerCase().includes(term) ||
        (r.email || "").toLowerCase().includes(term) ||
        (r.studentCode || "").toLowerCase().includes(term) ||
        (r.dept || "").toLowerCase().includes(term)
      );
    }
    if (filterPaid === "paid") list = list.filter(r => r.paid);
    if (filterPaid === "unpaid") list = list.filter(r => !r.paid);
    if (filterChecked === "checked") list = list.filter(r => r.checkedIn);
    if (filterChecked === "not") list = list.filter(r => !r.checkedIn);
    return list;
  }, [regs, q, filterPaid, filterChecked]);

  function exportCSV() {
    if (!regs || regs.length === 0) return alert("No registrations to export");
    const headers = ["Name","Email","StudentCode","Dept","Paid","CheckedIn","CreatedAt","TicketToken"];
    const rows = regs.map(r => [
      escapeCSV(r.userName),
      escapeCSV(r.email),
      escapeCSV(r.studentCode),
      escapeCSV(r.dept),
      r.paid ? "yes" : "no",
      r.checkedIn ? "yes" : "no",
      r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
      r.qrToken || ""
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title?.replace(/\s+/g,'_') || 'registrations'}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeCSV(value = "") {
    const s = String(value || "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  async function toggleCheckin(reg) {
    setBusyId(reg._id);
    try {
      const res = await API.patch(`/registrations/${reg._id}/checkin`, { checkedIn: !reg.checkedIn }, {
        headers: { Authorization: "Bearer " + token }
      });
      // update local
      setRegs(prev => prev.map(p => p._id === reg._id ? { ...p, checkedIn: res.data.checkedIn, checkedInAt: res.data.checkedInAt } : p));
    } catch (err) {
      console.error("toggleCheckin", err);
      alert("Could not update check-in: " + (err?.response?.data?.error || err?.message));
    } finally { setBusyId(null); }
  }

  async function resendEmail(reg) {
    setBusyId(reg._id);
    try {
      await API.post(`/registrations/${reg._id}/resend-email`, {}, { headers: { Authorization: "Bearer " + token }});
      alert("Confirmation email (demo) queued/sent.");
    } catch (err) {
      console.error("resendEmail", err);
      alert("Could not resend email: " + (err?.response?.data?.error || err?.message));
    } finally { setBusyId(null); }
  }

  function copyTicketLink(reg) {
    if (!reg.qrToken) return alert("No ticket token available for this registration.");
    const url = `${window.location.origin}/ticket?token=${encodeURIComponent(reg.qrToken)}`;
    navigator.clipboard.writeText(url).then(() => alert("Ticket link copied to clipboard"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="font-semibold">Registrations — {title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{regs.length} total</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">Export CSV</button>
            <button className="px-3 py-1 rounded-md border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name, email, student code, dept" className="input" />
            <div className="flex items-center gap-2">
              <select className="input" value={filterPaid} onChange={(e)=>setFilterPaid(e.target.value)}>
                <option value="all">All (paid/unpaid)</option>
                <option value="paid">Paid only</option>
                <option value="unpaid">Unpaid only</option>
              </select>
              <select className="input" value={filterChecked} onChange={(e)=>setFilterChecked(e.target.value)}>
                <option value="all">All (checked/not)</option>
                <option value="checked">Checked in</option>
                <option value="not">Not checked in</option>
              </select>
              <button onClick={fetchRegs} className="px-3 py-2 bg-brand-500 text-white rounded-md">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500">No registrations found.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {filtered.map(r => (
                <div key={r._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium truncate">{r.userName || "—"}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.email} · {r.studentCode || '—'} · {r.dept || '—'}</div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Status: {r.paid ? <span className="text-green-400">Paid</span> : <span className="text-amber-400">Not paid</span>}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Checked: {r.checkedIn ? <span className="text-green-400">Yes</span> : <span className="text-gray-400">No</span>}</div>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(r.email); alert("Email copied"); }}
                      className="px-2 py-1 border rounded-md text-sm"
                      title="Copy email"
                    >✉️</button>

                    <button
                      onClick={() => copyTicketLink(r)}
                      className="px-2 py-1 border rounded-md text-sm"
                      title="Copy ticket link"
                    >🔗</button>

                    <button
                      onClick={() => resendEmail(r)}
                      disabled={busyId === r._id}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm"
                      title="Resend confirmation email"
                    >
                      {busyId === r._id ? "..." : "Resend"}
                    </button>

                    <button
                      onClick={() => toggleCheckin(r)}
                      disabled={busyId === r._id}
                      className={`px-3 py-1 rounded-md text-sm ${r.checkedIn ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 border'}`}
                    >
                      {busyId === r._id ? "..." : (r.checkedIn ? "Checked" : "Check in")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}