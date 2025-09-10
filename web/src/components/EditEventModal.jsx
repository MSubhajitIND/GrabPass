// web/src/components/EditEventModal.jsx
import React, { useState } from "react";
import API from "../api";

export default function EditEventModal({ ev, onClose, onSaved }) {
  const [title, setTitle] = useState(ev.title || "");
  const [description, setDescription] = useState(ev.description || "");
  const [bannerUrl, setBannerUrl] = useState(ev.bannerUrl || "");
  const [maxSeats, setMaxSeats] = useState(ev.maxSeats || 100);
  const [price, setPrice] = useState((ev.priceCents || 0) / 100);
  const [startAt, setStartAt] = useState(ev.startAt ? new Date(ev.startAt).toISOString().slice(0,16) : "");
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("gp_token") || sessionStorage.getItem("gp_token");

  async function save() {
    if (!title) return alert("Title required");
    setSaving(true);
    try {
      const body = {
        title,
        description,
        bannerUrl,
        maxSeats: Number(maxSeats),
        priceCents: Math.round(Number(price) * 100),
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      };
      await API.patch(`/events/${ev._id}`, body, { headers: { Authorization: "Bearer " + token }});
      alert("Saved");
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + (err?.response?.data?.error || err?.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Event</h3>
            <button className="px-3 py-1 rounded-md border" onClick={onClose}>Close</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300">Title</label>
              <input className="input mt-1" value={title} onChange={e=>setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300">Banner URL</label>
              <input className="input mt-1" value={bannerUrl} onChange={e=>setBannerUrl(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-300">Description</label>
              <textarea className="input mt-1" rows="3" value={description} onChange={e=>setDescription(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300">Max seats</label>
              <input type="number" className="input mt-1" value={maxSeats} onChange={e=>setMaxSeats(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300">Price (₹)</label>
              <input type="number" step="0.01" className="input mt-1" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300">Start at</label>
              <input type="datetime-local" className="input mt-1" value={startAt} onChange={e=>setStartAt(e.target.value)} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <button onClick={save} className="px-4 py-2 bg-brand-500 text-white rounded-md" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}