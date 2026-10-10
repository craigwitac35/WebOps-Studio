-- ============================================================
-- WebOps Studio · Workshop demo 05: Quote Form to Dashboard
-- Run once in Supabase > SQL Editor. Safe to re-run.
--
-- Security model:
--   * Every visitor gets an anonymous sign-in (turn ON "Allow anonymous
--     sign-ins" under Authentication > Sign In / Providers).
--   * Row level security: a visitor can only see, change, or delete
--     rows they created. Nobody can read anyone else's rows.
--   * Caps: 8 rows per visitor, 2,000 rows total, rows older than
--     24 hours are cleared automatically on the next insert.
--   * Status is the only column a visitor can change after sending.
-- ============================================================

create table if not exists public.workshop_quotes (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  email       text not null check (char_length(email) <= 120 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  phone       text check (phone is null or char_length(phone) <= 20),
  service     text not null check (service in ('Roof repair', 'Full replacement', 'Gutters', 'Storm inspection')),
  details     text check (details is null or char_length(details) <= 400),
  status      text not null default 'new' check (status in ('new', 'quoted', 'won')),
  created_at  timestamptz not null default now()
);

create index if not exists workshop_quotes_user_idx on public.workshop_quotes (user_id, created_at desc);

alter table public.workshop_quotes enable row level security;

drop policy if exists "own rows: read"   on public.workshop_quotes;
drop policy if exists "own rows: insert" on public.workshop_quotes;
drop policy if exists "own rows: update" on public.workshop_quotes;
drop policy if exists "own rows: delete" on public.workshop_quotes;

create policy "own rows: read"   on public.workshop_quotes for select to authenticated using (user_id = auth.uid());
create policy "own rows: insert" on public.workshop_quotes for insert to authenticated with check (user_id = auth.uid());
create policy "own rows: update" on public.workshop_quotes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows: delete" on public.workshop_quotes for delete to authenticated using (user_id = auth.uid());

-- Column-level grants: logged-out requests get nothing; visitors may only edit status.
revoke all on public.workshop_quotes from anon, authenticated;
grant select, delete on public.workshop_quotes to authenticated;
grant insert (name, email, phone, service, details) on public.workshop_quotes to authenticated;
grant update (status) on public.workshop_quotes to authenticated;

-- Caps + 24-hour cleanup, enforced in the database (not just the browser).
create or replace function public.workshop_quotes_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.workshop_quotes where created_at < now() - interval '24 hours';

  if (select count(*) from public.workshop_quotes where user_id = new.user_id) >= 8 then
    raise exception 'Demo limit is 8 requests. Delete one to add another.';
  end if;

  if (select count(*) from public.workshop_quotes) >= 2000 then
    raise exception 'The demo is busy right now. Try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists workshop_quotes_guard on public.workshop_quotes;
create trigger workshop_quotes_guard
  before insert on public.workshop_quotes
  for each row execute function public.workshop_quotes_guard();

-- Optional housekeeping, run whenever you like (or schedule with pg_cron):
-- removes anonymous demo visitors older than 7 days (their rows go with them).
-- delete from auth.users where is_anonymous and created_at < now() - interval '7 days';
