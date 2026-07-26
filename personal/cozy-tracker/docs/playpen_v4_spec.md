# Playpen V4 — Refactor Specification

> **Formerly:** cozy-tracker  
> **New Name:** Playpen  
> **Vibe:** Crayons, Kirby, Nintendo—treating play with a Japanese sense of dignity, respecting the users while reveling in cuteness and joy.

---

## Vision

A mobile-first shared to-do app for couples. The core promise:

> **"Remember the little things, do them when you're ready, celebrate together."**

This is an **activation manager**, not a planner. It helps with:
- Capturing tasks before you forget them
- Seeing what you committed to today
- Pulling from your backlog when you have bandwidth
- Knowing what your partner is up to

---

## Core Mental Model

```
┌─────────────────────────────────────────────────────────────┐
│                        THE PEN                              │
│         (everything that needs doing, grouped by category)  │
│                                                             │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │ Grocery  │ │  Home    │ │ Fitness  │ │ Projects │ ...   │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │ Scheduled   │  │  Recurring  │  │   Pulled    │
   │  for today  │  │  (auto)     │  │  from Pen   │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           ▼
              ┌─────────────────────────┐
              │     TODAY'S FOCUS       │
              │   (what I'm doing)      │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌──────────────┐          ┌──────────────┐
     │   ☐ To Do    │          │   ☑ Done     │
     │  (still here)│          │  (greyed,    │
     │              │          │   but visible│
     └──────────────┘          └──────────────┘
                                      │
                              (after midnight)
                                      ▼
                            ┌──────────────┐
                            │ Done Archive │
                            │ (recoverable)│
                            └──────────────┘
```

**Key insight:** The Pen is the source of truth. Today's Focus is a filtered view. Items don't "leave" the Pen when scheduled—they just also appear in Focus. They only truly leave when marked done.

---

## User Stories

### P0 — Core Loop

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 1 | Add items to The Pen with a category | I capture tasks before I forget |
| 2 | See what's on my Focus for today | I know what I committed to |
| 3 | Pull an item from The Pen to today's Focus | I can decide "I'll do this today" |
| 4 | Check off items in Focus | I track my progress |
| 5 | See completed items on today's Focus (greyed) | We can celebrate "we did everything!" |
| 6 | Auto-roll uncompleted items to the next day | Nothing falls through the cracks |
| 7 | See an overdue badge on rolled items | I know something slipped |

### P0 — Shared Experience

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 8 | See my partner's claimed items | I know what they're handling |
| 9 | Claim an unclaimed item | I signal "I got this" |
| 10 | See claims reset on overdue items | Either of us can pick it up |
| 11 | Leave a daily message for my partner | They see a cute note when they open the app |
| 12 | Join a shared Playpen via invite code | We're connected |

### P1 — Categories & Grouping

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 13 | See The Pen grouped by category (Pens) | It's organized by context |
| 14 | Create new Pens with custom emoji | I can customize my categories |
| 15 | Delete or rename Pens | I can keep things tidy |
| 16 | Set a due date on a Pen item (optional) | I have soft deadlines when needed |

### P1 — Recurring Items

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 17 | Create recurring items (e.g., Gym M/W/F @ 6am) | Regular commitments auto-appear |
| 18 | See recurring items in The Pen with a recurrence badge | I can edit the recurrence |
| 19 | Have recurring items auto-appear in Focus on their days | I don't have to reschedule them |
| 20 | Pause a recurring item | I can take a break without deleting |

### P1 — Grocery Lens

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 21 | Add "Groceries" to a Focus day | I'm planning a grocery run |
| 22 | See all grocery items nested under the Groceries card | My shopping list is ready |
| 23 | Check off individual grocery items | They leave The Pen (done) |
| 24 | Leave items unchecked without penalty | I'll get them next time |

### P2 — Multi-Day Projects

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 25 | Create a multi-day project (e.g., Pottery) | I track things with multiple steps |
| 26 | See the project in The Pen (Projects category) | I can find and edit it |
| 27 | See the project on Focus for each relevant day | I know what step is today |
| 28 | Check off steps day by day | I track progress through the project |

### P2 — Recovery & Archive

| # | As a user, I want to... | So that... |
|---|-------------------------|------------|
| 29 | Uncheck a completed item to restore it | Quick mistakes are easily fixed |
| 30 | View the Done Archive | I can see what I've accomplished |
| 31 | Restore an item from Done Archive | Older mistakes are recoverable |

---

## Data Model (Simplified)

```sql
-- Playpen instance (shared workspace)
CREATE TABLE playpens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT DEFAULT 'Our Playpen',
    invite_code TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users in a playpen
CREATE TABLE playpen_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_emoji TEXT DEFAULT '🐷',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playpen_id, user_id)
);

-- Category groupings
CREATE TABLE pens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT,  -- hex for visual grouping
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- The core item
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE,
    pen_id UUID REFERENCES pens(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT NOT NULL,
    
    -- Scheduling
    focus_date DATE,              -- null = backlog only, date = on focus for that day
    due_date DATE,                -- optional soft deadline
    scheduled_time TIME,          -- optional time (for "Gym @ 6am")
    
    -- Recurrence
    recurrence_rule TEXT,         -- e.g., 'weekly:mon,wed,fri' or null
    recurrence_paused BOOLEAN DEFAULT FALSE,
    
    -- Multi-day projects
    is_project BOOLEAN DEFAULT FALSE,
    project_steps JSONB,          -- [{title, day_offset, completed}]
    project_start_date DATE,
    
    -- State
    claimed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,     -- null = not done
    original_focus_date DATE,     -- for tracking overdue (what day was it supposed to be?)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Daily partner messages
CREATE TABLE daily_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playpen_id, author_id, date)
);
```

