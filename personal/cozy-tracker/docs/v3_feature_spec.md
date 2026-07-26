# Cozy Tracker V3 — Feature Specification

## Vision

A shared task manager for families/couples that handles:
- **Backlog**: Mental overhead of things to eventually do (grouped by tags)
- **Scheduled Tasks**: Specific appointments with dates/times
- **Routines**: Recurring commitments (daily/weekly patterns)
- **Flows**: Chained tasks that generate follow-ups (laundry → fold)
- **Listables**: Tag-based groupings that pull notes into tasks (grocery list)

---

## Terminology

| Term | Definition | Data |
|------|------------|------|
| **Note** | Backlog item with tag, pulled into tasks | `item_type: 'note'`, requires `listable_id` |
| **Task** | Standalone card with optional date/time | `item_type: 'task'` |
| **Routine** | Recurring task pattern | `is_recurring_template: true` |
| **Flow** | Chained sequence | `event_chains` + `chain_steps` tables |
| **Listable** | Tag group that collects notes | New `listables` table |

---

## UI Architecture

### Header (3 Drawers)
```
[Avatar] Cozy Daily     [Routines 🔄] [Flows 🔗] [Listables 🏷️] [Settings ⚙️] [Logout]
```

### Backlog Section
```
┌────────────────────────────────────────────────┐
│ BACKLOG                    [All ▼] [+ Note] [+ Task]     │
│ ┌─────────────────────────────────────────────┐│
│ │ [grocery] [home] [errands]  ← filter pills  ││
│ └─────────────────────────────────────────────┘│
│ ○ get milk                        #grocery    │
│ ○ fix sink                        #home       │
│ □ Return laptop (task)            12/20       │
└────────────────────────────────────────────────┘
```

### Weekly Board Card
```
┌──────────────────────────────────┐
│ Grocery Store          9:30 AM  │
│ #grocery                         │
│ ─────────────────────────────── │
│ ☐ milk                          │
│ ☐ eggs                          │
│ ☑ bread (struck)                │
│ ─────────────────────────────── │
│ [Mark Done]              [🗑️]    │
└──────────────────────────────────┘
```

---

## Data Model Changes

