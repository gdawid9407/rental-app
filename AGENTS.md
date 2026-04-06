# PROJECT CONTEXT: Rental App

## 1. Purpose

System do kompleksowego zarządzania najmem krótkoterminowym i średnioterminowym. Cel: automatyzacja obsługi rezerwacji, kontrola płatności oraz budowa bazy wiedzy o nieruchomościach.

## 2. Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Runtime:** React 19
- **Styling:** Tailwind CSS + Lucide React (icons)
- **Database/Auth:** Supabase (PostgreSQL)
- **Calendar:** FullCalendar (@fullcalendar/react)
- **Deployment:** Vercel

## 3. Data Model (Supabase)

### Table: `calendar_events`

- `id` (uuid, PK)
- `title` (text) - zazwyczaj nazwa najemcy
- `start` / `end` (timestamp)
- `property_name` (text) - kluczowa kolumna do filtrowania
- `note` (text)
- `status` (text) - Enum: 'paid', 'partial', 'unpaid'
- `user_id` (uuid, FK)

### Table: `property_notes`

- `id` (uuid, PK)
- `property_name` (text)
- `category` (text) - np. "Instrukcje", "Kody"
- `content` (text)

## 4. Key Components & Logic

- `Calendar.tsx`: Główny kontroler widoku. Obsługuje interakcje FullCalendar (select, eventClick).
- `useCalendarEvents.ts`: Custom hook do operacji CRUD na rezerwacjach z optymistycznym UI (opcjonalnie).
- `EventModal.tsx`: Formularz zarządzania stanem rezerwacji (w tym zmiana statusu płatności).
- `PropertyKnowledgeBase.tsx`: Interfejs typu "Wiki" do zarządzania notatkami technicznymi.

## 5. Development Patterns

- **Client Components:** Większość UI kalendarza i formularzy to 'use client' ze względu na interaktywność FullCalendar.
- **Direct Supabase Access:** Obecnie używamy `createClient` wewnątrz hooków po stronie klienta.
- **Styling Strategy:** Tailwind CSS z wykorzystaniem zmiennych CSS zdefiniowanych w `globals.css`.

## 6. Current Roadmap

- Implementacja statystyk i wykresów w `/stats`.
- Rozbudowa modułu `/deals` do śledzenia rentowności.
- Refaktoryzacja do Server Actions dla operacji zapisu (zgodnie z Next.js 15).
