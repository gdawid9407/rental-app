import React from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Home } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  isLoading: boolean;
}

export function Header({ isLoading }: HeaderProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rental App</h1>
        <p className="text-sm text-gray-500">
          {isLoading ? "Synchronizacja z bazą..." : "Zarządzanie finansami i notatkami"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link 
          href="/account"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
        >
          <Home className="w-4 h-4 text-blue-600" />
          Moje Konto
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Wyloguj
        </button>
      </div>
    </div>
  );
}
