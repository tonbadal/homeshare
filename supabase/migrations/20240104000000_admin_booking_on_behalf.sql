-- Allow admins to create bookings on behalf of other home members
drop policy "bookings_insert" on bookings;

create policy "bookings_insert" on bookings
  for insert with check (
    -- Regular members can create bookings for themselves
    (requested_by = auth.uid() and is_member_of(bookings.home_id))
    -- Admins/owners can create bookings for any accepted member of the home
    or (
      is_admin_of(bookings.home_id)
      and exists (
        select 1 from home_members
        where home_members.home_id = bookings.home_id
          and home_members.user_id = bookings.requested_by
          and home_members.invite_status = 'accepted'
      )
    )
  );
