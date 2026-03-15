# Flow Your Home

A shared family home management app. Families that co-own a property use this to coordinate bookings, share house instructions, manage tasks, and communicate — all in one place.

## Features

### Shared Calendar

Monthly colour-coded calendar where members request stays. Each family member gets a unique colour so you can see at a glance who's booked when. Pending bookings appear faded; approved ones are solid. Admins approve or decline requests (with optional reason), and the requester is notified of the decision. The system detects date conflicts and warns before double-booking.

**Key components:** `BookingCalendar` (month grid with colour-coded day cells), `CreateBookingDialog` (date range, guest count, notes, conflict check), `BookingDetailSheet` (view details, approve/decline/cancel actions).

### House Manual

Categorised reference guide for everything about the property — Wi-Fi passwords, appliance instructions, boiler settings, parking info, and more. Each category has an icon and contains entries written in markdown with optional photo/video attachments. Admins create and edit categories and entries; all members can browse.

**Key components:** `ManualContent` (two-panel layout: category sidebar + entry list), `ManualEntryEditor` (markdown editor with media upload gallery).

### Tasks

To-do list for home maintenance and chores. Tasks have a title, description, assignee, due date, and status (open / in progress / done). Members can upload proof photos when completing a task. Tasks can be assigned to a specific member or flagged as "next visitor" for whoever visits next.

**Key components:** `TaskList` (filterable tabs by status, task cards with assignee avatar and due date), `CreateTaskDialog` (title, description, assign type, member picker, due date), `TaskDetailDialog` (full view with status transitions, media uploads, edit/delete).

### Announcements

A feed for home-wide communication. Any member can post; admins can pin important announcements to the top. Each announcement supports threaded comments. Authors and admins can edit or delete posts.

**Key components:** `AnnouncementFeed` (pinned-first sorted list with create dialog), `AnnouncementCard` (post with author, timestamp, pin badge, comment thread, action menu).

### Notifications

In-app notification bell with unread count badge. Notifications are automatically generated when bookings are requested/approved/declined, tasks are assigned, announcements are posted, and comments are added. Click a notification to navigate directly to the relevant item. Mark individual or all as read.

**Key component:** `NotificationList` (colour-coded by type with icons, relative timestamps, mark-as-read).

### Home Management

Multi-home support — a user can belong to several homes and switch between them via the sidebar. Each home has members with role-based access (owner / admin / member / guest). Admins manage settings, generate invite links, and control the booking approval policy (any admin or all admins must approve).

**Key components:** `HomeSettings` (home info editor, cover image upload, approval policy, member list with role management, invite link generator), `CreateHomeDialog` (name, address, description), `DashboardSidebar` (home switcher, navigation, notification bell, user menu).

### Real-time Updates

Live data synchronisation via Supabase Realtime. When another member submits a booking, completes a task, or posts an announcement, your view updates automatically without refreshing.

**Key hook:** `useRealtime` — generic hook that subscribes to Postgres changes on any table with optional filters and insert/update/delete callbacks.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react icons |
| Backend | Supabase — Postgres, Auth, Edge Functions, Realtime, Storage |
| Date handling | date-fns |
| Hosting | Vercel |

## Project Structure

