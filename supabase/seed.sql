-- ============================================================
-- Shared Housing App — Seed Data
-- ============================================================

-- =========================
-- Fixed UUIDs for reproducibility
-- =========================

-- Users
-- user1: María García (owner)    — 11111111-1111-1111-1111-111111111111
-- user2: Carlos López (admin)    — 22222222-2222-2222-2222-222222222222
-- user3: Lucía Fernández (member) — 33333333-3333-3333-3333-333333333333

-- Home
-- home:  Villa Mediterránea      — aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

-- =========================
-- 1. AUTH USERS (triggers auto-create profiles)
-- =========================

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, aud, role
) values
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'maria@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"display_name": "María García"}'::jsonb,
  now(), now(),
  '', '', 'authenticated', 'authenticated'
),
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'carlos@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"display_name": "Carlos López"}'::jsonb,
  now(), now(),
  '', '', 'authenticated', 'authenticated'
),
(
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'lucia@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"display_name": "Lucía Fernández"}'::jsonb,
  now(), now(),
  '', '', 'authenticated', 'authenticated'
);

-- Also create auth.identities rows (required by Supabase auth)
insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
(
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub": "11111111-1111-1111-1111-111111111111", "email": "maria@example.com"}'::jsonb,
  'email', now(), now(), now()
),
(
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub": "22222222-2222-2222-2222-222222222222", "email": "carlos@example.com"}'::jsonb,
  'email', now(), now(), now()
),
(
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '{"sub": "33333333-3333-3333-3333-333333333333", "email": "lucia@example.com"}'::jsonb,
  'email', now(), now(), now()
);

-- =========================
-- 2. UPDATE PROFILES (trigger created them, add display names & avatars)
-- =========================

update profiles set
  display_name = 'María García',
  avatar_url   = 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
where id = '11111111-1111-1111-1111-111111111111';

update profiles set
  display_name = 'Carlos López',
  avatar_url   = 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'
where id = '22222222-2222-2222-2222-222222222222';

update profiles set
  display_name = 'Lucía Fernández',
  avatar_url   = 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucia'
where id = '33333333-3333-3333-3333-333333333333';

-- =========================
-- 3. HOME
-- =========================

insert into homes (id, name, address, description, approval_policy, max_concurrent_bookings, created_by) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Villa Mediterránea',
  'Carrer del Mar 42, Calella de Palafrugell, Girona, Spain',
  'Beautiful family villa on the Costa Brava with sea views, pool, and garden. Sleeps 10.',
  'any_admin',
  2,
  '11111111-1111-1111-1111-111111111111'
);

-- =========================
-- 4. HOME MEMBERS
-- =========================

insert into home_members (id, home_id, user_id, role, invite_status) values
(
  'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'owner',
  'accepted'
),
(
  'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'admin',
  'accepted'
),
(
  'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  'member',
  'accepted'
);

-- =========================
-- 5. BOOKINGS
-- =========================

insert into bookings (id, home_id, requested_by, start_date, end_date, guest_count, notes, status) values
-- Approved booking by María (past)
(
  'cccccccc-0001-0001-0001-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '2026-01-10', '2026-01-17',
  4,
  'Winter family gathering with the kids.',
  'approved'
),
-- Approved booking by Carlos (upcoming)
(
  'cccccccc-0002-0002-0002-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  '2026-03-15', '2026-03-22',
  2,
  'Spring break trip.',
  'approved'
),
-- Pending booking by Lucía
(
  'cccccccc-0003-0003-0003-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  '2026-04-01', '2026-04-05',
  3,
  'Easter weekend with friends — hope that is okay!',
  'pending'
),
-- Declined booking by Lucía
(
  'cccccccc-0004-0004-0004-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  '2026-03-15', '2026-03-20',
  5,
  'Big group outing.',
  'declined'
),
-- Pending booking by María (future)
(
  'cccccccc-0005-0005-0005-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '2026-07-01', '2026-07-15',
  6,
  'Summer holidays — two weeks with the whole family.',
  'pending'
);

-- =========================
-- 6. BOOKING APPROVALS
-- =========================

