// src/components/Header.jsx
import React from "react";

export default function Header({ theme, onToggleTheme, onAdmin }) {
  return (
    <header className="w-full py-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold">G</div>
          <div>
            <div className="font-semibold">GrabPass</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Events & Booking</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="hidden md:flex gap-4 text-sm">
            <a href="#home" className="text-gray-700 dark:text-gray-200 hover:underline">Home</a>
            <a href="#events" className="text-gray-700 dark:text-gray-200 hover:underline">Events</a>
          </nav>

          <button onClick={onToggleTheme} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          <button onClick={onAdmin} className="px-3 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-md">Admin</button>
        </div>
      </div>
    </header>
  );
}