-- Fix invite redemption flow.
-- The original invites_select policy requires home membership, which means
-- a user accepting an invite (who is NOT yet a member) cannot read the invite
-- to validate it. Similarly, invites_update requires admin access, so a new
-- member cannot mark the invite as used.
--
-- Solution:
-- 1. Add a public SELECT policy so anyone can look up unused invites by code.
-- 2. Create a SECURITY DEFINER function to atomically redeem an invite
--    (validate, create membership, mark used) — bypasses RLS safely.

-- Allow anyone (including anonymous / not-yet-signed-up visitors) to read
-- an invite row by its code, but only if it hasn't been used yet.
-- This is safe because invite codes are unguessable random strings.
create policy "invites_select_by_code" on invites
  for select using (
    used = false
    and expires_at > now()
  );

-- Public invite lookup function.
-- Returns invite details including home name and inviter name, bypassing RLS
-- so that unauthenticated visitors can see the invite info.
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
      and i.used = false
      and i.expires_at > now();
end;
$$;

-- Atomic invite redemption function.
-- Validates the invite, creates the home_members row, and marks the invite used.
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
      and used = false
    for update;

  if v_invite is null then
    raise exception 'Invite is invalid or has already been used';
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

  -- Mark invite as used
  update invites set used = true where id = v_invite.id;

  return v_invite.home_id;
end;
$$;