---

## UI Structure (Mobile-First)

### Main Screen

```
┌─────────────────────────────────────┐
│  PLAYPEN                [GF avatar] │ ← Header + partner indicator
├─────────────────────────────────────┤
│                                     │
│ 💬 "if u spackle i give u kissy"   │ ← Daily note from partner
│                                     │
│ ═══════════════════════════════════ │
│                                     │
│ TODAY'S FOCUS              Feb 7   │
│ ┌─────────────────────────────────┐ │
│ │ ☐ Gym @ 6am          💪   [👤] │ │ ← Claimed by you
│ ├─────────────────────────────────┤ │
│ │ ☐ Call landlord ⚠️   📞        │ │ ← Overdue (was Feb 5)
│ ├─────────────────────────────────┤ │
│ │ ☐ Groceries          🛒        │ │
│ │    ○ eggs                       │ │ ← Nested grocery items
│ │    ○ milk                       │ │
│ │    ○ that cheese                │ │
│ ├─────────────────────────────────┤ │
│ │ ☑ Water plants       🏠   [👤] │ │ ← Done (greyed, strikethrough)
│ └─────────────────────────────────┘ │
│                                     │
│ ═══════════════════════════════════ │
│                                     │
│ THE PEN                   [Sort ▾] │
│ ┌─ 🛒 Groceries (3) ──────────────┐ │ ← Collapsed by default
│ └─────────────────────────────────┘ │
│ ┌─ 🏠 Home (5) ───────────────────┐ │
│ └─────────────────────────────────┘ │
│ ┌─ 💪 Fitness (1) ────────────────┐ │ ← Recurring gym lives here
│ └─────────────────────────────────┘ │
│ ┌─ 🎨 Projects (2) ───────────────┐ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│           [+ Add]          [⚙️]    │ ← Fixed bottom bar
└─────────────────────────────────────┘
```

### Interactions

| Action | Gesture | Result |
|--------|---------|--------|
| Check off item | Tap checkbox | Greyed out, stays in Focus |
| Undo completion | Tap checkbox again | Restored to unchecked |
| Claim item | Tap avatar slot | Your avatar appears |
| Pull to Focus | Swipe right on Pen item | Adds to today's Focus |
| Expand Pen category | Tap category row | Shows items inline |
| Quick add | Tap [+ Add] | Bottom sheet with title + Pen picker |
| View item details | Tap item | Full screen with all options |
| Delete item | Swipe left (with confirm) | Removed |
| Settings | Tap ⚙️ | Manage Pens, view Archive, etc. |

### First Open of Day

```
┌──────────────────────────────────────┐
│                                      │
│         Good morning!                │
│                                      │
│  Anything [Partner] should know?     │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ lots of meetings today           ││
│  └──────────────────────────────────┘│
│                                      │
│  [Skip]                [Send]        │
│                                      │
└──────────────────────────────────────┘
```

---

## What's CUT from V2/V3

| Feature | Reason |
|---------|--------|
| Chains/Flows | Replaced by simpler multi-day project cards |
| Listables table | Replaced by Pens (same idea, simpler name) |
| Notes vs Tasks distinction | Everything is just an "item" |
| Routines drawer | Inline recurrence config on items |
| Weekly calendar view | Just Today's Focus (mobile-first) |
| Assignment picker | Replaced by Claim (tap to grab) |
| Priority levels | Keeping it simple for MVP |
| Drag-and-drop scheduling | Swipe-to-focus is simpler on mobile |

---

## Migration from Existing Schema

| Old | New |
|-----|-----|
| `house_groups` | → `playpens` (rename) |
| `group_members` | → `playpen_members` (rename + simplify) |
| `cards` | → `items` (rename, flatten fields) |
| `listables` | → `pens` (rename) |
| `event_chains` + `chain_steps` | ❌ Delete (replaced by `project_steps` JSONB) |

**Migration approach:** Create new tables, migrate data, drop old tables. No breaking changes to auth.

---

## Starter Pens (Ship With These)

| Emoji | Name | Description |
|-------|------|-------------|
| 🛒 | Groceries | Shopping list items |
| 🏠 | Home | Repairs, chores, house stuff |
| 📞 | Calls | People to call/text back |
| 💪 | Fitness | Gym, runs, workouts |
| 📦 | Errands | Post office, returns, pickups |
| 🎨 | Projects | Pottery, crafts, hobbies |
| 🐷 | Someday | Vague "would be nice" stuff |

---

## Open Items for Implementation

1. **Rename project:** `cozy-tracker` → `playpen` (package.json, README, etc.)
2. **Database migration:** Write SQL to transform existing schema
3. **Component refactor:** Gut existing Weekly Board, rebuild as Focus view
4. **Mobile styling:** Ensure touch-friendly, single-column layout
5. **Testing:** Manual testing with real usage (you + GF)

---

## Success Criteria

> **Will my girlfriend with ADHD use it and will it make her life easier?**

Proxy metrics:
- [ ] She opens it at least once a day
- [ ] She adds items without prompting
- [ ] She checks things off (activation, not just capture)
- [ ] She sends you a daily note at least sometimes
- [ ] Neither of you says "I thought you were doing that"
