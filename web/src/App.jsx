// web/src/App.jsx
import React, { useEffect, useState } from "react";
import API from "./api";
import Header from "./components/Header";
import Hero from "./components/Hero";
import EventsGrid from "./components/EventsGrid";
import RegisterModal from "./components/RegisterModal";
import QR from "./components/QR";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import ErrorBoundary from "./ErrorBoundary";
import TicketView from "./components/TicketView"; // ticket page

export default function App() {
  // --- URL handling: ticket OR event param ---
  const urlParams = new URLSearchParams(window.location.search);
  const ticketToken = urlParams.get("token");
  const eventParam = urlParams.get("event");

  // ticket view short-circuit
  if (window.location.pathname === "/ticket") {
    return <TicketView token={ticketToken} />;
  }

  // --- Public/Admin shared state ---
  const [events, setEvents] = useState([]);
  const [registerFor, setRegisterFor] = useState(null); // event object to register for
  const [ticket, setTicket] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("gp_theme") || "light");

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    const r = localStorage.getItem("gp_role") || sessionStorage.getItem("gp_role");
    return r === "admin";
  });

  // load events once
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // after events load (or when events change) — handle ?event=... param
  useEffect(() => {
    if (!eventParam) return;
    if (!events || events.length === 0) return; // wait until events loaded

    // try to find in loaded list
    const found = events.find((e) => e._id === eventParam);
    if (found) {
      // scroll into view if element exists (EventCard must have id={`event-${e._id}`})
      const el = document.getElementById(`event-${found._id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      // open register modal for this event object
      setRegisterFor(found);
      return;
    }

    // not in the list — fetch single event by id and open modal
    (async () => {
      try {
        const res = await API.get(`/events/${eventParam}`);
        if (res?.data) {
          setRegisterFor(res.data);
          // try scrolling in case EventCard appears or if you render single fetched card
          setTimeout(() => {
            const el = document.getElementById(`event-${res.data._id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 200);
        }
      } catch (err) {
        console.error("Could not fetch event by id", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, eventParam]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("gp_theme", theme);
  }, [theme]);

  async function fetchEvents() {
    try {
      const res = await API.get("/events");
      setEvents(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  function handleLoginSuccess({ email, role }) {
    setShowAdminLogin(false);
    setIsAdmin(role === "admin");
    fetchEvents();
  }

  function handleLogout() {
    localStorage.removeItem("gp_token");
    localStorage.removeItem("gp_role");
    sessionStorage.removeItem("gp_token");
    sessionStorage.removeItem("gp_role");
    setIsAdmin(false);
    fetchEvents();
  }

  // --- Admin view ---
  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onAdmin={() => setShowAdminLogin(true)}
        />
        <div className="container mx-auto px-4 py-8">
          <ErrorBoundary>
            <AdminDashboard onLogout={handleLogout} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // --- Public view ---
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onAdmin={() => setShowAdminLogin(true)}
      />
      <ErrorBoundary>
        <Hero onExplore={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })} />
        <EventsGrid events={events} onRegister={(e) => setRegisterFor(e)} />
      </ErrorBoundary>

      {registerFor && (
        <RegisterModal
          ev={registerFor}
          onClose={() => setRegisterFor(null)}
          onTicket={(t) => {
            setTicket(t);
            setRegisterFor(null);
          }}
        />
      )}

      {ticket && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTicket(null)} />
          <div className="relative z-10 w-full max-w-4xl">
            <TicketView token={ticket} />
            <div className="mt-4 text-right">
              <button onClick={() => setTicket(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAdminLogin && <Login onLogin={(info) => handleLoginSuccess(info)} onCancel={() => setShowAdminLogin(false)} />}

      <footer className="mt-auto py-6 text-center text-sm text-gray-500 dark:text-gray-400">© GrabPass — All rights reserved.</footer>
    </div>
  );
}