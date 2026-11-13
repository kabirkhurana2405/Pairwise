-- Pairwise MVP schema. Run this entire file in Supabase → SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  display_name text not null,
  age integer not null check (age between 18 and 99),
  city text not null,
  role text not null default '',
  bio text not null default '',
  interests text[] not null default '{}',
  core_values text[] not null default '{}',
  looking_for text not null default '',
  communication_style text not null default '',
  photo_url text,
  is_demo boolean not null default false,
  demo_liker boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles(id) on delete cascade,
  to_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_not_self check (from_profile_id <> to_profile_id),
  constraint likes_unique_pair unique (from_profile_id, to_profile_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_one_id uuid not null references public.profiles(id) on delete cascade,
  profile_two_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_not_self check (profile_one_id <> profile_two_id),
  constraint matches_unique_pair unique (profile_one_id, profile_two_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Automatically create a match when two people like each other.
create or replace function public.create_pairwise_match_on_mutual_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reverse_exists boolean;
  first_id uuid;
  second_id uuid;
begin
  select exists (
    select 1 from public.likes
    where from_profile_id = new.to_profile_id
      and to_profile_id = new.from_profile_id
  ) into reverse_exists;

  if reverse_exists then
    if new.from_profile_id < new.to_profile_id then
      first_id := new.from_profile_id; second_id := new.to_profile_id;
    else
      first_id := new.to_profile_id; second_id := new.from_profile_id;
    end if;
    insert into public.matches(profile_one_id, profile_two_id)
    values (first_id, second_id)
    on conflict (profile_one_id, profile_two_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists pairwise_mutual_like_trigger on public.likes;
create trigger pairwise_mutual_like_trigger
after insert on public.likes
for each row execute function public.create_pairwise_match_on_mutual_like();

-- Seed a few fictional demo profiles. Mira and Zoya send a starter like
-- to every newly-created member profile, making the incoming-likes flow testable.
insert into public.profiles
(id, display_name, age, city, role, bio, interests, core_values, looking_for, communication_style, is_demo, demo_liker)
values
('10000000-0000-4000-8000-000000000001','Mira',26,'Delhi','Architect','Collecting little stories from cities, one bookstore and one badly planned trip at a time.',array['Architecture','Independent films','Bookstores','Weekend travel'],array['Curiosity','Kindness','Creativity'],'Something intentional, without rushing the good parts.','I connect through shared experiences and thoughtful conversation.',true,true),
('10000000-0000-4000-8000-000000000002','Aarav',28,'Gurugram','Climate researcher','Usually found cycling somewhere, reading about the future or making dinner for friends.',array['Cycling','Climate science','Cooking','Live music'],array['Honesty','Community','Curiosity'],'A grounded connection with shared purpose.','I appreciate directness, warmth and a little spontaneity.',true,false),
('10000000-0000-4000-8000-000000000003','Zoya',25,'Delhi','Writer','Writing things down, finding new music and asking one question too many.',array['Writing','Live music','Independent films','Art'],array['Creativity','Empathy','Independence'],'A relationship that feels like being on the same team.','I love playful banter that can turn into a real conversation.',true,true),
('10000000-0000-4000-8000-000000000004','Dev',27,'Delhi','Founder','Building small things, discovering old music and finding good food with friends.',array['Startups','Music','Food walks','Photography'],array['Curiosity','Honesty','Ambition'],'A genuine connection with a sense of humour.','A mix of playful conversation and thoughtful questions.',true,false),
('10000000-0000-4000-8000-000000000005','Isha',26,'Noida','Psychologist','A fan of slow mornings, good conversations and finding meaning in ordinary things.',array['Reading','Pottery','Nature walks','Cinema'],array['Empathy','Kindness','Growth'],'Something steady, open and mutually supportive.','I value listening and conversations with depth.',true,false),
('10000000-0000-4000-8000-000000000006','Rohan',29,'Gurugram','Product manager','Equal parts curious about technology and obsessed with finding the best breakfast spots.',array['Technology','Running','Coffee','Travel'],array['Curiosity','Independence','Humour'],'A relationship where both people keep growing.','I connect through humour and shared adventures.',true,false)
on conflict (id) do update set
  display_name=excluded.display_name, age=excluded.age, city=excluded.city, role=excluded.role,
  bio=excluded.bio, interests=excluded.interests, core_values=excluded.core_values,
  looking_for=excluded.looking_for, communication_style=excluded.communication_style,
  is_demo=true, demo_liker=excluded.demo_liker;

-- Starter likes appear for every newly-created real member profile.
create or replace function public.seed_pairwise_incoming_likes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null and new.is_demo = false then
    insert into public.likes(from_profile_id, to_profile_id)
    select id, new.id from public.profiles
    where is_demo = true and demo_liker = true
    on conflict (from_profile_id, to_profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists pairwise_seed_incoming_likes on public.profiles;
create trigger pairwise_seed_incoming_likes
after insert on public.profiles
for each row execute function public.seed_pairwise_incoming_likes();

-- Enable RLS.
alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Profiles are discoverable to members" on public.profiles;
create policy "Profiles are discoverable to members" on public.profiles
for select using (auth.role() = 'authenticated');

drop policy if exists "Members create own profile" on public.profiles;
create policy "Members create own profile" on public.profiles for insert
with check (auth.uid() = user_id and is_demo = false);

drop policy if exists "Members update own profile" on public.profiles;
create policy "Members update own profile" on public.profiles for update
using (auth.uid() = user_id and is_demo = false)
with check (auth.uid() = user_id and is_demo = false);

drop policy if exists "Read own likes" on public.likes;
create policy "Read own likes" on public.likes for select using (
  exists (select 1 from public.profiles p where p.id = from_profile_id and p.user_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = to_profile_id and p.user_id = auth.uid())
);

drop policy if exists "Send likes from own profile" on public.likes;
create policy "Send likes from own profile" on public.likes for insert with check (
  exists (select 1 from public.profiles p where p.id = from_profile_id and p.user_id = auth.uid())
);

drop policy if exists "Read own matches" on public.matches;
create policy "Read own matches" on public.matches for select using (
  exists (select 1 from public.profiles p where p.id = profile_one_id and p.user_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = profile_two_id and p.user_id = auth.uid())
);

drop policy if exists "Read messages in own matches" on public.messages;
create policy "Read messages in own matches" on public.messages for select using (
  exists (
    select 1 from public.matches m join public.profiles p
      on p.id = m.profile_one_id or p.id = m.profile_two_id
    where m.id = match_id and p.user_id = auth.uid()
  )
);

drop policy if exists "Send messages in own matches" on public.messages;
create policy "Send messages in own matches" on public.messages for insert with check (
  exists (select 1 from public.profiles p where p.id = sender_profile_id and p.user_id = auth.uid())
  and exists (
    select 1 from public.matches m join public.profiles p
      on p.id = m.profile_one_id or p.id = m.profile_two_id
    where m.id = match_id and p.user_id = auth.uid()
  )
);

-- Helpful indexes.
create index if not exists likes_to_profile_idx on public.likes(to_profile_id);
create index if not exists likes_from_profile_idx on public.likes(from_profile_id);
create index if not exists matches_one_idx on public.matches(profile_one_id);
create index if not exists matches_two_idx on public.matches(profile_two_id);
create index if not exists messages_match_created_idx on public.messages(match_id, created_at);
