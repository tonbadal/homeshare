-- ============================================================
-- Shared Housing App — Initial Schema Migration
-- ============================================================

-- =========================
-- 1. ENUMS
-- =========================

create type approval_policy   as enum ('any_admin', 'all_admins');
create type home_role          as enum ('owner', 'admin', 'member', 'guest');
create type invite_role        as enum ('admin', 'member', 'guest');
create type invite_status_enum as enum ('pending', 'accepted', 'declined');
create type booking_status     as enum ('pending', 'approved', 'declined', 'cancelled');
create type task_status        as enum ('open', 'in_progress', 'done');
create type assign_type        as enum ('member', 'next_visitor');
create type notification_type  as enum (
  'booking_request', 'booking_approved', 'booking_declined',
  'task_assigned', 'announcement', 'comment'
);
create type approval_decision  as enum ('approved', 'declined');
create type media_type_enum    as enum ('image', 'video');
create type task_media_label   as enum ('proof', 'reference');

-- =========================
-- 2. TABLES
-- =========================

-- profiles (linked 1-to-1 with auth.users)
create table profiles (
  id                uuid primary key references auth.users on delete cascade,
  email             text,
  display_name      text,
  avatar_url        text,
  subscription_tier text not null default 'free',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- homes
create table homes (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  address                  text,
  description              text,
  cover_image_url          text,
  approval_policy          approval_policy not null default 'any_admin',
  max_concurrent_bookings  int not null default 1,
  created_by               uuid references profiles on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- home_members (junction: users <-> homes)
create table home_members (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes on delete cascade,
  user_id       uuid not null references profiles on delete cascade,
  role          home_role not null default 'member',
  invite_status invite_status_enum not null default 'accepted',
  joined_at     timestamptz not null default now(),
  unique (home_id, user_id)
);

-- invites
create table invites (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references homes on delete cascade,
  invited_by  uuid not null references profiles on delete cascade,
  code        text not null unique,
  email       text,
  role        invite_role not null default 'member',
  expires_at  timestamptz,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- bookings
create table bookings (
  id             uuid primary key default gen_random_uuid(),
  home_id        uuid not null references homes on delete cascade,
  requested_by   uuid not null references profiles on delete cascade,
  start_date     date not null,
  end_date       date not null,
  guest_count    int not null default 1,
  notes          text,
  status         booking_status not null default 'pending',
  decline_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- booking_approvals
create table booking_approvals (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings on delete cascade,
  admin_id    uuid not null references profiles on delete cascade,
  decision    approval_decision not null,
  reason      text,
  decided_at  timestamptz not null default now(),
  unique (booking_id, admin_id)
);

-- manual_categories
create table manual_categories (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references homes on delete cascade,
  name        text not null,
  icon        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- manual_entries
create table manual_entries (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references manual_categories on delete cascade,
  home_id     uuid not null references homes on delete cascade,
  title       text not null,
  content     text not null default '',
  sort_order  int not null default 0,
  created_by  uuid references profiles on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- manual_entry_media
create table manual_entry_media (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references manual_entries on delete cascade,
  media_type  media_type_enum not null default 'image',
  url         text not null,
  sort_order  int not null default 0
);

-- tasks
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes on delete cascade,
  title           text not null,
  description     text,
  status          task_status not null default 'open',
  assign_type     assign_type not null default 'member',
  assigned_to     uuid references profiles on delete set null,
  created_by      uuid references profiles on delete set null,
  due_date        date,
  is_recurring    boolean not null default false,
  recurrence_rule text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- task_media
create table task_media (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks on delete cascade,
  media_type  text not null default 'image',
  url         text not null,
  label       task_media_label not null default 'reference',
  created_at  timestamptz not null default now()
);

-- announcements
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references homes on delete cascade,
  author_id   uuid not null references profiles on delete cascade,
  title       text not null,
  body        text not null,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- comments
create table comments (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements on delete cascade,
  author_id       uuid not null references profiles on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

-- notifications
create table notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles on delete cascade,
  home_id        uuid not null references homes on delete cascade,
  type           notification_type not null,
  title          text not null,
  body           text,
  reference_type text,
  reference_id   uuid,
  is_read        boolean not null default false,
  created_at     timestamptz not null default now()
);

-- =========================
-- 3. INDEXES
-- =========================

-- home_members
create index idx_home_members_home_id  on home_members (home_id);
create index idx_home_members_user_id  on home_members (user_id);
-- (home_id, user_id) already has a unique index from the constraint

-- invites
create index idx_invites_code    on invites (code);
create index idx_invites_home_id on invites (home_id);

-- bookings
create index idx_bookings_home_id    on bookings (home_id);
create index idx_bookings_date_range on bookings (home_id, start_date, end_date);
create index idx_bookings_requester  on bookings (requested_by);

-- booking_approvals
create index idx_booking_approvals_booking_id on booking_approvals (booking_id);

-- manual_categories
create index idx_manual_categories_home_id on manual_categories (home_id);

-- manual_entries
create index idx_manual_entries_category_id on manual_entries (category_id);
create index idx_manual_entries_home_id     on manual_entries (home_id);

-- tasks
create index idx_tasks_home_id     on tasks (home_id);
create index idx_tasks_assigned_to on tasks (assigned_to);

-- announcements
create index idx_announcements_home_id on announcements (home_id);

-- comments
create index idx_comments_announcement_id on comments (announcement_id);

-- notifications
create index idx_notifications_user_read on notifications (user_id, is_read);
create index idx_notifications_home_id   on notifications (home_id);

-- =========================
-- 4. TRIGGER FUNCTIONS
-- =========================

-- Auto-update updated_at on row modification
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-create profile when a new auth.users row is inserted
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- =========================
-- 5. TRIGGERS
-- =========================

-- Profile auto-creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- updated_at triggers
create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger set_homes_updated_at
  before update on homes
  for each row execute function set_updated_at();

create trigger set_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

create trigger set_manual_entries_updated_at
  before update on manual_entries
  for each row execute function set_updated_at();

create trigger set_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create trigger set_announcements_updated_at
  before update on announcements
  for each row execute function set_updated_at();

-- =========================
-- 6. ROW LEVEL SECURITY
-- =========================

-- Helper functions to check home membership without triggering RLS recursion.
-- SECURITY DEFINER bypasses RLS. Using plpgsql prevents function inlining
-- (SQL functions can be inlined by the planner, losing the SECURITY DEFINER context).
create or replace function is_member_of(p_home_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.home_members
    where home_id = p_home_id
      and user_id = auth.uid()
  );
end;
$$;

create or replace function is_admin_of(p_home_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.home_members
    where home_id = p_home_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
end;
$$;

create or replace function is_owner_of(p_home_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.home_members
    where home_id = p_home_id
      and user_id = auth.uid()
      and role = 'owner'
  );
end;
$$;

create or replace function shares_home_with(p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.home_members hm1
    join public.home_members hm2 on hm1.home_id = hm2.home_id
    where hm1.user_id = auth.uid()
      and hm2.user_id = p_user_id
  );
end;
$$;

alter table profiles           enable row level security;
alter table homes              enable row level security;
alter table home_members       enable row level security;
alter table invites            enable row level security;
alter table bookings           enable row level security;
alter table booking_approvals  enable row level security;
alter table manual_categories  enable row level security;
alter table manual_entries     enable row level security;
alter table manual_entry_media enable row level security;
alter table tasks              enable row level security;
alter table task_media         enable row level security;
alter table announcements      enable row level security;
alter table comments           enable row level security;
alter table notifications      enable row level security;

-- -------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------

-- Users can read profiles of anyone who shares a home with them
create policy "profiles_select" on profiles
  for select using (
    id = auth.uid()
    or shares_home_with(profiles.id)
  );

-- Users can update their own profile
create policy "profiles_update" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- -------------------------------------------------------
-- HOMES
-- -------------------------------------------------------

-- Members can view their homes (also allow creator so insert...select works before membership row exists)
create policy "homes_select" on homes
  for select using (
    created_by = auth.uid()
    or is_member_of(homes.id)
  );

-- Any authenticated user can create a home
create policy "homes_insert" on homes
  for insert with check (auth.uid() is not null);

-- Owners and admins can update home settings
create policy "homes_update" on homes
  for update using (is_admin_of(homes.id));

-- Only owner can delete a home
create policy "homes_delete" on homes
  for delete using (is_owner_of(homes.id));

-- -------------------------------------------------------
-- HOME_MEMBERS
-- -------------------------------------------------------

-- Members can see other members in the same home
create policy "home_members_select" on home_members
  for select using (is_member_of(home_members.home_id));

-- Owners and admins can add members; users can add themselves (home creation)
create policy "home_members_insert" on home_members
  for insert with check (
    user_id = auth.uid()
    or is_admin_of(home_members.home_id)
  );

-- Owners and admins can update member roles / status
create policy "home_members_update" on home_members
  for update using (is_admin_of(home_members.home_id));

-- Owners can remove members; members can remove themselves
create policy "home_members_delete" on home_members
  for delete using (
    user_id = auth.uid()
    or is_owner_of(home_members.home_id)
  );

-- -------------------------------------------------------
-- INVITES
-- -------------------------------------------------------

-- Members can view invites for their home
create policy "invites_select" on invites
  for select using (is_member_of(invites.home_id));

-- Owners and admins can create invites
create policy "invites_insert" on invites
  for insert with check (is_admin_of(invites.home_id));

-- Owners and admins can update invites (e.g., mark as used)
create policy "invites_update" on invites
  for update using (is_admin_of(invites.home_id));

-- Owners and admins can delete invites
create policy "invites_delete" on invites
  for delete using (is_admin_of(invites.home_id));

-- -------------------------------------------------------
-- BOOKINGS
-- -------------------------------------------------------

-- Members can view bookings for their homes
create policy "bookings_select" on bookings
  for select using (is_member_of(bookings.home_id));

-- Members can create bookings
create policy "bookings_insert" on bookings
  for insert with check (
    requested_by = auth.uid()
    and is_member_of(bookings.home_id)
  );

-- Admins/owners can update any booking (approve/decline); requester can cancel own
create policy "bookings_update" on bookings
  for update using (
    requested_by = auth.uid()
    or is_admin_of(bookings.home_id)
  );

-- Admins/owners can delete bookings; requester can delete own
create policy "bookings_delete" on bookings
  for delete using (
    requested_by = auth.uid()
    or is_admin_of(bookings.home_id)
  );

-- -------------------------------------------------------
-- BOOKING_APPROVALS
-- -------------------------------------------------------

-- Members can view approvals in their homes
create policy "booking_approvals_select" on booking_approvals
  for select using (
    exists (
      select 1 from bookings
      where bookings.id = booking_approvals.booking_id
        and is_member_of(bookings.home_id)
    )
  );

-- Admins/owners can insert approval decisions
create policy "booking_approvals_insert" on booking_approvals
  for insert with check (
    admin_id = auth.uid()
    and exists (
      select 1 from bookings
      where bookings.id = booking_approvals.booking_id
        and is_admin_of(bookings.home_id)
    )
  );

-- -------------------------------------------------------
-- MANUAL_CATEGORIES
-- -------------------------------------------------------

-- Members can view categories for their homes
create policy "manual_categories_select" on manual_categories
  for select using (is_member_of(manual_categories.home_id));

-- Admins/owners can create categories
create policy "manual_categories_insert" on manual_categories
  for insert with check (is_admin_of(manual_categories.home_id));

-- Admins/owners can update categories
create policy "manual_categories_update" on manual_categories
  for update using (is_admin_of(manual_categories.home_id));

-- Admins/owners can delete categories
create policy "manual_categories_delete" on manual_categories
  for delete using (is_admin_of(manual_categories.home_id));

-- -------------------------------------------------------
-- MANUAL_ENTRIES
-- -------------------------------------------------------

-- Members can view entries for their homes
create policy "manual_entries_select" on manual_entries
  for select using (is_member_of(manual_entries.home_id));

-- Admins/owners can create entries
create policy "manual_entries_insert" on manual_entries
  for insert with check (is_admin_of(manual_entries.home_id));

-- Admins/owners can update entries
create policy "manual_entries_update" on manual_entries
  for update using (is_admin_of(manual_entries.home_id));

-- Admins/owners can delete entries
create policy "manual_entries_delete" on manual_entries
  for delete using (is_admin_of(manual_entries.home_id));

-- -------------------------------------------------------
-- MANUAL_ENTRY_MEDIA
-- -------------------------------------------------------

-- Members can view media for entries in their homes
create policy "manual_entry_media_select" on manual_entry_media
  for select using (
    exists (
      select 1 from manual_entries
      where manual_entries.id = manual_entry_media.entry_id
        and is_member_of(manual_entries.home_id)
    )
  );

-- Admins/owners can insert media
create policy "manual_entry_media_insert" on manual_entry_media
  for insert with check (
    exists (
      select 1 from manual_entries
      where manual_entries.id = manual_entry_media.entry_id
        and is_admin_of(manual_entries.home_id)
    )
  );

-- Admins/owners can delete media
create policy "manual_entry_media_delete" on manual_entry_media
  for delete using (
    exists (
      select 1 from manual_entries
      where manual_entries.id = manual_entry_media.entry_id
        and is_admin_of(manual_entries.home_id)
    )
  );

-- -------------------------------------------------------
-- TASKS
-- -------------------------------------------------------

-- Members can view tasks in their homes
create policy "tasks_select" on tasks
  for select using (is_member_of(tasks.home_id));

-- Members can create tasks
create policy "tasks_insert" on tasks
  for insert with check (is_member_of(tasks.home_id));

-- Assigned user can update their own tasks; admins/owners can update any
create policy "tasks_update" on tasks
  for update using (
    assigned_to = auth.uid()
    or created_by = auth.uid()
    or is_admin_of(tasks.home_id)
  );

-- Admins/owners can delete tasks; creator can delete own
create policy "tasks_delete" on tasks
  for delete using (
    created_by = auth.uid()
    or is_admin_of(tasks.home_id)
  );

-- -------------------------------------------------------
-- TASK_MEDIA
-- -------------------------------------------------------

-- Members can view task media in their homes
create policy "task_media_select" on task_media
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = task_media.task_id
        and is_member_of(tasks.home_id)
    )
  );

-- Members can add task media (e.g., proof photos)
create policy "task_media_insert" on task_media
  for insert with check (
    exists (
      select 1 from tasks
      where tasks.id = task_media.task_id
        and is_member_of(tasks.home_id)
    )
  );

-- Task creator, assignee, or admins can delete task media
create policy "task_media_delete" on task_media
  for delete using (
    exists (
      select 1 from tasks
      where tasks.id = task_media.task_id
        and (
          tasks.assigned_to = auth.uid()
          or tasks.created_by = auth.uid()
          or is_admin_of(tasks.home_id)
        )
    )
  );

-- -------------------------------------------------------
-- ANNOUNCEMENTS
-- -------------------------------------------------------

-- Members can view announcements for their homes
create policy "announcements_select" on announcements
  for select using (is_member_of(announcements.home_id));

-- Members can create announcements
create policy "announcements_insert" on announcements
  for insert with check (
    author_id = auth.uid()
    and is_member_of(announcements.home_id)
  );

-- Author can update own; admins/owners can update any
create policy "announcements_update" on announcements
  for update using (
    author_id = auth.uid()
    or is_admin_of(announcements.home_id)
  );

-- Author can delete own; admins/owners can delete any
create policy "announcements_delete" on announcements
  for delete using (
    author_id = auth.uid()
    or is_admin_of(announcements.home_id)
  );

-- -------------------------------------------------------
-- COMMENTS
-- -------------------------------------------------------

-- Members can view comments on announcements in their homes
create policy "comments_select" on comments
  for select using (
    exists (
      select 1 from announcements
      where announcements.id = comments.announcement_id
        and is_member_of(announcements.home_id)
    )
  );

-- Members can create comments
create policy "comments_insert" on comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from announcements
      where announcements.id = comments.announcement_id
        and is_member_of(announcements.home_id)
    )
  );

-- Author can update own comments
create policy "comments_update" on comments
  for update using (author_id = auth.uid());

-- Author can delete own; admins/owners can delete any
create policy "comments_delete" on comments
  for delete using (
    author_id = auth.uid()
    or exists (
      select 1 from announcements
      where announcements.id = comments.announcement_id
        and is_admin_of(announcements.home_id)
    )
  );

-- -------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------

-- Users can only see their own notifications
create policy "notifications_select" on notifications
  for select using (user_id = auth.uid());

-- System / edge functions insert notifications (service role); allow self-insert too
create policy "notifications_insert" on notifications
  for insert with check (user_id = auth.uid());

-- Users can mark their own notifications as read
create policy "notifications_update" on notifications
  for update using (user_id = auth.uid());

-- Users can delete their own notifications
create policy "notifications_delete" on notifications
  for delete using (user_id = auth.uid());

-- =========================
-- 7. STORAGE
-- =========================

insert into storage.buckets (id, name, public)
values ('home-media', 'home-media', true);

-- Members of a home can upload to their home's folder
create policy "home_media_insert" on storage.objects
  for insert with check (
    bucket_id = 'home-media'
    and auth.uid() is not null
  );

-- Anyone can view public home media
create policy "home_media_select" on storage.objects
  for select using (
    bucket_id = 'home-media'
  );

-- Admins/owners or the uploader can delete media
create policy "home_media_delete" on storage.objects
  for delete using (
    bucket_id = 'home-media'
    and auth.uid() is not null
  );
