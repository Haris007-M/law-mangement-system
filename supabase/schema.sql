-- Run this whole file in Supabase Dashboard > SQL Editor.
-- Safe to run more than once (it will not wipe data).

-- ---------- Types & table ----------
do $$ begin
  create type public.user_role as enum ('super_admin', 'lawyer', 'client');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null,
  lawyer_id   uuid references public.profiles(id) on delete restrict, -- clients only
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  -- a client must have a lawyer; lawyers/admins must not
  constraint client_needs_lawyer check ((role = 'client') = (lawyer_id is not null))
);

-- null until the person has chosen a password (shown as "Invited" in the UI)
alter table public.profiles add column if not exists password_set_at timestamptz;
-- email notifications on/off (user can change it in Settings)
alter table public.profiles add column if not exists notify_email boolean not null default true;
-- mirrors "has a verified authenticator app" so the UI can show it (the real check is mfa_ok())
alter table public.profiles add column if not exists mfa_enabled boolean not null default false;

-- one-time backfill for accounts that already signed in before this column existed
update public.profiles p
set password_set_at = u.last_sign_in_at
from auth.users u
where u.id = p.id and u.last_sign_in_at is not null and p.password_set_at is null;

create index if not exists profiles_lawyer_id_idx on public.profiles(lawyer_id);
create unique index if not exists profiles_email_key on public.profiles(lower(email));

alter table public.profiles enable row level security;

-- ---------- Table privileges ----------
-- Browser (authenticated) can only READ; all writes go through server actions
-- using the service role. Stated explicitly so it works even if your project
-- does not auto-grant new tables to the Data API roles.
grant usage on schema public to anon, authenticated, service_role;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- ---------- Helper functions (security definer = no recursive RLS) ----------

create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.auth_lawyer_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select lawyer_id from public.profiles where id = auth.uid()
$$;

-- Two-factor: TRUE if the person has no verified authenticator app, or this session
-- has already passed the 6-digit check (JWT claim aal2). Enforced in the database so a
-- stolen password alone can never read data, even by calling the API directly.
create or replace function public.mfa_ok()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors
                     where user_id = auth.uid() and status = 'verified')
$$;

-- Role + "is this account allowed in right now?"
-- A client is only active if BOTH the client and their lawyer are active.
-- my_mfa_ok = false means "signed in with a password but the 2FA code is still needed".
drop function if exists public.my_access();
create or replace function public.my_access()
returns table (my_role public.user_role, my_active boolean, my_mfa_ok boolean)
language sql stable security definer set search_path = public as $$
  select
    p.role,
    p.is_active and (
      p.role <> 'client'
      or coalesce((select l.is_active from public.profiles l where l.id = p.lawyer_id), false)
    ),
    public.mfa_ok()
  from public.profiles p
  where p.id = auth.uid()
$$;

-- Use this in the RLS policies of every table (cases, documents, ...)
create or replace function public.auth_is_active()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select my_active and my_mfa_ok from public.my_access()), false)
$$;

revoke execute on function public.auth_role(), public.auth_lawyer_id(),
  public.my_access(), public.auth_is_active(), public.mfa_ok() from public, anon;
grant execute on function public.auth_role(), public.auth_lawyer_id(),
  public.my_access(), public.auth_is_active(), public.mfa_ok() to authenticated;

-- ---------- RLS policies (read-only from the browser) ----------

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "super admin reads all" on public.profiles;
create policy "super admin reads all" on public.profiles
  for select to authenticated
  using (public.auth_role() = 'super_admin' and public.mfa_ok());

drop policy if exists "lawyer reads own clients" on public.profiles;
create policy "lawyer reads own clients" on public.profiles
  for select to authenticated
  using (public.auth_role() = 'lawyer' and lawyer_id = auth.uid() and public.mfa_ok());

drop policy if exists "client reads own lawyer" on public.profiles;
create policy "client reads own lawyer" on public.profiles
  for select to authenticated
  using (id = public.auth_lawyer_id() and public.mfa_ok());

-- ---------- Integrity: a client's lawyer must really be a lawyer ----------
create or replace function public.profiles_validate()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.role = 'client' then
    if not exists (select 1 from public.profiles where id = new.lawyer_id and role = 'lawyer') then
      raise exception 'A client must belong to a lawyer';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_validate on public.profiles;
