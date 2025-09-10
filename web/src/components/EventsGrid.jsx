// web/src/components/EventsGrid.jsx
import React, { useMemo, useState } from "react";

/**
 * EventsGrid
 * props:
 *  - events: array of event objects
 *  - onRegister(ev): callback when Register button clicked
 */
export default function EventsGrid({ events = [], onRegister }) {
  // filter: "all" | "upcoming" | "past"
  const [filter, setFilter] = useState("upcoming");

  const now = Date.now();

  // compute filtered events
  const filtered = useMemo(() => {
    if (!events || events.length === 0) return [];
    if (filter === "all") return events;
    if (filter === "upcoming") {
      return events.filter((e) => {
        if (!e.startAt) return true; // no start date => consider upcoming
        return new Date(e.startAt).getTime() >= now;
      });
    }
    // past
    return events.filter((e) => e.startAt && new Date(e.startAt).getTime() < now);
  }, [events, filter, now]);

  function fmtDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    try {
      // e.g. "15 Sep 2025, 10:00 AM"
      return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d.toString();
    }
  }

  return (
    <section id="events" className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold">Events</h2>

        <div className="flex items-center gap-2">
          {/* small segmented control */}
          <div className="inline-flex rounded-md bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === "upcoming" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === "past" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === "all" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            {filter === "upcoming" ? "No upcoming events." : filter === "past" ? "No past events." : "No events yet."}
          </div>
        ) : (
          filtered.map((ev) => {
            const price = (ev.priceCents || 0) / 100;
            return (
              <article
                key={ev._id}
                id={`event-${ev._id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 overflow-hidden flex flex-col"
              >
                {ev.bannerUrl ? (
                  <img src={ev.bannerUrl} alt={ev.title} className="h-56 w-full object-cover" />
                ) : (
                  <div className="h-56 w-full bg-gradient-to-tr from-indigo-300 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                    No Image
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{ev.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{ev.description || "No description provided."}</p>
                    </div>

                    <div className="text-sm font-medium">₹{price}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Seats: {ev.registeredCount || 0}/{ev.maxSeats}</span>
                    <span className="whitespace-nowrap">{fmtDate(ev.startAt)}</span>
                  </div>

                  <button
                    onClick={() => onRegister && onRegister(ev)}
                    className="mt-5 w-full px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-md"
                  >
                    Register
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}