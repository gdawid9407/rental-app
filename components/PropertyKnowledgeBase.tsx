import React, { useState } from 'react';
import { Pin, Trash2, Search, FileText, Plus, X, Tag, Info, AlertCircle } from 'lucide-react';
import { Property, PropertyNote, NOTE_CATEGORIES, NoteCategory } from '../types/calendar';
import { usePropertyNotes } from '../hooks/usePropertyNotes';

interface PropertyKnowledgeBaseProps {
  property: Property;
}

export function PropertyKnowledgeBase({ property }: PropertyKnowledgeBaseProps) {
  const { notes, isLoading, addNote, deleteNote, togglePin, deleteAllNotes } = usePropertyNotes(property.id);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotes();
      setIsConfirmingDeleteAll(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      await addNote(newNoteContent.trim(), selectedCategory);
      setNewNoteContent('');
      setIsAddingNote(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const regularNotes = filteredNotes.filter(n => !n.is_pinned);

  const renderNote = (note: PropertyNote) => {
    const category = NOTE_CATEGORIES.find(c => c.id === note.category);
    return (
      <div 
        key={note.id} 
        className={`group p-4 rounded-xl border transition-all duration-200 ${
          note.is_pinned 
            ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' 
            : 'bg-white dark:bg-slate-800/40 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {category?.icon} {category?.label}
              </span>
              <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(note.created_at).toLocaleDateString('pl-PL')}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => togglePin(note.id, note.is_pinned)}
              className={`p-1.5 rounded-lg transition-colors ${
                note.is_pinned 
                  ? 'text-amber-500 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60' 
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
              title={note.is_pinned ? "Odepnij" : "Przypnij"}
            >
              <Pin size={14} className={note.is_pinned ? 'fill-current' : ''} />
            </button>
            <button 
              onClick={() => deleteNote(note.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Usuń"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Knowledge Base */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Info size={16} className="text-blue-500" /> Baza Wiedzy o Nieruchomości
        </h3>
        <div className="flex items-center gap-2">
          {notes.length > 0 && !isAddingNote && (
            isConfirmingDeleteAll ? (
              <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                <button 
                  onClick={() => setIsConfirmingDeleteAll(false)}
                  className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  onClick={handleDeleteAll}
                  className="px-3 py-1.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all border border-red-200 dark:border-red-800"
                >
                  Usuń wszystkie
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingDeleteAll(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-910/20 rounded-lg transition-colors flex items-center gap-1.5 group"
                title="Wyczyść wszystkie notatki"
              >
                <Trash2 size={16} />
                <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Wyczyść wszystko</span>
              </button>
            )
          )}
          <button 
            onClick={() => {
              setIsAddingNote(!isAddingNote);
              setIsConfirmingDeleteAll(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              isAddingNote 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' 
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400 shadow-sm'
            }`}
          >
            {isAddingNote ? <X size={14} /> : <Plus size={14} />}
            {isAddingNote ? 'Anuluj' : 'Dodaj notatkę'}
          </button>
        </div>
      </div>

      {/* Formularz dodawania */}
      {isAddingNote && (
        <form onSubmit={handleAddNote} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-2">
            {NOTE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as NoteCategory)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Wpisz treść notatki... (np. kod do domofonu, kontakt do konserwatora)"
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-900 dark:text-white min-h-[100px] resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newNoteContent.trim()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-400 disabled:opacity-50 transition shadow-sm"
            >
              Zapisz notatkę
            </button>
          </div>
        </form>
      )}

      {/* Wyszukiwarka */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Szukaj w notatkach..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 transition text-slate-900 dark:text-white"
        />
      </div>

      {/* Lista notatek */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Ładowanie bazy wiedzy...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <FileText size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searchQuery ? 'Brak notatek pasujących do wyszukiwania.' : 'Brak notatek dla tej nieruchomości.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5 ml-1">
                <Pin size={10} className="fill-current" /> Przypięte
              </p>
              {pinnedNotes.map(renderNote)}
            </div>
          )}
          
          {regularNotes.length > 0 && (
            <div className="space-y-2">
              {pinnedNotes.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 mx-1 my-2" />}
              {regularNotes.map(renderNote)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
