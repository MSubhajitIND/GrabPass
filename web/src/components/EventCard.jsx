// web/src/components/EventCard.jsx
import React from "react";

/**
 * EventCard
 * props:
 *  - ev: event object
 *  - onRegister(ev): callback when Register button clicked
 */
export default function EventCard({ ev, onRegister }) {
  // safe defaults
  const title = ev?.title || "Untitled event";
  const desc = ev?.description || "";
  const price = (ev?.priceCents || 0) / 100;
  const banner = ev?.bannerUrl || "";

  return (
    // IMPORTANT: id used for deep linking: ?event=<id>
    <div id={`event-${ev._id}`} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
      {banner ? (
        <img src={banner} alt={title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-tr from-indigo-300 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
          No image
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{desc || "—"}</div>
          </div>
          <div className="text-sm font-medium">₹{price}</div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <div>Seats: {ev.registeredCount || 0}/{ev.maxSeats}</div>
          <div>{ev.startAt ? new Date(ev.startAt).toLocaleString() : ""}</div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onRegister && onRegister(ev)}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}