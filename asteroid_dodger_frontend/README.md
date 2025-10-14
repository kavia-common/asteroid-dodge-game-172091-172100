# Asteroid Dodger Frontend (Ocean Professional)

This app integrates Supabase email/password authentication and a serverless leaderboard.

Important: Sound removed
- Per requirements, all audio functionality has been removed. There is no SoundManager, no mute toggle, and no audio initialization/unlock logic. Gameplay and visuals are unaffected.

## Features

- Email/password auth (Supabase)
- Protected gameplay route (requires login)
- Score submission on game over: stores the user's best score
- Leaderboard page with top 10 scores
- Ocean Professional theme styling for auth and leaderboard UI
- Local best score persistence via localStorage (works without Supabase)
- No audio/sound features

## Environment Variables

This project uses Create React App (CRA). Environment variables must be prefixed with `REACT_APP_`.

Add the following to your `.env` in the frontend root (do not commit secrets), or copy `.env.example` to `.env` and edit:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_KEY=your_supabase_anon_key
```

The build uses these to initialize the Supabase client in `src/lib/supabaseClient.js` (no hardcoded keys).
If these are not provided, the app will still run with a no-op Supabase client and show auth-dependent features as unavailable.

## Supabase Setup

1) Create a new Supabase project (if not already).
2) In Authentication -> Settings, ensure Email/Password provider is enabled.
3) In SQL Editor, create the `scores` table and RLS policies:

SQL:
```sql
-- Table to track a user's best score
create table if not exists public.scores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  best_score integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.scores enable row level security;

-- Only the owner (auth.uid()) can upsert/read their own row; everyone can read for the leaderboard
create policy "Allow owner upsert own score"
on public.scores
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Allow owner update own score"
on public.scores
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Allow authenticated users to select any row (read-only) so leaderboard works
create policy "Allow read leaderboard"
on public.scores
for select
to authenticated
using (true);
```

Notes:
- The app only upserts the current user's best score.
- The leaderboard selects top scores. You can restrict select further if needed (e.g., to only expose `email` prefix in the client).

## Client-side Table Creation

The app attempts a lightweight probe on startup/score submit to detect if the `scores` table exists. If it doesn't, it logs a warning and shows a helpful message where applicable. DDL cannot run with anon keys by default; use the SQL above in Supabase.

## Usage

- Navigate to /auth to sign in or create an account.
- Once signed in, you can play from the Home/Play route.
- On game over, your best score is saved.
- View top scores on the Leaderboard.

## Responsive Game Sizing

The game now uses a logical coordinate system (800x600) and computes a render scale so it fits within typical laptop viewports without vertical clipping.

Details:
- Logical size: 800x600 (physics/game logic).
- Render scale: scale = min(renderWidth/800, renderHeight/600).
- Height is capped to min(85vh, 720px) by default; the main area also uses a max-height to avoid body scroll.
- HUD and overlays adapt to the game width and remain fully visible.

Quick size tweaks:
- You can pass a URL parameter `?size=small|medium|large` to adjust the render size proportionally:
  - small: slightly more compact (good for tighter screens)
  - medium: default
  - large: taller within the viewport cap

Examples:
- http://localhost:3000/?size=small
- http://localhost:3000/?size=large

## Scripts

- `npm start` - Dev server
- `npm test` - Tests
- `npm run build` - Production build

## Styling

Theme colors are defined in `src/index.css`. Inputs and tables include small Ocean Professional enhancements.

## Notes

- When deploying, ensure the environment variables are set for your platform.
- The app uses `@supabase/supabase-js`, `react-router-dom`, and React 18.