-- Carlos approved María's January booking
insert into booking_approvals (id, booking_id, admin_id, decision, reason) values
(
  'dddddddd-0001-0001-0001-dddddddddddd',
  'cccccccc-0001-0001-0001-cccccccccccc',
  '22222222-2222-2222-2222-222222222222',
  'approved',
  'Enjoy!'
),
-- María approved Carlos's March booking
(
  'dddddddd-0002-0002-0002-dddddddddddd',
  'cccccccc-0002-0002-0002-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'approved',
  null
),
-- María declined Lucía's overlapping March booking
(
  'dddddddd-0003-0003-0003-dddddddddddd',
  'cccccccc-0004-0004-0004-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'declined',
  'Overlaps with Carlos''s approved booking. Try another week?'
);

-- =========================
-- 7. MANUAL CATEGORIES & ENTRIES
-- =========================

-- Category: Arrival
insert into manual_categories (id, home_id, name, icon, sort_order) values
(
  'eeeeeeee-0001-0001-0001-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Arrival',
  'door-open',
  0
);

-- Category: Appliances
insert into manual_categories (id, home_id, name, icon, sort_order) values
(
  'eeeeeeee-0002-0002-0002-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Appliances',
  'washing-machine',
  1
);

-- Entries under Arrival
insert into manual_entries (id, category_id, home_id, title, content, sort_order, created_by) values
(
  'ffffffff-0001-0001-0001-ffffffffffff',
  'eeeeeeee-0001-0001-0001-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Key Lockbox',
  'The key lockbox is on the left side of the front door. The code is 4-7-2-1. Please always return the key when you leave.',
  0,
  '11111111-1111-1111-1111-111111111111'
),
(
  'ffffffff-0002-0002-0002-ffffffffffff',
  'eeeeeeee-0001-0001-0001-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Wi-Fi',
  'Network: VillaMed-5G\nPassword: mediterr@nea2024',
  1,
  '11111111-1111-1111-1111-111111111111'
),
(
  'ffffffff-0003-0003-0003-ffffffffffff',
  'eeeeeeee-0001-0001-0001-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Parking',
  'There are two parking spots in the garage. The remote for the garage door is in the key lockbox. If you need a third spot, you can park on the street (blue zone, free on weekends).',
  2,
  '22222222-2222-2222-2222-222222222222'
);

-- Entries under Appliances
insert into manual_entries (id, category_id, home_id, title, content, sort_order, created_by) values
(
  'ffffffff-0004-0004-0004-ffffffffffff',
  'eeeeeeee-0002-0002-0002-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Washing Machine',
  'The washing machine is in the utility room behind the kitchen. Use the "Eco 40" programme for most loads. Detergent is in the cabinet above.',
  0,
  '11111111-1111-1111-1111-111111111111'
),
(
  'ffffffff-0005-0005-0005-ffffffffffff',
  'eeeeeeee-0002-0002-0002-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Pool Pump',
  'The pool pump runs automatically from 8am to 12pm. If the water looks cloudy, press the "Boost" button on the pump controller in the shed. Only run boost for 2 hours max.',
  1,
  '22222222-2222-2222-2222-222222222222'
);

-- =========================
-- 8. TASKS
-- =========================

insert into tasks (id, home_id, title, description, status, assign_type, assigned_to, created_by, due_date, is_recurring, recurrence_rule) values
-- Open task assigned to Lucía
(
  'aabbccdd-0001-0001-0001-aabbccddaabb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Buy new pool chemicals',
  'We are running low on chlorine tablets and pH reducer. Check the shed first — there might be some left.',
  'open',
  'member',
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '2026-03-10',
  false,
  null
),
-- In-progress task assigned to Carlos
(
  'aabbccdd-0002-0002-0002-aabbccddaabb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fix the garden gate latch',
  'The latch on the side garden gate is loose. Needs a new screw and maybe a new latch plate.',
  'in_progress',
  'member',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '2026-03-01',
  false,
  null
),
-- Done task
(
  'aabbccdd-0003-0003-0003-aabbccddaabb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Replace smoke detector batteries',
  'All three smoke detectors need new 9V batteries. Checked and replaced on Feb 20.',
  'done',
  'member',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '2026-02-20',
  false,
  null
),
-- Recurring task assigned to next visitor
(
  'aabbccdd-0004-0004-0004-aabbccddaabb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Take out recycling bins',
  'Put the blue (paper) and yellow (plastic) bins out on the street every Tuesday evening before 9pm. Bring them back Wednesday morning.',
  'open',
  'next_visitor',
  null,
  '11111111-1111-1111-1111-111111111111',
  null,
  true,
  'FREQ=WEEKLY;BYDAY=TU'
);

