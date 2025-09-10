cat > src/App.jsx <<'JS'
import React, { useEffect, useState } from "react";
import API from "./api";
import Header from "./components/Header";
import Hero from "./components/Hero";
import EventsGrid from "./components/EventsGrid";
import RegistrationsModal from "./components/RegistrationsModal";
import QR from "./components/QR";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [events, setEvents] = useState([]);
  const [registerFor, setRegisterFor] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("gp_theme") || "light");

  // admin modal state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  // admin flag in app state (for conditional view)
  const [isAdmin, setIsAdmin] = useState(() => {
    const r = localStorage.getItem("gp_role") || sessionStorage.getItem("gp_role");
    return r === "admin";
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // apply theme to html
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("gp_theme", theme);
  }, [theme]);

  async function fetchEvents() {
    try {
      const res = await API.get("/events");
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  // called when Login component reports success
  function handleLoginSuccess({ email, role }) {
    setShowAdminLogin(false);
    setIsAdmin(role === "admin");
    // reload events to show admin-only changes if any
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

  // If admin signed in, show admin dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          theme={theme}
          setTheme={setTheme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onAdmin={() => setShowAdminLogin(true)}
        />
        <div className="container mx-auto px-4 py-8">
          <AdminDashboard onLogout={handleLogout} />
        </div>
      </div>
    );
  }

  // public site
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        theme={theme}
        setTheme={setTheme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onAdmin={() => setShowAdminLogin(true)}
      />
      <Hero onExplore={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })} />
      <EventsGrid events={events} onRegister={(e) => setRegisterFor(e)} />

      {registerFor && (
        <RegistrationsModal
          ev={registerFor}
          onClose={() => setRegisterFor(null)}
          onTicket={(t) => {
            setTicket(t);
            setRegisterFor(null);
          }}
        />
      )}

      {ticket && (
        <div className="fixed right-6 bottom-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border dark:border-gray-700">
            <h4 className="font-semibold mb-2">Your Ticket</h4>
            <QR value={ticket} size={200} />
            <button onClick={() => setTicket(null)} className="mt-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">Close</button>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <Login
          onLogin={(info) => handleLoginSuccess(info)}
          onCancel={() => setShowAdminLogin(false)}
        />
      )}

      <footer className="mt-auto py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © GrabPass — All rights reserved.
      </footer>
    </div>
  );
}
JS