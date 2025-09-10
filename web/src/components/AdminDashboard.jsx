// web/src/components/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import RegistrationsModal from "./RegistrationsModal";
import EditEventModal from "./EditEventModal";
import CreateStaffModal from "./CreateStaffModal";

export default function AdminDashboard({ onLogout }) {
  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // create form
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
  const [showEdit, setShowEdit] = useState(false);

  // sidebar view state: 'create' | 'events' | 'past' | 'staff'
  const [view, setView] = useState("create");

  // copy state per event { [eventId]: 'copied' | undefined }
  const [copyState, setCopyState] = useState({});

  // staff modal state & editing
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffEditing, setStaffEditing] = useState(null);

  const token = () => localStorage.getItem("gp_token") || sessionStorage.getItem("gp_token");

  const eventsRef = useRef(null);
  const createRef = useRef(null);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "staff") fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function fetchEvents() {
    try {
      setLoadingEvents(true);
      const res = await API.get("/events");
      setEvents((res.data || []).sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0)));
    } catch (err) {
      console.error(err);
      alert("Could not load events");
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchStaff() {
    try {
      setLoadingStaff(true);
      const res = await API.get("/staff", { headers: { Authorization: "Bearer " + token() } });
      setStaffList(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Could not load staff");
    } finally {
      setLoadingStaff(false);
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
      await API.post("/events", body, { headers: { Authorization: "Bearer " + token() } });
      setTitle(""); setDescription(""); setBannerUrl(""); setMaxSeats(100); setPrice(0); setStartAt("");
      await fetchEvents();
      setView("events");
      setTimeout(() => eventsRef.current?.scrollIntoView({ behavior: "smooth" }), 120);
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

  function openEdit(ev) {
    setSelectedEvent(ev);
    setShowEdit(true);
  }

  async function handleDelete(ev) {
    if (!confirm(`Delete event "${ev.title}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/events/${ev._id}`, { headers: { Authorization: "Bearer " + token() } });
      await fetchEvents();
      alert("Deleted");
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err?.response?.data?.error || err?.message));
    }
  }

  // event link copy helper
  async function copyEventLink(ev) {
    const eventLink = `${window.location.origin}/?event=${ev._id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(eventLink);
      } else {
        const ta = document.createElement("textarea");
        ta.value = eventLink;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopyState((p) => ({ ...p, [ev._id]: "copied" }));
      setTimeout(() => setCopyState((p) => ({ ...p, [ev._id]: undefined })), 1600);
    } catch (err) {
      console.error("Copy failed", err);
      prompt("Copy this link manually (Cmd/Ctrl+C):", eventLink);
    }
  }

  // staff actions
  function openCreateStaff() {
    setStaffEditing(null);
    setStaffModalOpen(true);
  }
  function openEditStaff(user) {
    setStaffEditing(user);
    setStaffModalOpen(true);
  }
  async function deleteStaff(user) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await API.delete(`/staff/${user._id}`, { headers: { Authorization: "Bearer " + token() } });
      await fetchStaff();
      alert("Deleted");
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err?.response?.data?.error || err?.message));
    }
  }

  // filtered lists
  const now = Date.now();
  const upcoming = events.filter((e) => !e.startAt || new Date(e.startAt).getTime() >= now);
  const past = events.filter((e) => e.startAt && new Date(e.startAt).getTime() < now);

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
          <button className={`text-left px-3 py-2 rounded-md ${view === "create" ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`} onClick={() => { setView("create"); createRef.current?.scrollIntoView({ behavior: "smooth" }); }}>Create event</button>

          <button className={`text-left px-3 py-2 rounded-md ${view === "events" ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`} onClick={() => { setView("events"); setTimeout(() => eventsRef.current?.scrollIntoView({ behavior: "smooth" }), 80); }}>Upcoming events ({upcoming.length})</button>

          <button className={`text-left px-3 py-2 rounded-md ${view === "past" ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`} onClick={() => { setView("past"); setTimeout(() => eventsRef.current?.scrollIntoView({ behavior: "smooth" }), 80); }}>Past events ({past.length})</button>

          <button className={`text-left px-3 py-2 rounded-md ${view === "staff" ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`} onClick={() => setView("staff")}>Manage staff</button>

          <button className="text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700" onClick={onLogout}>Sign out</button>
        </nav>

        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">Tip: Use banner URLs (jpg/png) for nicer cards.</div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          </div>
        </div>

        {/* Create event */}
        {view === "create" && (
          <section ref={createRef} className="mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Create new event</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Title</label>
                  <input className="input mt-1 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-2 rounded border dark:border-gray-700" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Banner image URL</label>
                  <input className="input mt-1 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-2 rounded border dark:border-gray-700" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." />
                  {bannerUrl && (
                    <div className="mt-2 rounded overflow-hidden border">
                      <img src={bannerUrl} alt="preview" className="w-full h-32 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ""; }} />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Description</label>
                  <textarea className="input mt-1 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-2 rounded border dark:border-gray-700" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Max seats</label>
                  <input type="number" className="input mt-1 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-2 rounded border dark:border-gray-700" value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Price (₹)</label>
                  <input type="number" step="0.01" className="input mt-1 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-2 rounded border dark:border-gray-700" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Start at</label>
                  <input type="datetime-local" className="input mt-1 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-2 rounded border dark:border-gray-700" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button onClick={createEvent} className="px-4 py-2 bg-brand-500 text-white rounded-md" disabled={creating}>{creating ? "Creating..." : "Create Event"}</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Events list */}
        {(view === "events" || view === "past") && (
          <section ref={eventsRef}>
            <h3 className="text-lg font-medium mb-4">{view === "past" ? "Past events" : "Upcoming events"}</h3>

            {loadingEvents ? (
              <div className="col-span-full text-center text-gray-500">Loading...</div>
            ) : (view === "past" ? (past.length === 0 ? <div className="text-gray-500">No past events.</div> : null) : (upcoming.length === 0 ? <div className="text-gray-500">No upcoming events.</div> : null))}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {(view === "past" ? past : upcoming).map((ev) => (
                <div key={ev._id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                  {ev.bannerUrl ? <img src={ev.bannerUrl} alt={ev.title} className="h-40 w-full object-cover" /> : <div className="h-40 w-full bg-gradient-to-tr from-indigo-300 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">No image</div>}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{ev.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{ev.description || "—"}</div>
                      </div>
                      <div className="text-sm font-medium">₹{(ev.priceCents || 0) / 100}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                      <div>Seats: {ev.registeredCount || 0}/{ev.maxSeats}</div>
                      <div>{ev.startAt ? new Date(ev.startAt).toLocaleString() : ""}</div>
                    </div>

                    <div className="mt-4 flex gap-2 flex-wrap">
                      <button onClick={() => openRegistrations(ev)} className="flex-1 min-w-[110px] px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center justify-center gap-1">📋 View</button>

                      <button onClick={() => openEdit(ev)} className="flex-1 min-w-[90px] px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm flex items-center justify-center gap-1">✏️ Edit</button>

                      <button onClick={() => handleDelete(ev)} className="flex-1 min-w-[90px] px-3 py-2 border border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-sm flex items-center justify-center gap-1">🗑️ Delete</button>

                      <div className="relative flex-1 min-w-[110px]">
                        <button onClick={() => copyEventLink(ev)} className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm flex items-center justify-center gap-1">🔗 Copy link</button>
                        {copyState[ev._id] === "copied" && (
                          <div className="absolute -right-2 -top-6 text-xs text-green-600">Copied!</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Manage staff */}
        {view === "staff" && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Manage staff</h2>
              <div>
                <button onClick={openCreateStaff} className="px-3 py-2 bg-indigo-600 text-white rounded-md">+ Create staff</button>
              </div>
            </div>

            {loadingStaff ? (
              <div className="text-gray-500">Loading staff...</div>
            ) : staffList.length === 0 ? (
              <div className="text-gray-500">No staff accounts yet.</div>
            ) : (
              <div className="space-y-3">
                {staffList.map((u) => (
                  <div key={u._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{u.name || u.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{u.email} • {u.role}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditStaff(u)} className="px-3 py-1 bg-amber-500 text-white rounded">Edit</button>
                      <button onClick={() => deleteStaff(u)} className="px-3 py-1 border border-red-400 text-red-600 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {showRegs && selectedEvent && <RegistrationsModal eventId={selectedEvent._id} title={selectedEvent.title} onClose={() => setShowRegs(false)} />}

      {showEdit && selectedEvent && (
        <EditEventModal
          ev={selectedEvent}
          onClose={() => { setShowEdit(false); setSelectedEvent(null); }}
          onSaved={async () => { setShowEdit(false); await fetchEvents(); }}
        />
      )}

      {staffModalOpen && (
        <CreateStaffModal
          open={staffModalOpen}
          onClose={() => { setStaffModalOpen(false); setStaffEditing(null); }}
          initial={staffEditing}
          onCreated={async () => {
            setStaffModalOpen(false);
            setStaffEditing(null);
            await fetchStaff();
          }}
        />
      )}
    </div>
  );
}