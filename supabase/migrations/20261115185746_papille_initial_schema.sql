-- Papille : données par utilisateur. Les recettes et aliments restent côté client pour l'instant.
-- Appliquée sur le projet eccernutbnunvydpfybt le 15/11/2026.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  allergens text[] not null default '{}',
  regimes text[] not null default '{}',
  forbidden text[] not null default '{}',
  age smallint check (age between 10 and 120),
  sex text check (sex in ('F', 'H')),
  weight numeric(5,1) check (weight between 20 and 400),
  height smallint check (height between 80 and 250),
  activity text not null default 'mod' check (activity in ('sed', 'light', 'mod', 'high')),
  updated_at timestamptz not null default now()
);

create table public.food_answers (
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id text not null,
  answer text not null check (answer in ('like', 'dislike', 'unsure')),
  updated_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

create table public.recipe_opinions (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  opinion text not null check (opinion in ('like', 'dislike', 'unsure')),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('food', 'recipe')),
  ref text not null,
  qty numeric(8,2) not null check (qty > 0),
  created_at timestamptz not null default now()
);
create index journal_entries_user_day_idx on public.journal_entries (user_id, day);

create table public.shopping_recipes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  portions numeric(5,1) not null check (portions > 0),
  primary key (user_id, recipe_id)
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  qty numeric(8,2) not null default 1,
  unit text not null default '',
  aisle text not null default 'Autres',
  base boolean not null default false,
  created_at timestamptz not null default now()
);
create index shopping_items_user_idx on public.shopping_items (user_id);

-- Cases cochées et articles de recette retirés (« Vider les cochés »)
create table public.shopping_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  checked text[] not null default '{}',
  removed text[] not null default '{}'
);

create table public.always_buy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  qty numeric(8,2) not null default 1,
  unit text not null default '',
  aisle text not null default 'Autres',
  created_at timestamptz not null default now()
);
create index always_buy_user_idx on public.always_buy (user_id);

-- Sécurité : chaque utilisateur ne voit et ne modifie que ses lignes
do $$
declare t text;
begin
  foreach t in array array['profiles','food_answers','recipe_opinions','journal_entries','shopping_recipes','shopping_items','shopping_state','always_buy']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s_select_own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- À l'inscription : profil vide, état de courses vide, liste de base par défaut
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  insert into public.shopping_state (user_id) values (new.id);
  insert into public.always_buy (user_id, name, qty, unit, aisle) values
    (new.id, 'Lait demi-écrémé', 2, 'L', 'Frais'),
    (new.id, 'Œufs', 12, '', 'Frais'),
    (new.id, 'Pain complet', 1, '', 'Boulangerie'),
    (new.id, 'Bananes', 6, '', 'Fruits et légumes');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
