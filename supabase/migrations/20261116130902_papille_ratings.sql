-- Papille : notes de 0 à 10 par aliment et par forme, à la place de J'aime / J'aime pas.
-- Appliquée sur le projet eccernutbnunvydpfybt le 16/11/2026 (82 notes d'aliments et 62 notes de plats reprises).
--
-- Une note vaut pour un aliment en général (form = '') ou pour une de ses formes (cru, cuit,
-- fondu…). score null = « je ne sais pas encore ». La vérification de sécurité (allergies,
-- régimes, interdits) ne lit jamais ces tables.

create table public.food_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id text not null,
  form text not null default '' check (form in ('', 'cru', 'cuit', 'mixe', 'nature', 'fondu', 'visible', 'incorpore', 'grille', 'mijote', 'entier')),
  score smallint check (score between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, food_id, form)
);

create table public.recipe_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  score smallint check (score between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

do $$
declare t text;
begin
  foreach t in array array['food_ratings', 'recipe_ratings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s_select_own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Reprise des avis existants : J'aime → 8, Je n'aime pas → 2, Je ne sais pas → null.
-- La note vaut pour l'aliment en général, toutes formes confondues.
insert into public.food_ratings (user_id, food_id, form, score, updated_at)
select user_id, food_id, '', case answer when 'like' then 8 when 'dislike' then 2 end, updated_at
from public.food_answers
on conflict (user_id, food_id, form) do nothing;

insert into public.recipe_ratings (user_id, recipe_id, score, updated_at)
select user_id, recipe_id, case opinion when 'like' then 8 when 'dislike' then 2 end, updated_at
from public.recipe_opinions
on conflict (user_id, recipe_id) do nothing;

-- Transition : une version de l'app restée en cache peut encore écrire dans les anciennes tables.
-- Ces déclencheurs recopient ses changements dans les nouvelles, pour ne rien perdre.
-- Les anciennes tables (food_answers, recipe_opinions) pourront être supprimées plus tard.
create or replace function public.mirror_food_answer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.food_ratings where user_id = old.user_id and food_id = old.food_id and form = '';
    return old;
  end if;
  insert into public.food_ratings (user_id, food_id, form, score, updated_at)
  values (new.user_id, new.food_id, '', case new.answer when 'like' then 8 when 'dislike' then 2 end, new.updated_at)
  on conflict (user_id, food_id, form) do update set score = excluded.score, updated_at = excluded.updated_at;
  return new;
end;
$$;

create or replace function public.mirror_recipe_opinion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.recipe_ratings where user_id = old.user_id and recipe_id = old.recipe_id;
    return old;
  end if;
  insert into public.recipe_ratings (user_id, recipe_id, score, updated_at)
  values (new.user_id, new.recipe_id, case new.opinion when 'like' then 8 when 'dislike' then 2 end, new.updated_at)
  on conflict (user_id, recipe_id) do update set score = excluded.score, updated_at = excluded.updated_at;
  return new;
end;
$$;

revoke execute on function public.mirror_food_answer() from public, anon, authenticated;
revoke execute on function public.mirror_recipe_opinion() from public, anon, authenticated;

create trigger food_answers_mirror
  after insert or update or delete on public.food_answers
  for each row execute function public.mirror_food_answer();

create trigger recipe_opinions_mirror
  after insert or update or delete on public.recipe_opinions
  for each row execute function public.mirror_recipe_opinion();
