-- ============================================================
-- Reusable Invites Migration
-- Adds max_uses, times_used, and is_active columns to invites.
-- Updates redeem_invite(), get_invite_details(), and RLS policy.
-- ============================================================

-- 1. Add new columns
alter table invites
  add column max_uses int,
  add column times_used int not null default 0,
  add column is_active boolean not null default true;

-- 2. Migrate existing data
update invites set times_used = 1, max_uses = 1 where used = true;
update invites set times_used = 0 where used = false;

-- 3. Update RLS policy for public invite lookup
-- Drop old policy and recreate with new conditions
drop policy if exists "invites_select_by_code" on invites;

create policy "invites_select_by_code" on invites
  for select using (
    is_active = true
    and expires_at > now()
    and (max_uses is null or times_used < max_uses)
  );

-- 4. Update get_invite_details() function
create or replace function get_invite_details(p_code text)
returns table (
  home_id uuid,
  role text,
  home_name text,
  invited_by_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
    select
      i.home_id,
      i.role::text,
      h.name,
      coalesce(p.display_name, 'Someone')
    from invites i
    join homes h on h.id = i.home_id
    left join profiles p on p.id = i.invited_by
    where i.code = p_code
      and i.is_active = true
      and i.expires_at > now()
      and (i.max_uses is null or i.times_used < i.max_uses);
end;
$$;

-- 5. Update redeem_invite() function
create or replace function redeem_invite(p_code text)
returns uuid  -- returns the home_id on success
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  invites%rowtype;
  v_user_id uuid := auth.uid();
  v_existing uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the invite row to prevent race conditions
  select * into v_invite
    from invites
    where code = p_code
      and is_active = true
      and (max_uses is null or times_used < max_uses)
    for update;

  if v_invite is null then
    raise exception 'Invite is invalid, expired, or no longer active';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  -- Check if already a member
  select id into v_existing
    from home_members
    where home_id = v_invite.home_id
      and user_id = v_user_id;

  if v_existing is not null then
    -- Already a member — just return the home_id
    return v_invite.home_id;
  end if;

  -- Create membership
  insert into home_members (home_id, user_id, role, invite_status)
    values (v_invite.home_id, v_user_id, v_invite.role::text::home_role, 'accepted');

  -- Increment times_used
  update invites set times_used = times_used + 1 where id = v_invite.id;

  return v_invite.home_id;
end;
$$;
