import React from 'react';
import { supabase } from '../lib/supabase';
import { LogOut } from 'lucide-react'; // Zakładam, że mamy lucide-react

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
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
      >
        <LogOut className="w-4 h-4" />
        Wyloguj
      </button>
    </div>
  );
}