create trigger profiles_validate
  before insert or update of role, lawyer_id on public.profiles
  for each row execute function public.profiles_validate();

-- ---------- Rate limiting (used by login, password reset, invites) ----------
create table if not exists public.rate_limits (
  id     bigserial primary key,
  key    text not null,
  hit_at timestamptz not null default now()
);
create index if not exists rate_limits_key_idx on public.rate_limits(key, hit_at desc);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;
grant usage, select on sequence public.rate_limits_id_seq to service_role;

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if random() < 0.02 then
    delete from public.rate_limits where hit_at < now() - interval '1 day';
  end if;
  select count(*) into n from public.rate_limits
   where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then return false; end if;
  insert into public.rate_limits(key) values (p_key);
  return true;
end $$;

revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;

-- ---------- Audit log (append-only, written by the server) ----------
create table if not exists public.audit_log (
  id         bigserial primary key,
  actor_id   uuid,
  action     text not null,
  target_id  uuid,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant all on public.audit_log to service_role;
grant usage, select on sequence public.audit_log_id_seq to service_role;

drop policy if exists "super admin reads audit" on public.audit_log;
create policy "super admin reads audit" on public.audit_log
  for select to authenticated using (public.auth_role() = 'super_admin');
grant select on public.audit_log to authenticated;

-- =====================================================================
--  PRACTICE MANAGEMENT: cases, messages, notes, documents, calendar,
--  tasks, invoices
--  Rules enforced HERE (row level security), not just in the app:
--   * a lawyer only sees/changes their own cases and their own clients' data
--   * a client only sees their own cases, and only what the lawyer shared
--   * the super admin can NOT read case contents, messages or documents
-- =====================================================================

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists firm_name text;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Tables ----------
create table if not exists public.cases (
  id             uuid primary key default gen_random_uuid(),
  lawyer_id      uuid not null references public.profiles(id) on delete restrict,
  client_id      uuid not null references public.profiles(id) on delete restrict,
  case_number    text not null,
  title          text not null check (char_length(title) between 1 and 200),
  case_type      text not null default 'Other',
  status         text not null default 'open' check (status in ('open','in_progress','on_hold','closed')),
  court          text,
  opposing_party text,
  description    text,
  opened_on      date not null default current_date,
  closed_on      date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (lawyer_id, case_number)
);
create index if not exists cases_lawyer_idx on public.cases(lawyer_id, updated_at desc);
create index if not exists cases_client_idx on public.cases(client_id);

create table if not exists public.case_messages (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete restrict,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists case_messages_case_idx on public.case_messages(case_id, created_at);

create table if not exists public.case_notes (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete restrict,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists case_notes_case_idx on public.case_notes(case_id, created_at desc);

create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references public.cases(id) on delete cascade,
  uploaded_by       uuid not null references public.profiles(id) on delete restrict,
  name              text not null check (char_length(name) between 1 and 200),
  storage_path      text not null,
  size_bytes        bigint not null default 0,
  mime_type         text,
  visible_to_client boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists documents_case_idx on public.documents(case_id, created_at desc);

create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  lawyer_id         uuid not null references public.profiles(id) on delete restrict,
  case_id           uuid references public.cases(id) on delete cascade,
  title             text not null check (char_length(title) between 1 and 200),
  kind              text not null default 'meeting' check (kind in ('hearing','meeting','deadline','other')),
  starts_at         timestamptz not null,
  location          text,
  notes             text,
  visible_to_client boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists events_lawyer_idx on public.events(lawyer_id, starts_at);
create index if not exists events_case_idx on public.events(case_id);

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  lawyer_id  uuid not null references public.profiles(id) on delete restrict,
  case_id    uuid references public.cases(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  due_date   date,
  priority   text not null default 'medium' check (priority in ('low','medium','high')),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_lawyer_idx on public.tasks(lawyer_id, done, due_date);

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  lawyer_id    uuid not null references public.profiles(id) on delete restrict,
  client_id    uuid not null references public.profiles(id) on delete restrict,
  case_id      uuid references public.cases(id) on delete set null,
  number       text not null,
  description  text,
  amount_cents bigint not null check (amount_cents > 0),
  currency     text not null default 'USD',
  status       text not null default 'draft' check (status in ('draft','sent','paid','void')),
  issued_on    date not null default current_date,
  due_on       date,
  paid_on      date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (lawyer_id, number)
);
create index if not exists invoices_lawyer_idx on public.invoices(lawyer_id, created_at desc);
create index if not exists invoices_client_idx on public.invoices(client_id);

alter table public.cases         enable row level security;
alter table public.case_messages enable row level security;
alter table public.case_notes    enable row level security;
alter table public.documents     enable row level security;
alter table public.events        enable row level security;
alter table public.tasks         enable row level security;
alter table public.invoices      enable row level security;

-- ---------- Helper functions (security definer = no recursive RLS) ----------
create or replace function public.is_my_client(p_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = p_client and role = 'client' and lawyer_id = auth.uid())
$$;

create or replace function public.owns_case(p_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases where id = p_case and lawyer_id = auth.uid())
$$;

create or replace function public.client_of_case(p_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases where id = p_case and client_id = auth.uid())
$$;

create or replace function public.can_access_case(p_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases
                 where id = p_case and (lawyer_id = auth.uid() or client_id = auth.uid()))
$$;

revoke execute on function public.is_my_client(uuid), public.owns_case(uuid),
  public.client_of_case(uuid), public.can_access_case(uuid) from public, anon;
grant execute on function public.is_my_client(uuid), public.owns_case(uuid),
  public.client_of_case(uuid), public.can_access_case(uuid) to authenticated;

-- ---------- Triggers: numbering + integrity (run for everyone, even the service role) ----------
create or replace function public.cases_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.profiles
                 where id = new.client_id and role = 'client' and lawyer_id = new.lawyer_id) then
    raise exception 'This client does not belong to this lawyer';
  end if;
  if tg_op = 'INSERT' and (new.case_number is null or new.case_number = '') then
    perform pg_advisory_xact_lock(hashtext('case:' || new.lawyer_id::text));
    select count(*) + 1 into n from public.cases where lawyer_id = new.lawyer_id;
    new.case_number := 'CASE-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
  end if;
  if new.status = 'closed' and new.closed_on is null then new.closed_on := current_date; end if;
  if new.status <> 'closed' then new.closed_on := null; end if;
  return new;
end $$;
drop trigger if exists cases_before_write on public.cases;
create trigger cases_before_write before insert or update on public.cases
  for each row execute function public.cases_before_write();
drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();

create or replace function public.invoices_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.profiles
                 where id = new.client_id and role = 'client' and lawyer_id = new.lawyer_id) then
    raise exception 'This client does not belong to this lawyer';
  end if;
  if new.case_id is not null and not exists (
       select 1 from public.cases
       where id = new.case_id and lawyer_id = new.lawyer_id and client_id = new.client_id) then
    raise exception 'That case does not belong to this client';
  end if;
  if tg_op = 'INSERT' and (new.number is null or new.number = '') then
    perform pg_advisory_xact_lock(hashtext('inv:' || new.lawyer_id::text));
    select count(*) + 1 into n from public.invoices where lawyer_id = new.lawyer_id;
    new.number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
  end if;
  if tg_op = 'UPDATE' and old.status <> 'draft' and (
       new.amount_cents <> old.amount_cents or new.currency <> old.currency
       or new.client_id <> old.client_id or new.case_id is distinct from old.case_id) then
    raise exception 'Only draft invoices can be edited. Void it and create a new one instead.';
  end if;
  if new.status = 'paid' and new.paid_on is null then new.paid_on := current_date; end if;
  if new.status <> 'paid' then new.paid_on := null; end if;
  return new;
end $$;
drop trigger if exists invoices_before_write on public.invoices;
create trigger invoices_before_write before insert or update on public.invoices
  for each row execute function public.invoices_before_write();
drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

-- reminder bookkeeping (so each reminder email is sent once)
alter table public.events add column if not exists reminded_at timestamptz;
alter table public.tasks  add column if not exists reminded_at timestamptz;

-- ---------- Table privileges (browser can only do what RLS allows) ----------
revoke all on public.cases, public.case_messages, public.case_notes, public.documents,
  public.events, public.tasks, public.invoices from anon, authenticated;
grant select, insert, update, delete on public.cases to authenticated;
grant select, insert on public.case_messages to authenticated;
grant select, insert, delete on public.case_notes to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.cases, public.case_messages, public.case_notes, public.documents,
  public.events, public.tasks, public.invoices to service_role;

-- ---------- RLS policies ----------
-- cases
drop policy if exists "cases read" on public.cases;
create policy "cases read" on public.cases for select to authenticated
  using (public.auth_is_active() and (lawyer_id = auth.uid() or client_id = auth.uid()));
drop policy if exists "cases insert" on public.cases;
create policy "cases insert" on public.cases for insert to authenticated
  with check (public.auth_is_active() and public.auth_role() = 'lawyer'
              and lawyer_id = auth.uid() and public.is_my_client(client_id));
drop policy if exists "cases update" on public.cases;
create policy "cases update" on public.cases for update to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid())
  with check (public.auth_is_active() and public.auth_role() = 'lawyer'
              and lawyer_id = auth.uid() and public.is_my_client(client_id));

