// src/components/Hero.jsx
import React from "react";

export default function Hero({ onExplore }) {
  return (
    <section id="home" className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Digital ticketing for events — <span className="text-brand-500">GrabPass</span></h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Create and manage events, accept registrations, and scan QR tickets at the gate. Simple, secure, fast.</p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={onExplore} className="px-6 py-3 rounded-md bg-brand-500 hover:bg-brand-700 text-white">Explore Events</button>
          <a href="#contact" className="px-6 py-3 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">Contact</a>
        </div>
      </div>
    </section>
  );
}