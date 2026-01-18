# Cozy Tracker V2 — Feature Specification

Based on our discussion, here is the implementation plan for the next phase of features.

---

## Overview of Changes

| Feature | Summary |
|---------|---------|
| **House Groups** | Replace `spouse_id` with a group membership model supporting 2-5 people |
| **Recurring Event Management** | Dedicated "Routines" drawer with full CRUD for templates |
| **Chained Events** | Prompt-based follow-up creation with configurable delays |
| **Backlog Enhancements** | Sorting, priority levels, optional due dates |
| **Task Assignment** | Assignable to "whoever", specific member, or "both" |

---

## 1. House Groups

### Concept
A **House Group** is a shared workspace for 2-5 people. Each user can belong to one group. The group owns the board, not an individual user.

### Data Model Changes

```sql
-- New: house_groups table
create table house_groups (
  id uuid default gen_random_uuid() primary key,
  name text default 'Our Home',
  invite_code text unique default gen_random_uuid()::text, -- For joining
  created_at timestamp with time zone default now()
);

-- New: group_members junction table
create table group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references house_groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member', -- 'admin' or 'member'
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- Update profiles table
alter table profiles drop column spouse_id; -- Deprecated
alter table profiles add column current_group_id uuid references house_groups(id);

-- Update boards table
alter table boards drop column owner_id; -- Deprecated
alter table boards add column group_id uuid references house_groups(id) on delete cascade;
```

### Joining Flow
1. **Create Group**: User creates a new group → gets an invite code.
2. **Join Group**: Another user enters the invite code → joins as a member.
3. **Settings UI**: Show group members, allow admin to remove members, regenerate invite code.

### RLS Policy Updates
- Boards: `group_id in (select group_id from group_members where user_id = auth.uid())`
- Cards: Same logic via board's `group_id`

---

## 2. Recurring Event Management (Routines)

### UI Location
A **drawer/panel** that slides down from the header, covering the Backlog section. Toggle via a "Routines" button.

### Card Template Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | text | e.g., "Gym" |
| `description` | text | Optional body text |
| `cadence` | text | UI: checkboxes for each day (M/T/W/T/F/S/S) → stored as `FREQ=WEEKLY;BYDAY=MO,WE,FR` |
| `time` | time | Optional (e.g., 11:30 AM) |
| `start_date` | date | When this routine begins |
| `end_date` | date | Nullable ("no end date") |
| `assigned_to` | uuid | References group member, nullable = "whoever" |
| `is_active` | boolean | Pause/resume without deleting |

### Data Model Changes

```sql
-- Update cards table for routine metadata
alter table cards add column time_of_day time;
alter table cards add column start_date date;
alter table cards add column end_date date;
alter table cards add column is_active boolean default true;
alter table cards add column assigned_to uuid references profiles(id); -- Nullable = whoever
```

### UI Components

```
┌───────────────────────────────────────────────────┐
│  🔄 Routines                               [Close] │
├───────────────────────────────────────────────────┤
│  + Add New Routine                                │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🏋️ Gym                           [Edit][🗑️] │  │
│  │ M W F • 11:30 AM                            │  │
│  │ 👤 Zach                                     │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🛒 Grocery Run                   [Edit][🗑️] │  │
│  │ Every Saturday • No time set                │  │
│  │ 👥 Whoever                                  │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🌙 Date Night (paused)           [Edit][🗑️] │  │
│  │ Every Friday • 7:00 PM                      │  │
│  │ ❤️ Both                                     │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

---

## 3. Chained Events

### Concept
When a task is completed, the user may be **prompted** to create a follow-up task. This is NOT automatic.

### Prompt Flow

When a chained task is completed, the user is prompted for each remaining step in sequence:

```
✔️ "Do Laundry" complete!

┌────────────────────────────────────────────────────┐
│ 🔗 Next in chain: "Fold Laundry"                   │
│    Suggested: 2 hours from now                     │
│                                                    │
│ [ Add to Backlog ]  [ Add to Today @ 4pm ]  [ Skip ]│
└────────────────────────────────────────────────────┘
```

| Action | Result |
|--------|--------|
| **Add to Backlog / Add to Today** | Creates that step → prompts for NEXT step |
| **Skip** | Skips that step (no card created) → prompts for NEXT step |
| **Skip on last step** | Closes prompt (chain complete) |

This allows users to selectively create only the follow-up tasks they need.

### Chain Template Model
Chains are defined as **templates** in the Routines drawer. Users can create a "Laundry Cycle" chain that defines the sequence.

```sql
-- New: event_chains table
create table event_chains (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references house_groups(id) on delete cascade not null,
  name text not null, -- e.g., "Laundry Cycle"
  created_at timestamp with time zone default now()
);