-- a lawyer may delete their own case (everything inside it goes too; files are removed by the app)
drop policy if exists "cases delete" on public.cases;
create policy "cases delete" on public.cases for delete to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid());

-- messages (both sides of a case)
drop policy if exists "messages read" on public.case_messages;
create policy "messages read" on public.case_messages for select to authenticated
  using (public.auth_is_active() and public.can_access_case(case_id));
drop policy if exists "messages insert" on public.case_messages;
create policy "messages insert" on public.case_messages for insert to authenticated
  with check (public.auth_is_active() and public.can_access_case(case_id) and author_id = auth.uid());

-- private notes (lawyer only; clients can never read these)
drop policy if exists "notes read" on public.case_notes;
create policy "notes read" on public.case_notes for select to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and public.owns_case(case_id));
drop policy if exists "notes insert" on public.case_notes;
create policy "notes insert" on public.case_notes for insert to authenticated
  with check (public.auth_is_active() and public.auth_role() = 'lawyer'
              and public.owns_case(case_id) and author_id = auth.uid());
drop policy if exists "notes delete" on public.case_notes;
create policy "notes delete" on public.case_notes for delete to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and public.owns_case(case_id));

-- documents (clients only see what the lawyer shared, plus their own uploads)
drop policy if exists "documents read" on public.documents;
create policy "documents read" on public.documents for select to authenticated
  using (public.auth_is_active() and (
    public.owns_case(case_id) or (visible_to_client and public.client_of_case(case_id))));
