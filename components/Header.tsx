"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Home, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface HeaderProps {
  isLoading: boolean;
}

export function Header({ isLoading }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">Rental App</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {isLoading ? "Synchronizacja z bazą..." : "Zarządzanie finansami i notatkami"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <Link 
          href="/account"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"
        >
          <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Moje Konto
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors border border-red-100 dark:border-red-500/30"
        >
          <LogOut className="w-4 h-4" />
          Wyloguj
        </button>
      </div>
    </div>
  );
}
