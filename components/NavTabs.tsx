"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Kalendarz' },
  { href: '/analyzer', label: 'Analizator Inwestycyjny' },
  { href: '/deals', label: 'Wyszukiwarka Okazji' },
  { href: '/stats', label: 'Statystyki' },
  { href: '/database', label: 'Centrum danych Nieruchomości' },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <div className="px-8 pt-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 overflow-x-auto whitespace-nowrap hide-scrollbar transition-colors duration-200">
      <div className="flex gap-6">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${
                isActive
                  ? 'text-blue-600 dark:text-amber-400 border-b-2 border-blue-600 dark:border-amber-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