drop policy if exists "documents insert" on public.documents;
create policy "documents insert" on public.documents for insert to authenticated
  with check (public.auth_is_active() and uploaded_by = auth.uid() and (
    public.owns_case(case_id) or (visible_to_client and public.client_of_case(case_id))));
drop policy if exists "documents update" on public.documents;
create policy "documents update" on public.documents for update to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and public.owns_case(case_id))
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and public.owns_case(case_id));
drop policy if exists "documents delete" on public.documents;
create policy "documents delete" on public.documents for delete to authenticated
  using (public.auth_is_active() and (public.owns_case(case_id) or uploaded_by = auth.uid()));

-- events (clients see only events the lawyer marked visible, on their own cases)
drop policy if exists "events read" on public.events;
create policy "events read" on public.events for select to authenticated
  using (public.auth_is_active() and (
    lawyer_id = auth.uid()
    or (visible_to_client and case_id is not null and public.client_of_case(case_id))));
drop policy if exists "events insert" on public.events;
create policy "events insert" on public.events for insert to authenticated
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid()
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "events update" on public.events;
create policy "events update" on public.events for update to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid())
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid()
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "events delete" on public.events;
create policy "events delete" on public.events for delete to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid());

-- tasks (lawyer only)
drop policy if exists "tasks read" on public.tasks;
create policy "tasks read" on public.tasks for select to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid());
drop policy if exists "tasks insert" on public.tasks;
create policy "tasks insert" on public.tasks for insert to authenticated
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid()
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "tasks update" on public.tasks;
create policy "tasks update" on public.tasks for update to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid())
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid()
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "tasks delete" on public.tasks;
create policy "tasks delete" on public.tasks for delete to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid());

