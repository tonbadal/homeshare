# Claude Code Prompt

Copy and paste this as your initial prompt in Claude Code, from the project root folder where you've placed the three documents.

---

I'm building a shared family home management app. Read the three documents in this folder:

1. **One-Pager** — product definition, features, MVP scope
2. **Data Model** — full entity-relationship model (Mermaid)
3. **Tech Stack** — architecture decisions, Supabase + Next.js

Build the full MVP based on these documents. Here's what I need:

## Step 1: Project Setup

- Initialise a Next.js project (App Router, TypeScript, Tailwind CSS)
- Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `shadcn/ui` components, `lucide-react`, `date-fns`
- Set up the project structure as described in the tech stack document
- Create a `.env.local.example` with the required Supabase env vars

## Step 2: Database

- Create all Supabase SQL migrations in `/supabase/migrations/` following the data model document exactly
- Include all tables, indexes, foreign keys, and enums
- Write RLS policies for every table scoped to home membership
- Create a seed file with sample data (1 home, 3 users with different roles, a few bookings in different statuses, some manual entries, tasks, and announcements)

## Step 3: Supabase Auth

- Set up Supabase auth with email/password and magic link support
- Create auth middleware for Next.js (session refresh on every request)
- Build login, signup, and invite redemption (`/invite/[code]`) pages
- Protect all dashboard routes behind auth

## Step 4: Core Features (build in this order)

### 4a. Home Management
- Home switcher in the sidebar/header for users with multiple homes
- Home creation flow (name, address, description, cover image)
- Member invitation (generate invite link with code)
- Settings page: manage members, roles, approval policy

### 4b. Shared Calendar & Bookings
- Monthly calendar view showing all approved bookings (colour-coded by member)
- Booking request form (date range picker, guest count, notes)
- Conflict detection (warn on overlapping dates)
- Admin approval/decline flow with optional reason
- Booking status visible on calendar (pending = striped/faded, approved = solid)

### 4c. House Manual
- Category sidebar + entry list layout
- Rich text content display (markdown)
- Photo attachments on entries
- Admin-only editing (inline edit or modal)

### 4d. Tasks / To-Do List
- Task list with status filters (open, in progress, done)
- Create task with title, description, assignment (member or "next visitor"), due date
- Status toggle (open → in progress → done)
- Photo proof upload on completion

### 4e. Announcements
- Feed of announcements (newest first)
- Pin/unpin for admins
- Comment threads on each announcement

## Step 5: Real-time & Notifications

- Subscribe to Supabase Realtime for bookings, tasks, and announcements
- Create a notifications table and in-app notification bell/dropdown
- Write Supabase Edge Functions (or database triggers) for:
  - New booking → notify admins
  - Booking approved/declined → notify requester
  - New announcement → notify all members
  - Task assigned → notify assignee

## Step 6: Polish

- Responsive design (mobile-first, works well on phone browsers)
- Loading states and error handling throughout
- Empty states with helpful messages ("No bookings yet — be the first to plan a trip!")
- Home cover image upload via Supabase Storage

## Constraints

- Use the Supabase JS client directly, no ORM
- Use `supabase gen types` output for TypeScript types (generate a types file based on the schema)
- Keep components simple and composable, use shadcn/ui where possible
- All business logic that goes beyond CRUD should live in Supabase Edge Functions or database triggers, not in Next.js API routes
- Use server components by default, client components only when interactivity is needed
- Write the code, don't explain it. Build the full thing.