### New Table: `listables`
```sql
CREATE TABLE listables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES house_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,           -- "grocery", "home", "errands"
    color TEXT,                   -- hex color for pill
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modify: `cards` table
```sql
ALTER TABLE cards ADD COLUMN item_type TEXT DEFAULT 'task';  -- 'note' | 'task'
ALTER TABLE cards ADD COLUMN listable_id UUID REFERENCES listables(id);
ALTER TABLE cards ADD COLUMN scheduled_time TIME;
ALTER TABLE cards ADD COLUMN completed_at TIMESTAMPTZ;  -- null = not done
```

### Modify: `chain_steps`
```sql
ALTER TABLE chain_steps ADD COLUMN pending_since TIMESTAMPTZ;  -- for limbo tracking
```

---

## Behavior Specifications

### Card Completion
| Action | Effect |
|--------|--------|
| Click "Mark Done" | Sets `completed_at`, card greys out |
| Card stays on day | Forever (historical record) |
| If Flow-linked | Triggers next-step prompt |

### Note Linking
| Scenario | Behavior |
|----------|----------|
| Note created with #grocery | Appears on ALL cards with `listable_id` = grocery |
| Check note on card | Sets `status: 'done'`, removed from all cards |
| Uncheck note | Sets `status: 'todo'`, back on current + future cards |

### Flow Completion
| Step | Action |
|------|--------|
| User marks task done | If `chain_id` set, check for next step |
| Next step exists | Show prompt: "Add to Backlog / Add to Today / Skip" |
| User skips | Step stays in `chain_steps` with `pending_since` set |
| User adds | Creates new card with next step's details |

---

## Implementation Phases

### Phase 1: Card Completion ✅ Foundation
**Goal**: Users can mark cards done, see them greyed out

| File | Change |
|------|--------|
| `v3_phase1.sql` | Add `completed_at` column to cards |
| `WeeklyBoard.tsx` | Add "Mark Done" button to cards |
| `Card.tsx` or inline | Greyed/opacity styling when `completed_at` set |
| `useDatabase.ts` | Add `completeCard(id)` function |

**Acceptance**:
- [ ] "Mark Done" button visible on cards
- [ ] Clicking greys out the card
- [ ] Completed cards stay visible on their day
- [ ] Completed cards don't reappear after refresh

---

### Phase 2: Time on Cards
**Goal**: Cards can have scheduled times, sorted chronologically

| File | Change |
|------|--------|
| `v3_phase2.sql` | Add `scheduled_time` column to cards |
| `WeeklyBoard.tsx` | Time input in add form, display time on cards |
| `CardEditModal.tsx` | Add time picker field |
| `WeeklyBoard.tsx` | Sort cards: timed first (chronological), then untimed |

**Acceptance**:
- [ ] Can set time when creating/editing cards
- [ ] Time displays on card (e.g., "9:30 AM")
- [ ] Cards sorted by time within each day column

---

### Phase 3: Listables Manager
**Goal**: Pre-create tags, filter backlog by tag

| File | Change |
|------|--------|
| `v3_phase3.sql` | Create `listables` table, add `listable_id` to cards |
| `ListablesDrawer.tsx` | New drawer component for CRUD |
| `useListables.ts` | New hook for listables data |
| `App.tsx` | Add Listables button to header |
| `Backlog.tsx` | Add filter pills, listable selector on items |

**Acceptance**:
- [ ] Can create/edit/delete listables in drawer
- [ ] Backlog shows filter pills
- [ ] Can assign listable to notes
- [ ] Filtering works

---

### Phase 4: Notes vs Tasks
**Goal**: Backlog supports two item types

| File | Change |
|------|--------|
| `v3_phase4.sql` | Add `item_type` column to cards |
| `Backlog.tsx` | Toggle for "Add Note" vs "Add Task" |
| `Backlog.tsx` | Notes require listable, tasks optional |
| `WeeklyBoard.tsx` | Only "Add Task" (no notes on schedule) |

**Acceptance**:
- [ ] Backlog has "Add Note" and "Add Task" buttons
- [ ] Notes require listable tag selection
- [ ] Tasks can optionally have listable
- [ ] Weekly board only allows tasks

---

### Phase 5: Note Linking to Cards
**Goal**: Notes with matching listable appear inside cards

| File | Change |
|------|--------|
| `WeeklyBoard.tsx` | Query notes by `listable_id` matching card's |
| `WeeklyBoard.tsx` | Render notes as checkboxes inside card |
| `useDatabase.ts` | Update note status on check/uncheck |

**Acceptance**:
- [ ] Card with #grocery shows all #grocery notes
- [ ] Checking note marks it done everywhere
- [ ] Unchecking restores to all matching cards

---

### Phase 6: Flow Completion Prompt
**Goal**: Completing a flow-linked task triggers next step

| File | Change |
|------|--------|
| `useDatabase.ts` | Check for `chain_id` on completion |
| `App.tsx` | State for showing `ChainPrompt` |
| `ChainPrompt.tsx` | Already exists, wire to completion flow |
| `useChains.ts` | Add `getPendingSteps()` for limbo tracking |

**Acceptance**:
- [ ] Completing flow-linked task shows prompt
- [ ] "Add to Backlog" creates backlog task
- [ ] "Add to Today" creates today's task
- [ ] "Skip" marks step as pending/limbo

---

### Phase 7: UI Separation
**Goal**: Split Routines drawer, add Flows drawer

| File | Change |
|------|--------|
| `RoutinesDrawer.tsx` | Remove ChainManager section |
| `FlowsDrawer.tsx` | New drawer with ChainManager |
| `App.tsx` | Add Flows button, render FlowsDrawer |

**Acceptance**:
- [ ] Three separate header buttons
- [ ] Each drawer opens independently
- [ ] Existing functionality preserved

---

## Open Questions

1. **Limbo UI**: Where do pending/skipped flow steps appear?
   - Option A: Badge on Flows button ("2 pending")
   - Option B: Section in Backlog
   - Option C: Notification/toast

2. **Note promotion**: When adding date to note, should it:
   - Move to scheduled (remove from backlog)?
   - Copy to scheduled (keep in backlog)?

3. **Routine + Listable**: Can a routine template have a listable tag?
   - If yes, all instances would pull in notes

---

## Migration Path

All changes are additive (no breaking changes):
1. New columns have defaults
2. Existing cards become `item_type: 'task'`
3. Existing behavior unchanged until new features enabled
