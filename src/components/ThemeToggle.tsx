import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'button' | 'pill' | 'icon-only';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        id="theme-toggle-pill"
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-800/90 text-amber-300 hover:bg-slate-700 border border-slate-700/80 shadow-xs'
            : 'bg-slate-200/90 text-slate-800 hover:bg-slate-300 border border-slate-300 shadow-xs'
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'icon-only') {
    return (
      <button
        id="theme-toggle-icon"
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700/80 shadow-xs'
            : 'bg-slate-200/90 hover:bg-slate-300 text-indigo-700 hover:text-indigo-900 border border-slate-300 shadow-xs'
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
      </button>
    );
  }

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/80 shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-indigo-700 border border-slate-300 shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};
