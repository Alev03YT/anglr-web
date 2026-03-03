-- ANGLR Web (MVP) schema
-- Esegui tutto in Supabase → SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  visibility text default 'public',
  created_at timestamp with time zone default now()
);

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  media_type text not null default 'image',
  sort_order int default 0
);

create table if not exists public.post_fishing (
  post_id uuid primary key references public.posts(id) on delete cascade,
  environment text not null check (environment in ('fresh','salt')),
  water_type text,
  species_text text,
  technique_text text,
  bait_kind text check (bait_kind in ('artificial','natural')),
  bait_name text,
  bait_color text,
  spot_area text,
  spot_privacy text default 'private' check (spot_privacy in ('public_area','followers_only','private'))
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.post_saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_fishing enable row level security;
alter table public.follows enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_saves enable row level security;

-- Policies
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "posts_read_public_or_own" on public.posts;
create policy "posts_read_public_or_own" on public.posts for select to authenticated
  using (visibility = 'public' or user_id = auth.uid());

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated using (user_id = auth.uid());

drop policy if exists "post_media_read" on public.post_media;
create policy "post_media_read" on public.post_media for select to authenticated
  using (exists(select 1 from public.posts p where p.id = post_id and (p.visibility='public' or p.user_id=auth.uid())));

drop policy if exists "post_media_insert_own" on public.post_media;
create policy "post_media_insert_own" on public.post_media for insert to authenticated
  with check (exists(select 1 from public.posts p where p.id = post_id and p.user_id=auth.uid()));

drop policy if exists "post_media_delete_own" on public.post_media;
create policy "post_media_delete_own" on public.post_media for delete to authenticated
  using (exists(select 1 from public.posts p where p.id = post_id and p.user_id=auth.uid()));

drop policy if exists "post_fishing_read" on public.post_fishing;
create policy "post_fishing_read" on public.post_fishing for select to authenticated
  using (exists(select 1 from public.posts p where p.id = post_id and (p.visibility='public' or p.user_id=auth.uid())));

drop policy if exists "post_fishing_insert_own" on public.post_fishing;
create policy "post_fishing_insert_own" on public.post_fishing for insert to authenticated
  with check (exists(select 1 from public.posts p where p.id = post_id and p.user_id=auth.uid()));

drop policy if exists "follows_read" on public.follows;
create policy "follows_read" on public.follows for select to authenticated using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows for insert to authenticated with check (follower_id = auth.uid());

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows for delete to authenticated using (follower_id = auth.uid());

drop policy if exists "likes_read" on public.post_likes;
create policy "likes_read" on public.post_likes for select to authenticated
  using (exists(select 1 from public.posts p where p.id = post_id and (p.visibility='public' or p.user_id=auth.uid())));

drop policy if exists "likes_insert_own" on public.post_likes;
create policy "likes_insert_own" on public.post_likes for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "likes_delete_own" on public.post_likes;
create policy "likes_delete_own" on public.post_likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "comments_read" on public.post_comments;
create policy "comments_read" on public.post_comments for select to authenticated
  using (exists(select 1 from public.posts p where p.id = post_id and (p.visibility='public' or p.user_id=auth.uid())));

drop policy if exists "comments_insert_own" on public.post_comments;
create policy "comments_insert_own" on public.post_comments for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "saves_read" on public.post_saves;
create policy "saves_read" on public.post_saves for select to authenticated
  using (exists(select 1 from public.posts p where p.id = post_id and (p.visibility='public' or p.user_id=auth.uid())));

drop policy if exists "saves_insert_own" on public.post_saves;
create policy "saves_insert_own" on public.post_saves for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "saves_delete_own" on public.post_saves;
create policy "saves_delete_own" on public.post_saves for delete to authenticated using (user_id = auth.uid());

-- STORAGE (da fare in UI Supabase):
-- Storage → Create bucket: "media" → Public ON (MVP)
