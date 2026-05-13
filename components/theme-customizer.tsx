"use client";

import { useState } from "react";
import { useTheme } from "./theme-provider";

const colorLabels = {
  primary: "Primary (buttons, active states)",
  secondary: "Secondary (accents, highlights)",
  accent: "Accent (icons, subtle highlights)",
  background: "Background (main page background)",
  surface: "Surface (cards, panels)",
  text: "Text (primary text color)",
  textSecondary: "Text Secondary (muted text)",
  border: "Border (dividers, outlines)",
};

export function ThemeCustomizer() {
  const { colors, updateColor, resetToDefault } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="card p-6">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
            <path d="M3 17V19H9V17H3Z" fill="currentColor"/>
            <path d="M3 20V22H15V20H3Z" fill="currentColor"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[#2a2118]">
          Appearance
        </h2>

        <p className="mt-2 text-[#7b6f63]">
          Current theme is warm beige minimal. This keeps the app calm,
          professional, and easy to scan.
        </p>

        <div className="mt-6 grid grid-cols-4 gap-3">
          <div className="h-12 rounded-2xl" style={{ backgroundColor: colors.primary }} />
          <div className="h-12 rounded-2xl" style={{ backgroundColor: colors.surface }} />
          <div className="h-12 rounded-2xl" style={{ backgroundColor: colors.secondary }} />
          <div className="h-12 rounded-2xl" style={{ backgroundColor: colors.accent }} />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="btn-secondary mt-6 w-full"
        >
          Customize theme
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
              <path d="M3 17V19H9V17H3Z" fill="currentColor"/>
              <path d="M3 20V22H15V20H3Z" fill="currentColor"/>
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2a2118]">
              Customize Theme
            </h2>
            <p className="text-[#7b6f63]">
              Choose colors for your workspace theme.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="text-[#7b6f63] hover:text-[#2a2118] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {(Object.keys(colorLabels) as Array<keyof typeof colorLabels>).map((key) => (
          <div key={key} className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#5f5246] mb-1">
                {colorLabels[key]}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="w-12 h-10 rounded-lg border border-[#e8dccd] cursor-pointer"
                />
                <input
                  type="text"
                  value={colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="flex-1 rounded-xl border border-[#e8dccd] bg-[#fffaf2] px-3 py-2 text-sm font-mono text-[#2a2118] outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-xl border-2 border-[#e8dccd]"
              style={{ backgroundColor: colors[key] }}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={resetToDefault}
          className="btn-secondary flex-1"
        >
          Reset to Default
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="btn-primary flex-1"
        >
          Done
        </button>
      </div>
    </div>
  );
}