import React from 'react';

interface HeaderProps {
  isLoading: boolean;
}

export function Header({ isLoading }: HeaderProps) {
  return (
    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rental App</h1>
        <p className="text-sm text-gray-500">
          {isLoading ? "Synchronizacja z bazą..." : "Zarządzanie finansami i notatkami"}
        </p>
      </div>
    </div>
  );
}
