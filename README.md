# ANGLR Web — React + Supabase (Mobile-first)

Funzioni MVP:
- Login/Signup
- Profili
- Follow/Unfollow
- Feed “Seguiti”
- Esplora + filtri base
- Crea post (upload foto/video) + scheda pesca
- Like + Commenti

## Setup Supabase
1) Crea progetto Supabase
2) SQL Editor → esegui `supabase/schema.sql`
3) Storage → Create bucket `media` → Public ON (MVP)
4) Auth → Email abilitata

## Setup locale
1) Copia `.env.example` → `.env`
2) Inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3) Avvia:
```bash
npm install
npm run dev
```

## Deploy GitHub Pages
- Questo repo include una GitHub Action che builda e deploya su Pages.
- Aggiungi secrets repo:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
