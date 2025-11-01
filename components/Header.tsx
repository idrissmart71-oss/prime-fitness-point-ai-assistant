
import React from 'react';
import { SunIcon, MoonIcon, LeafIcon } from './icons';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LeafIcon className="h-8 w-8 text-primary-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">
            Healthify
          </h1>
          <span className="hidden sm:inline-block text-slate-500 dark:text-slate-400 mt-1">Indian Diet Tracker</span>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