-- invoices (clients never see drafts)
drop policy if exists "invoices read" on public.invoices;
create policy "invoices read" on public.invoices for select to authenticated
  using (public.auth_is_active() and (
    lawyer_id = auth.uid() or (client_id = auth.uid() and status <> 'draft')));
drop policy if exists "invoices insert" on public.invoices;
create policy "invoices insert" on public.invoices for insert to authenticated
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid()
              and public.is_my_client(client_id) and (case_id is null or public.owns_case(case_id)));
drop policy if exists "invoices update" on public.invoices;
create policy "invoices update" on public.invoices for update to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid())
  with check (public.auth_is_active() and public.auth_role() = 'lawyer' and lawyer_id = auth.uid()
              and public.is_my_client(client_id));

-- invoices: only DRAFTS can be deleted (anything sent must be voided so the record stays)
drop policy if exists "invoices delete" on public.invoices;
create policy "invoices delete" on public.invoices for delete to authenticated
  using (public.auth_is_active() and public.auth_role() = 'lawyer'
         and lawyer_id = auth.uid() and status = 'draft');

-- ---------- Super admin: aggregate numbers ONLY (never contents) ----------
create or replace function public.admin_platform_stats()
returns table (
  lawyers bigint, active_lawyers bigint, clients bigint,
  cases bigint, open_cases bigint, documents bigint, storage_bytes bigint
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.profiles where role = 'lawyer'),
    (select count(*) from public.profiles where role = 'lawyer' and is_active),
    (select count(*) from public.profiles where role = 'client'),
    (select count(*) from public.cases),
    (select count(*) from public.cases where status <> 'closed'),
    (select count(*) from public.documents),
    (select coalesce(sum(size_bytes), 0)::bigint from public.documents)
  where public.auth_role() = 'super_admin' and public.mfa_ok()
$$;

create or replace function public.admin_lawyer_stats()
returns table (lawyer_id uuid, client_count bigint, case_count bigint, open_case_count bigint)
language sql stable security definer set search_path = public as $$
  select p.id,
    (select count(*) from public.profiles c where c.lawyer_id = p.id),
    (select count(*) from public.cases x where x.lawyer_id = p.id),
    (select count(*) from public.cases x where x.lawyer_id = p.id and x.status <> 'closed')
  from public.profiles p
  where p.role = 'lawyer' and public.auth_role() = 'super_admin' and public.mfa_ok()
$$;

-- New lawyers / clients / cases / documents per week (counts only, for the admin charts)
create or replace function public.admin_weekly_activity(p_weeks int default 8)
returns table (week_start date, new_lawyers bigint, new_clients bigint, new_cases bigint, new_documents bigint)
language sql stable security definer set search_path = public as $$
  with weeks as (
    select (date_trunc('week', now()) - make_interval(weeks => g))::date as ws
    from generate_series(least(greatest(p_weeks, 1), 26) - 1, 0, -1) as g
  )
  select w.ws,
    (select count(*) from public.profiles p where p.role = 'lawyer' and p.created_at >= w.ws and p.created_at < w.ws + 7),
    (select count(*) from public.profiles p where p.role = 'client' and p.created_at >= w.ws and p.created_at < w.ws + 7),
    (select count(*) from public.cases c where c.created_at >= w.ws and c.created_at < w.ws + 7),
    (select count(*) from public.documents d where d.created_at >= w.ws and d.created_at < w.ws + 7)
  from weeks w
  where public.auth_role() = 'super_admin' and public.mfa_ok()
  order by w.ws
$$;

revoke execute on function public.admin_platform_stats(), public.admin_lawyer_stats(), public.admin_weekly_activity(int) from public, anon;
grant execute on function public.admin_platform_stats(), public.admin_lawyer_stats(), public.admin_weekly_activity(int) to authenticated;

-- ---------- Private file storage ----------
-- No storage policies on purpose: the browser can never touch files directly.
-- The server checks your permission (RLS above) and then hands out a 60-second signed link.
insert into storage.buckets (id, name, public, file_size_limit)
values ('case-documents', 'case-documents', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

-- ---------- Your super admin ----------
-- Easiest: from the project folder run
--   npm run create-admin -- you@example.com "YourStrongPassword" "Your Name"
-- (see SETUP.md). No SQL needed.
