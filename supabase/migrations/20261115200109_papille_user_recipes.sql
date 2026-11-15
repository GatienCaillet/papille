-- Recettes importées depuis le web (ou saisies à la main) : une ligne par recette, contenu en JSON.
-- Copie privée pour usage personnel ; le lien vers la source est conservé.
create table public.user_recipes (
  id text primary key check (id ~ '^web-[a-z0-9-]+$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_url text,
  recipe jsonb not null,
  created_at timestamptz not null default now()
);
create index user_recipes_user_idx on public.user_recipes (user_id);
create unique index user_recipes_user_url_idx on public.user_recipes (user_id, source_url) where source_url is not null;

alter table public.user_recipes enable row level security;
create policy "user_recipes_select_own" on public.user_recipes for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_recipes_insert_own" on public.user_recipes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_recipes_update_own" on public.user_recipes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_recipes_delete_own" on public.user_recipes for delete to authenticated using ((select auth.uid()) = user_id);