-- =========================
-- 9. ANNOUNCEMENTS & COMMENTS
-- =========================

-- Announcement 1: Pinned welcome message
insert into announcements (id, home_id, author_id, title, body, is_pinned) values
(
  '11aabb00-0001-0001-0001-11aabb001100',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Welcome to Villa Mediterránea!',
  'Hi everyone! I have set up this app so we can better coordinate our visits to the villa. Please check the House Manual section for arrival instructions, Wi-Fi details, and appliance guides. If anything is missing or outdated, let me know and I will update it. Looking forward to a great year!',
  true
);

-- Comment on announcement 1
insert into comments (id, announcement_id, author_id, body) values
(
  '22aabb00-0001-0001-0001-22aabb001100',
  '11aabb00-0001-0001-0001-11aabb001100',
  '22222222-2222-2222-2222-222222222222',
  'Great idea, María! I added the parking info and pool pump instructions to the manual.'
),
(
  '22aabb00-0002-0002-0002-22aabb002200',
  '11aabb00-0001-0001-0001-11aabb001100',
  '33333333-3333-3333-3333-333333333333',
  'Thanks for setting this up! Super helpful.'
);

-- Announcement 2: Maintenance update
insert into announcements (id, home_id, author_id, title, body, is_pinned) values
(
  '11aabb00-0002-0002-0002-11aabb002200',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Garden gate needs fixing',
  'Heads up — the side garden gate latch is broken. I have started fixing it but need to get a replacement part. In the meantime, please use the main entrance. I have created a task to track this.',
  false
);

-- Comment on announcement 2
insert into comments (id, announcement_id, author_id, body) values
(
  '22aabb00-0003-0003-0003-22aabb003300',
  '11aabb00-0002-0002-0002-11aabb002200',
  '11111111-1111-1111-1111-111111111111',
  'Thanks for the heads up, Carlos. Let me know if you need me to order the part.'
);

-- =========================
-- 10. NOTIFICATIONS
-- =========================

insert into notifications (id, user_id, home_id, type, title, body, reference_type, reference_id, is_read) values
-- Notify admins about Lucía's pending Easter booking
(
  'a1b2c3d4-0001-0001-0001-a1b2c3d40000',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'booking_request',
  'New booking request',
  'Lucía Fernández requested a booking for Apr 1–5.',
  'booking',
  'cccccccc-0003-0003-0003-cccccccccccc',
  false
),
(
  'a1b2c3d4-0002-0002-0002-a1b2c3d40000',
  '22222222-2222-2222-2222-222222222222',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'booking_request',
  'New booking request',
  'Lucía Fernández requested a booking for Apr 1–5.',
  'booking',
  'cccccccc-0003-0003-0003-cccccccccccc',
  false
),
-- Notify Lucía her March booking was declined
(
  'a1b2c3d4-0003-0003-0003-a1b2c3d40000',
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'booking_declined',
  'Booking declined',
  'Your booking for Mar 15–20 was declined. Reason: Overlaps with Carlos''s approved booking.',
  'booking',
  'cccccccc-0004-0004-0004-cccccccccccc',
  true
),
-- Notify Lucía about her assigned task
(
  'a1b2c3d4-0004-0004-0004-a1b2c3d40000',
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'task_assigned',
  'New task assigned to you',
  'María assigned you: Buy new pool chemicals (due Mar 10).',
  'task',
  'aabbccdd-0001-0001-0001-aabbccddaabb',
  false
),
-- Notify everyone about the welcome announcement
(
  'a1b2c3d4-0005-0005-0005-a1b2c3d40000',
  '22222222-2222-2222-2222-222222222222',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'announcement',
  'New announcement',
  'María posted: Welcome to Villa Mediterránea!',
  'announcement',
  '11aabb00-0001-0001-0001-11aabb001100',
  true
),
(
  'a1b2c3d4-0006-0006-0006-a1b2c3d40000',
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'announcement',
  'New announcement',
  'María posted: Welcome to Villa Mediterránea!',
  'announcement',
  '11aabb00-0001-0001-0001-11aabb001100',
  true
),
-- Notify María about Carlos's comment
(
  'a1b2c3d4-0007-0007-0007-a1b2c3d40000',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'comment',
  'New comment',
  'Carlos López commented on: Welcome to Villa Mediterránea!',
  'announcement',
  '11aabb00-0001-0001-0001-11aabb001100',
  true
);
