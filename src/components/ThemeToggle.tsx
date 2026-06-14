"use client";
// components/ThemeToggle.tsx
// Sun/moon toggle button for light/dark mode

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
        isDark
          ? "bg-brand-muted border border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-green/30"
          : "bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-brand-green/40",
        className
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
