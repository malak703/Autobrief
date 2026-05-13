"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

const defaultTheme: ThemeColors = {
  primary: "#5b3f2a",
  secondary: "#c99a4a",
  accent: "#f1e2cc",
  background: "#fffaf2",
  surface: "#fbf3e8",
  text: "#2a2118",
  textSecondary: "#7b6f63",
  border: "#e8dccd",
};

interface ThemeContextType {
  colors: ThemeColors;
  updateColor: (key: keyof ThemeColors, value: string) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("autobrief-theme");
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setColors({ ...defaultTheme, ...parsedTheme });
      } catch (error) {
        console.error("Failed to parse saved theme:", error);
      }
    }
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [colors]);

  const updateColor = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    localStorage.setItem("autobrief-theme", JSON.stringify(newColors));
  };

  const resetToDefault = () => {
    setColors(defaultTheme);
    localStorage.removeItem("autobrief-theme");
  };

  return (
    <ThemeContext.Provider value={{ colors, updateColor, resetToDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}