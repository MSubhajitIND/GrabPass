/*
  src/components/RegistrationsModal.jsx
  Admin-only modal that fetches registrations for an event.
  Exports default component (required).
*/
import React, { useEffect, useState } from "react";
import API from "../api";

export default function RegistrationsModal({ eventId, title, onClose }) {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);
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
        headers: { Authorization: "Bearer " + token }
      });
      setRegs(res.data || []);
    } catch (err) {
      console.error("Registrations fetch error:", err);
      alert("Could not load registrations: " + (err?.response?.data?.error || err?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
            <div>
              <div className="font-semibold">Registrations — {title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{regs.length} total</div>
            </div>
            <div>
              <button className="px-3 py-1 rounded-md border" onClick={onClose}>Close</button>
            </div>
          </div>

          <div className="p-4 max-h-[60vh] overflow-auto">
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : regs.length === 0 ? (
              <div className="text-center text-gray-500">No registrations yet.</div>
            ) : (
              <div className="space-y-3">
                {regs.map(r => (
                  <div key={r._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.userName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.email} • {r.studentCode} • {r.dept}</div>
                      <div className="text-xs mt-1">{r.paid ? 'Paid' : 'Not paid'} • {r.checkedIn ? `Checked in` : 'Not checked in'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                      <div className="mt-2 flex gap-2">
                        <button className="px-2 py-1 text-sm border rounded" onClick={() => navigator.clipboard.writeText(r.email)}>Copy email</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
