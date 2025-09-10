// src/theme/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState(colorScheme || "light");

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setTheme(colorScheme || "light")
    );
    return () => sub.remove();
  }, []);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const colors =
    theme === "dark"
      ? {
          background: "#0f1724",
          card: "#111827",
          text: "#e6eef8",
          muted: "#9aa4b2",
          accent: "#5b6ffb",
          danger: "#ef4444",
          success: "#22c55e",
        }
      : {
          background: "#f6f8fb",
          card: "#ffffff",
          text: "#0b1220",
          muted: "#6b7280",
          accent: "#2b6cff",
          danger: "#dc2626",
          success: "#16a34a",
        };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}