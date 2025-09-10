cat > src/components/AdminDashboard.jsx <<'JS'
import React, { useEffect, useState } from "react";
import API from "../api";
import RegistrationsModal from "./RegistrationsModal";

/**
 * AdminDashboard - sidebar layout, create event, list events, open registrations modal
 * Export default MUST exist for proper import.
 */
export default function AdminDashboard({ onLogout }) {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [maxSeats, setMaxSeats] = useState(100);
  const [price, setPrice] = useState(0);
  const [startAt, setStartAt] = useState("");
  const [creating, setCreating] = useState(false);

  // UI
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegs, setShowRegs] = useState(false);

  const token = () => localStorage.getItem("gp_token") || sessionStorage.getItem("gp_token");

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEvents() {
    try {
      setLoadingEvents(true);
      const res = await API.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      alert("Could not load events");
    } finally {
      setLoadingEvents(false);
    }
  }

  async function createEvent() {
    if (!title) return alert("Please enter a title");
    setCreating(true);
    try {
      const body = {
        title,
        description,
        bannerUrl,
        maxSeats: Number(maxSeats),
        priceCents: Math.round(Number(price) * 100),
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      };
      await API.post("/events", body, {
        headers: { Authorization: "Bearer " + token() },
      });
      // reset form
      setTitle("");
      setDescription("");
      setBannerUrl("");
      setMaxSeats(100);
      setPrice(0);
      setStartAt("");
      // reload events
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Create failed: " + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  }

  function openRegistrations(ev) {
    setSelectedEvent(ev);
    setShowRegs(true);
  }

  return (
    <div className="min-h-screen flex gap-6">
      {/* Sidebar */}
      <aside className="w-72 hidden md:block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-brand-500 to-indigo-600 text-white flex items-center justify-center font-bold">G</div>
          <div>
            <div className="font-semibold">GrabPass</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button className="text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700" onClick={fetchEvents}>Events</button>
          <button className="text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Create event</button>
          <button className="text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700" onClick={onLogout}>Sign out</button>
        </nav>

        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">Tip: Use banner URLs (jpg/png) for nicer cards.</div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">Create & manage events — view registrations</div>
          </div>
        </div>

        {/* Create event */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Create new event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Title</label>
                <input className="input mt-1" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Event title" />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Banner image URL</label>
                <input className="input mt-1" value={bannerUrl} onChange={(e)=>setBannerUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Description</label>
                <textarea className="input mt-1" rows="3" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Short description" />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Max seats</label>
                <input type="number" className="input mt-1" value={maxSeats} onChange={(e)=>setMaxSeats(e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Price (₹)</label>
                <input type="number" step="0.01" className="input mt-1" value={price} onChange={(e)=>setPrice(e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Start at</label>
                <input type="datetime-local" className="input mt-1" value={startAt} onChange={(e)=>setStartAt(e.target.value)} />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button onClick={createEvent} className="px-4 py-2 bg-brand-500 text-white rounded-md" disabled={creating}>
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Events list */}
        <section>
          <h3 className="text-lg font-medium mb-4">Events</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingEvents ? (
              <div className="col-span-full text-center text-gray-500">Loading...</div>
            ) : events.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No events yet.</div>
            ) : events.map(ev => (
              <div key={ev._id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                {ev.bannerUrl ? (
                  <img src={ev.bannerUrl} alt={ev.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-gradient-to-tr from-indigo-300 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">No image</div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{ev.description || "—"}</div>
                    </div>
                    <div className="text-sm font-medium">₹{(ev.priceCents||0)/100}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div>Seats: {ev.registeredCount||0}/{ev.maxSeats}</div>
                    <div>{ev.startAt ? new Date(ev.startAt).toLocaleString() : ""}</div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={()=>openRegistrations(ev)} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">View registrations</button>
                    <button className="px-3 py-2 border rounded-md text-sm" onClick={()=>navigator.clipboard.writeText(window.location.origin + "/?event=" + ev._id)}>Copy link</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal: registrations */}
      {showRegs && selectedEvent && (
        <RegistrationsModal
          eventId={selectedEvent._id}
          title={selectedEvent.title}
          onClose={() => setShowRegs(false)}
        />
      )}
    </div>
  );
}
JS