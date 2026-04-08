"use client";
import React from 'react';
import { Header } from '../../components/Header';
import { NavTabs } from '../../components/NavTabs';

export default function AnalyzerPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 md:p-12 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-6xl bg-white dark:bg-slate-900 md:rounded-2xl md:shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-200">
        <Header isLoading={false} />
        <NavTabs />
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-slate-200 mb-3">Analizator Inwestycyjny</h2>
          <p className="text-gray-400 dark:text-slate-500 max-w-md">
            Głęboka analiza opłacalności inwestycji w nieruchomości — ROI, stopa zwrotu, porównanie scenariuszy. Funkcjonalność w budowie.
          </p>
        </div>
      </div>
    </main>
  );
}
