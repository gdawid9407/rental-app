"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Lock, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

export default function AccountPage() {
  // ── Current user ────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Edit-profile state ───────────────────────────────────────────────────
  const [editNick, setEditNick]               = useState('');
  const [editEmail, setEditEmail]             = useState('');
  const [editPass, setEditPass]               = useState('');
  const [editPassConfirm, setEditPassConfirm] = useState('');
  const [profileMsg, setProfileMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setProfileMsg({ type, text });
    setTimeout(() => setProfileMsg(null), 4000);
  };

  const handleUpdateNick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNick.trim()) return;
    const { error } = await supabase.auth.updateUser({ data: { username: editNick.trim() } });
    if (error) showMsg('err', error.message);
    else {
      showMsg('ok', 'Nick został zaktualizowany!');
      setCurrentUser(prev => prev ? { ...prev, user_metadata: { ...(prev.user_metadata ?? {}), username: editNick.trim() } } : prev);
      setEditNick('');
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({ email: editEmail.trim() });
    if (error) showMsg('err', error.message);
    else { showMsg('ok', 'Wysłano link weryfikacyjny na nowy adres e-mail.'); setEditEmail(''); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPass.length < 6) { showMsg('err', 'Hasło musi mieć co najmniej 6 znaków.'); return; }
    if (editPass !== editPassConfirm) { showMsg('err', 'Hasła nie są identyczne.'); return; }
    const { error } = await supabase.auth.updateUser({ password: editPass });
    if (error) showMsg('err', error.message);
    else { showMsg('ok', 'Hasło zostało zmienione!'); setEditPass(''); setEditPassConfirm(''); }
  };

  // ── Edit-profile panel toggle ─────────────────────────────────────────────
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(true);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Ładowanie stanu konta...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 md:p-12 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-4xl bg-white dark:bg-slate-900 md:rounded-2xl md:shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden relative pb-10 transition-colors duration-200">

        {/* ── Header ── */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 transition-colors duration-200">
          <Link href="/" className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white">Ustawienia Konta</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Zarządzaj swoim profilem i bezpieczeństwem</p>
          </div>
        </div>

        {/* ── Welcome banner ── */}
        {currentUser && (
          <div className="mx-8 mt-6 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl px-6 py-4">
            <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-lg">
                {(currentUser.user_metadata?.username ?? currentUser.email ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Cześć, {currentUser.user_metadata?.username ?? 'użytkowniku'}! 👋
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Zalogowany jako: <span className="font-medium text-gray-700 dark:text-slate-300">{currentUser.email}</span>
              </p>
            </div>
          </div>
        )}

        <div className="p-8 space-y-10">
          {/* ── Edycja konta ── */}
          <section className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-colors duration-200">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors duration-150"
            >
              <span className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <User size={20} className="text-blue-600 dark:text-blue-400" /> Profil Użytkownika
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isEditProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isEditProfileOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-gray-200 dark:border-slate-700"
                >
                  <div className="px-6 pb-6 space-y-6 pt-5">
                    {profileMsg && (
                      <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border ${
                        profileMsg.type === 'ok'
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                      }`}>
                        <CheckCircle2 size={16} />
                        {profileMsg.text}
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Nick */}
                      <form onSubmit={handleUpdateNick} className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                          <User size={14} className="text-blue-500" /> Nick
                        </label>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          Aktualny: <span className="font-medium text-gray-700 dark:text-slate-300">{currentUser?.user_metadata?.username ?? '\u2014'}</span>
                        </p>
                        <input
                          type="text"
                          value={editNick}
                          onChange={e => setEditNick(e.target.value)}
                          placeholder="Nowy nick..."
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                        />
                        <button type="submit" disabled={!editNick.trim()} className="w-full py-2 text-sm font-semibold bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition">
                          Zapisz nick
                        </button>
                      </form>

                      {/* E-mail */}
                      <form onSubmit={handleUpdateEmail} className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                          <Mail size={14} className="text-blue-500" /> Adres e-mail
                        </label>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          Aktualny: <span className="font-medium text-gray-700 dark:text-slate-300">{currentUser?.email ?? '\u2014'}</span>
                        </p>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          placeholder="Nowy e-mail..."
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                        />
                        <button type="submit" disabled={!editEmail.trim()} className="w-full py-2 text-sm font-semibold bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition">
                          Zapisz e-mail
                        </button>
                      </form>

                      {/* Password */}
                      <form onSubmit={handleUpdatePassword} className="space-y-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                          <Lock size={14} className="text-blue-500" /> Hasło
                        </label>
                        <p className="text-xs text-gray-400 dark:text-slate-500">Ustaw nowe hasło (min. 6 znaków)</p>
                        <input
                          type="password"
                          value={editPass}
                          onChange={e => setEditPass(e.target.value)}
                          placeholder="Nowue hasło..."
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                        />
                        <input
                          type="password"
                          value={editPassConfirm}
                          onChange={e => setEditPassConfirm(e.target.value)}
                          placeholder="Powtórz hasło..."
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                        />
                        <button type="submit" disabled={!editPass || !editPassConfirm} className="w-full py-2 text-sm font-semibold bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition">
                          Zmień hasło
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