-- New: chain_steps table
create table chain_steps (
  id uuid default gen_random_uuid() primary key,
  chain_id uuid references event_chains(id) on delete cascade not null,
  step_order integer not null, -- 1, 2, 3...
  title text not null, -- e.g., "Wash", "Dry", "Fold"
  default_delay_hours integer, -- e.g., 2 hours later, null = user picks
  created_at timestamp with time zone default now()
);

-- Link cards to chains
alter table cards add column chain_id uuid references event_chains(id);
alter table cards add column chain_step integer; -- Current step in the chain
```

### How It Works
1. User creates "Laundry Cycle" chain with steps: Wash → Dry → Fold.
2. When creating a task, user can attach the `#laundry` tag OR select the chain directly.
3. On completion of "Wash", prompt appears with "Dry" options.
4. User picks: Backlog, Tomorrow @ time, or Skip.

### Alternative to Tags (Recommended)
Instead of relying on tags to trigger chains, use a **dropdown** when creating a task:
- "Is this part of a chain?" → [None] [Laundry Cycle] [Dishwasher Cycle]

This is more explicit and less error-prone than tag matching.

---

## 4. Backlog Enhancements

### New Fields

```sql
alter table cards add column priority text default 'normal'; -- 'high', 'normal', 'low'
alter table cards add column due_date date; -- Separate from calendar date
```

### Sorting Options

| Sort | Description |
|------|-------------|
| Date Added | Oldest first (default) |
| Due Date | Earliest due first, nulls at bottom |
| Priority | High → Normal → Low |
| Tag | Grouped by tag alphabetically |

### UI
A dropdown in the Backlog header:
```
Backlog ▾ [Sort: Date Added ▾]
```

Eventually: Drag-and-drop reordering (future enhancement, not V2).

---

## 5. Task Assignment

### Field

```sql
alter table cards add column assigned_to uuid references profiles(id); -- Nullable = whoever
alter table cards add column assigned_to_both boolean default false; -- If true, both people
```

### Assignment Options
| Option | `assigned_to` | `assigned_to_both` | Icon |
|--------|---------------|---------------------|------|
| Whoever | `null` | `false` | 👥 |
| [Person] | `{user_id}` | `false` | Avatar + Name |
| Both | `null` | `true` | ❤️ |

### Visual Treatment
- Small pill with avatar + first name (or heart for "both")
- Color subtle, not distracting

### Filtering
- "Show only my tasks" toggle in header
- Shows: My tasks + Whoever + Both
- Hides: Tasks assigned to other group members only

---

## Implementation Phases

### Phase 1: House Groups (Foundation)
- [ ] Create `house_groups` and `group_members` tables
- [ ] Update `profiles` to reference current group
- [ ] Update `boards` to be group-owned
- [ ] Build group creation/join UI in Settings
- [ ] Update RLS policies

### Phase 2: Assignment
- [ ] Add `assigned_to` and `assigned_to_both` to cards
- [ ] UI for assignment picker on card creation/edit
- [ ] Avatar + name pill display on cards
- [ ] "Only my tasks" filter toggle

### Phase 3: Backlog Enhancements
- [ ] Add `priority` and `due_date` to cards
- [ ] Sort dropdown in Backlog UI
- [ ] Simple priority selector (High/Normal/Low)

### Phase 4: Routines Drawer
- [ ] Add new fields to cards (`time_of_day`, `start_date`, `end_date`, `is_active`)
- [ ] Build Routines drawer component
- [ ] Template CRUD (create, view, edit, delete, pause)
- [ ] JIT generation updates to respect new fields

### Phase 5: Chained Events
- [ ] Create `event_chains` and `chain_steps` tables
- [ ] Chain template management in Routines drawer
- [ ] Completion prompt with follow-up options
- [ ] Chain selector when creating new tasks

### Phase 6: Drag-and-Drop Scheduling
- [ ] Add `@dnd-kit/core` and `@dnd-kit/sortable` libraries
- [ ] Make backlog items draggable
- [ ] Make day columns droppable targets
- [ ] On drop: schedule backlog item to that day (set `date` field)
- [ ] Visual drag preview and drop indicators

---

## Questions / Open Items

> [!NOTE]
> Please review and let me know if anything needs adjustment before I start implementing!

1. **Group Admin Powers**: Should admins be able to remove members, or just regenerate invite codes?
2. **Time Zones**: Should we store user timezone in profiles for consistent time display?
3. **Phase Priority**: Which phase should I start with? I recommend **Phase 1 (Groups)** since it's foundational.

---

*Ready to start when you are!*