```
app/
  (auth)/                    Public routes
    login/                   Magic-link or email/password login
    signup/                  Account registration
    invite/[code]/           Invite link redemption (sign up + auto-join home)
  auth/callback/             Supabase auth code exchange
  (dashboard)/               All authenticated routes
    homes/                   Home list, create new home
    home/[homeId]/
      layout.tsx             Sidebar + auth/membership check
      calendar/              Booking calendar
      manual/                House manual categories & entries
      tasks/                 Task list and management
      announcements/         Announcement feed with comments
      notifications/         Notification centre
      settings/              Home info, members, invites, approval policy

components/
  ui/                        shadcn/ui primitives (button, card, dialog, tabs, etc.)
  dashboard-sidebar.tsx      Navigation sidebar with home switcher
  booking-calendar.tsx       Month-view calendar grid
  create-booking-dialog.tsx  New booking form with conflict detection
  booking-detail-sheet.tsx   Booking details + approve/decline/cancel
  task-list.tsx              Filterable task cards
  create-task-dialog.tsx     New task form
  task-detail-dialog.tsx     Task details + status updates + media
  announcement-feed.tsx      Announcement list with create dialog
  announcement-card.tsx      Single announcement with comments
  manual-content.tsx         Category/entry browser
  manual-entry-editor.tsx    Entry editor with media upload
  home-settings.tsx          Home config, members, invites
  create-home-dialog.tsx     New home form
  notification-list.tsx      Notification feed
  login-form.tsx             Login form (magic link + password)
  signup-form.tsx            Registration form

lib/
  supabase/
    client.ts                Browser Supabase client
    server.ts                Server-side Supabase client (SSR)
    middleware.ts             Auth session refresh + route protection
  hooks/
    use-realtime.ts          Generic Realtime subscription hook
  types/
    database.types.ts        Auto-generated Supabase types
    index.ts                 App-level types (HomeWithRole, MemberWithProfile, etc.)
  utils/
    cn.ts                    Tailwind class merger (clsx + tailwind-merge)
    notifications.ts         Client-side notification creation helper

supabase/
  migrations/                SQL migration files (schema, RLS, triggers)
  functions/notify/          Edge Function for notification fanout
  seed.sql                   Development seed data
```

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles (linked 1:1 to `auth.users` via trigger) |
| `homes` | Properties with name, address, cover image, approval policy |
| `home_members` | Junction table — users ↔ homes with role (owner/admin/member/guest) |
| `invites` | Invite codes with role, expiry, and used flag |
| `bookings` | Stay requests with date range, guest count, status (pending/approved/declined/cancelled) |
| `booking_approvals` | Admin decisions on bookings (approved/declined with reason) |
| `manual_categories` | House manual sections with icon and sort order |
| `manual_entries` | Markdown entries within categories |
| `manual_entry_media` | Images/videos attached to manual entries |
| `tasks` | To-do items with assignee, status, due date |
| `task_media` | Proof/reference photos attached to tasks |
| `announcements` | Home-wide posts with pin support |
| `comments` | Threaded comments on announcements |
| `notifications` | Per-user notifications with type, read status, and polymorphic reference |

### Security

Every table has Row-Level Security (RLS) enabled. All policies are scoped through `home_members` — a user can only access data for homes they belong to. Three helper functions (`is_member_of`, `is_admin_of`, `is_owner_of`) keep policies concise.

### Roles & Permissions

| Role | Calendar | Manual | Tasks | Announcements | Settings | Members |
|---|---|---|---|---|---|---|
| **Owner** | Full access | Full access | Full access | Full access | Full access | Add/remove/change roles |
| **Admin** | Approve/decline bookings | Create/edit entries | Create/assign tasks | Pin/edit/delete any | Edit home info | Add/remove members |
| **Member** | Request bookings | View | Create/update own | Post and comment | View | View |
| **Guest** | View | View | View | View | — | — |

## Auth Flow

1. **Login** — Magic link (email OTP, preferred) or email/password
2. **Signup** — Email, password, display name. A database trigger auto-creates the profile row
3. **Invite** — Admin generates a link at `/invite/[code]`. Recipient signs up or logs in, then auto-joins the home with the specified role
4. **Session** — Middleware refreshes the Supabase session on every request and redirects unauthenticated users to `/login`

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`npm install -g supabase`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start local Supabase

Make sure Docker is running, then:

```bash
npx supabase start
```

This starts a local Supabase instance and prints your local credentials. Note the **API URL**, **anon key**, and **service_role key**.

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the values from step 2:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

### 4. Run migrations and seed data

```bash
npx supabase db reset
```

This creates all tables, RLS policies, triggers, and loads sample data.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seed Data

After `npx supabase db reset`, the database contains:

| User | Email | Password | Role |
|---|---|---|---|
| Maria Garcia | maria@example.com | password123 | Owner |
| Carlos Lopez | carlos@example.com | password123 | Admin |
| Lucia Fernandez | lucia@example.com | password123 | Member |

Plus one home ("Villa Mediterranea") with sample bookings, manual entries, tasks, announcements, and notifications.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx supabase start` | Start local Supabase (Docker required) |
| `npx supabase stop` | Stop local Supabase |
| `npx supabase db reset` | Reset DB, re-run migrations + seed |
| `npx supabase gen types typescript --local > lib/types/database.types.ts` | Regenerate TypeScript types from schema |
| `npx supabase functions serve` | Run Edge Functions locally |

## Deploying to Production

1. Create a [Supabase project](https://supabase.com/dashboard)
2. Run migrations against production: `npx supabase db push`
3. Deploy to [Vercel](https://vercel.com/) and set the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
