# Shared Family Home App — One-Pager

## The Problem

Many families share a vacation home, countryside house, or inherited property among several members. Coordinating who goes when, keeping the house in order, and communicating practical information (keys, appliances, local contacts) becomes chaotic — scattered across WhatsApp groups, spreadsheets, and verbal agreements. Conflicts arise, things break without anyone reporting them, and new partners or guests don't know the house rules.

## The Solution

A simple, purpose-built app where family members manage their shared home together — booking stays, following house rules, and keeping everything running smoothly without the friction.

## Core Features

### 1. Shared Calendar & Booking
- Visual calendar showing who has booked which dates
- **Booking requests with approval flow:** members submit a booking request, which must be approved by one or more admins (configurable — single admin approval or unanimous/majority among multiple admins)
- Conflict detection: warn when a request overlaps with an existing booking, allow or block depending on house capacity settings
- Support for multi-day stays, recurring bookings (e.g., "every August")
- Guest tagging — indicate how many people / who is coming
- Booking statuses: Pending → Approved / Declined, with optional reason for decline

### 2. House Manual & Instructions
- Permanent reference section: how to turn on the boiler, Wi-Fi password, alarm code, waste collection days, local emergency numbers
- Rich content: text, photos, short videos
- Organised by category (Arrival, Appliances, Garden, Local Area…)
- Editable by admins, viewable by all members

### 3. To-Do & Maintenance Lists
- Shared task list: things to fix, buy, or clean
- Assign tasks to specific members or to "whoever goes next"
- Status tracking (open → in progress → done)
- Optional photo proof of completion
- Recurring tasks (e.g., "drain pipes before winter every year")

### 4. Announcements & Notes
- Simple feed for family-wide updates ("The neighbour will mow the lawn on Thursdays", "Washing machine is broken")
- Pin important announcements
- Comment threads for discussion

## Roles & Permissions

| Role | Can book | Can edit manual | Can manage members | Can approve bookings |
|---|---|---|---|---|
| **Owner / Admin** | ✅ | ✅ | ✅ | ✅ (one or more admins required to approve) |
| **Member** | ✅ (request) | ❌ | ❌ | ❌ |
| **Guest** (temporary) | View only | ❌ | ❌ | ❌ |

A home can have **multiple admins**. The approval policy is configurable per home: require approval from **any one admin** or from **all admins**.

## Key Design Principles

- **Family-first, not corporate.** Warm, friendly tone and UI. This isn't a project management tool — it should feel like a shared family space.
- **Low friction.** Works for the tech-savvy cousin and the 70-year-old uncle alike. Minimal onboarding, clear navigation.
- **One home = one space.** Each "home" is an independent workspace with its own calendar, manual, tasks, and members. **Users can belong to multiple homes** and switch between them easily.
- **Multi-home support.** A single account gives access to all homes the user has been invited to — no separate logins.
- **Notifications without noise.** Smart defaults: notify on new bookings and urgent announcements, stay silent on minor edits.

## Target Users

Families (3–15 active members) who co-own or share access to a property — typically a holiday home, rural house, or inherited apartment. Common in Mediterranean and Northern European countries where multi-generational property sharing is culturally widespread.

## MVP Scope

For a first version, focus on:

1. Home creation & member invitations (via link or code)
2. Shared calendar with **booking requests and admin approval** (single-admin approval)
3. House manual (text + photos)
4. Basic to-do list
5. Push notifications for booking requests, approvals/declines, and announcements
6. Multi-home support (users can create or join multiple homes)

**Out of MVP:** multi-admin approval policies (unanimous/majority), recurring bookings, guest role, video in manual, recurring tasks.

## Business Model (Future)

Freemium approach:

- **Free tier:** 1 home, full features, unlimited members
- **Paid tier (TBD):** multiple homes, advanced features (to be defined later)

## Tech Considerations

- Mobile-first (iOS + Android), with optional web view
- Real-time sync for calendar and tasks
- Offline access for house manual (poor connectivity at rural homes)
- Simple auth: email/password or social login, plus invite links for onboarding family members
