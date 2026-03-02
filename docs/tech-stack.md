# Tech Stack

## Core Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js (App Router) | SSR where needed, great DX, easy Vercel deploy |
| **Styling** | Tailwind CSS + shadcn/ui | Fast to build, consistent, accessible components |
| **Backend / API** | Supabase (Postgres + Edge Functions) | Auth, DB, real-time, storage — all in one |
| **Database** | Supabase Postgres | Full relational DB, Row Level Security for multi-tenancy |
| **Auth** | Supabase Auth | Email/password + Google/Apple social login, magic links for less tech-savvy family members |
| **File Storage** | Supabase Storage | Manual photos, task proof images, home covers |
| **Real-time** | Supabase Realtime | Live calendar updates, new announcements, booking status changes |
| **Hosting** | Vercel | Zero-config Next.js deploys, edge network, preview deploys for PRs |
| **Push Notifications** | Supabase Edge Functions + web push (or Expo push for mobile later) | Triggered by DB webhooks on booking/task/announcement changes |

## How Supabase Covers the Complex Stuff

### Row Level Security (RLS) = Multi-Tenancy
RLS policies enforce that users only see data for homes they belong to. No custom middleware needed — the database itself handles access control.

```sql
-- Example: members can only see bookings for their homes
CREATE POLICY "Members see own home bookings"
ON bookings FOR SELECT
USING (
  home_id IN (
    SELECT home_id FROM home_members
    WHERE user_id = auth.uid()
  )
);
```

### Edge Functions = Business Logic
Lightweight serverless functions for things that go beyond simple CRUD:

- **Booking approval flow** — validate approval policy (any admin vs all admins), update booking status, send notifications
- **Invite redemption** — validate code, create home_member record, mark invite as used
- **"Next visitor" task assignment** — when a booking is approved, auto-assign pending tasks
- **Notification dispatch** — fan out notifications to relevant members

### Realtime = Live Updates
Subscribe to changes on bookings, tasks, and announcements so all family members see updates instantly without refreshing. Particularly important for the shared calendar.

### Database Webhooks = Event Triggers
Trigger Edge Functions automatically when rows change:

- New booking inserted → notify admins
- Booking approved → notify requester + assign "next visitor" tasks
- New announcement → notify all home members

## Project Structure

```
/app
  /(auth)
    /login
    /signup
    /invite/[code]
  /(dashboard)
    /homes                    # home switcher / list
    /home/[homeId]
      /calendar               # shared calendar + bookings
      /manual                 # house manual by category
      /tasks                  # to-do list
      /announcements          # feed + comments
      /settings               # members, roles, approval policy
/lib
  /supabase
    client.ts                 # Supabase browser client
    server.ts                 # Supabase server client (SSR)
    middleware.ts              # Auth session refresh
  /hooks                      # useBookings, useTasks, useRealtime...
  /types                      # Generated from Supabase schema
/supabase
  /migrations                 # SQL migrations (schema + RLS policies)
  /functions                  # Edge Functions (approve-booking, redeem-invite...)
  /seed.sql                   # Dev seed data
```

## What You Get for Free (No Extra Services)

- **Auth + social login** — Supabase Auth
- **File uploads with access control** — Supabase Storage + policies
- **Real-time subscriptions** — Supabase Realtime
- **Auto-generated TypeScript types** — `supabase gen types`
- **DB migrations** — Supabase CLI
- **Local dev environment** — `supabase start` runs everything locally in Docker

## What You Might Add Later

| Need | Tool | When |
|---|---|---|
| **Native mobile** | React Native / Expo (reuse logic, new UI) or Capacitor (wrap Next.js) | When users demand a native app |
| **Email notifications** | Resend or Supabase + SMTP | When push isn't enough |
| **Analytics** | PostHog (self-hostable, privacy-friendly) | When you want usage insights |
| **Payments (freemium)** | Stripe + Supabase webhook | When you introduce the paid tier |
| **Offline manual** | Service worker + local cache | When rural connectivity is a real issue |
| **Search** | Postgres full-text search (already in Supabase) | When manuals grow large |

## Key Decisions Summary

- **No separate backend server.** Supabase handles auth, DB, storage, real-time, and edge functions. Next.js server actions or route handlers cover anything else.
- **No ORM.** Use the Supabase JS client directly — it's typed, handles RLS, and supports real-time. Keeps the stack thin.
- **Mobile later.** Start web-only (responsive). The app works fine on phone browsers. Go native only if there's real demand.
- **Keep it boring.** No GraphQL, no microservices, no message queues. Postgres + Edge Functions + Next.js covers everything at this scale.
