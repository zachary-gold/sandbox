# V3 Feature Spec — Discussion Draft

> **Instructions**: Add your answers/comments directly below each question. 
> Use `> [YOUR RESPONSE]` format or just type inline.

---

## 1. Card Completion Flow

Currently, cards on the WeeklyBoard don't have an obvious "complete" action (just delete). The linked backlog items have checkboxes, but the parent card doesn't.

**Q1.1: How should card completion work?**
- [ ] Checkbox on the card itself
- [ ] "Mark Done" button
- [ ] Swipe gesture
- [ ] Other: ___

> YOUR ANSWER:

**Q1.2: What happens to completed cards?**
- [ ] Stay visible (struck through) for the day
- [ ] Disappear immediately
- [ ] Move to a "completed" section
- [ ] Other: ___

> YOUR ANSWER:

---

## 2. The Grocery Checklist Example

You described: *"When checked and changes are saved, they should be removed from the backlog. When re-opened and unchecked, they should be added back."*

**Q2.1: Explicit save vs. auto-save?**
Currently changes are immediate. Do you want:
- [ ] Keep auto-save (changes happen immediately)
- [ ] Add a "Save" button (batch changes)
- [ ] Auto-save but with undo toast

> YOUR ANSWER:

**Q2.2: What does unchecking a linked backlog item mean?**
If I check "eggs" then realize I grabbed the wrong carton and uncheck it:
- [ ] Eggs stay on this card only (I'll still get them today)
- [ ] Eggs return to backlog AND stay on this card
- [ ] Eggs return to backlog AND disappear from this card
- [ ] Other: ___

> YOUR ANSWER:

---

## 3. Friday Grocery Run Scenario

*"On Friday, user A goes to the grocery store and adds 'grocery store' to their day."*

**Q3.1: What is User A actually doing?**
- [ ] Moving the Saturday recurring instance to Friday
- [ ] Creating a new one-off grocery card for Friday (Saturday's still happens)
- [ ] Creating an ad-hoc trip not connected to the routine
- [ ] Other: ___

> YOUR ANSWER:

**Q3.2: Should recurring instances be reschedulable/movable?**
- [ ] Yes, drag to a different day
- [ ] No, delete and recreate
- [ ] Yes, but it creates a copy (original stays as "skipped")

> YOUR ANSWER:

---

## 4. Chain/Cycle Attachment

You mentioned: *"A user should be able to pick a cycle task from a dropdown when creating a new task."*

**Q4.1: Where does this dropdown appear?**
- [ ] On the card creation form (when adding to a day)
- [ ] On the backlog item creation form
- [ ] Both
- [ ] Somewhere else: ___

> YOUR ANSWER:

**Q4.2: What if you start mid-chain?** (e.g., just "fold laundry" without "wash")
- [ ] Skip earlier steps silently (start from selected step)
- [ ] Show a warning but allow it
- [ ] Always start chains from step 1
- [ ] Don't allow mid-chain starts

> YOUR ANSWER:

**Q4.3: How does the chain prompt trigger?**
Current: No visible "complete" action on cards.
- [ ] Add a "Complete" button that triggers the prompt
- [ ] Checking the card's checkbox triggers the prompt
- [ ] Other: ___

> YOUR ANSWER:

---

## 5. Tag-Linking Nuance

Current behavior: any backlog item with `#grocery` appears under any scheduled card with `#grocery`.

**Q5.1: Is tag-based linking sufficient?**
- [ ] Yes, tags work fine
- [ ] No, need explicit "this item belongs to this card" linking
- [ ] Hybrid: tags by default, but can explicitly link

> YOUR ANSWER:

**Q5.2: What if a card is tagged but shouldn't pull in backlog items?**
(e.g., "buy new grocery bags" is tagged #grocery but is itself a standalone task)
- [ ] Add an "opt-out" flag on cards
- [ ] Only certain card types pull in backlog (e.g., "activities" vs "tasks")
- [ ] This isn't a real problem, don't worry about it
- [ ] Other: ___

> YOUR ANSWER:

---

## 6. Time on Cards

You mentioned some cards need specific times (e.g., "return laptop via UPS at 2pm").

**Q6.1: Should time be optional on all cards?**
- [ ] Yes, any card can have a time
- [ ] Only certain types (appointments vs. tasks)
- [ ] Other: ___

> YOUR ANSWER:

**Q6.2: Should cards with times sort chronologically within a day?**
- [ ] Yes, time-based cards at top, then untimed cards
- [ ] Yes, all cards sorted by time (untimed at bottom)
- [ ] No, keep current order (creation time)

> YOUR ANSWER:

**Q6.3: For recurring routines with times, should instances show the time?**
- [ ] Yes, visually display the time on the card
- [ ] Yes, and sort by time
- [ ] No, time is just metadata

> YOUR ANSWER:

---

## Round 2: Follow-up Questions

Based on your answers, here are some clarifications:

---

### 8. List Items vs Tasks

You mentioned distinguishing "list items" (checkbox things pulled into tasks) from "tasks" (standalone cards).

**Q8.1: What determines if something is a list item vs a task?**
- [ ] Where it lives: backlog items are list items, scheduled cards are tasks
- [ ] How it was created: using the "+" button = list item, using "Add Card" = task
- [ ] Explicit choice: user picks "Add Note" vs "Add Task"
- [ ] Other: ___

> YOUR ANSWER:

**Q8.2: Can a list item become a task?**
Example: "return laptop via UPS" starts as a backlog note, but then gets scheduled with a date/time.
- [ ] Yes, adding a date/time promotes it to a task
- [ ] Yes, there's an explicit "Promote to Task" action
- [ ] No, they're fundamentally different and you'd create a new task

> YOUR ANSWER:

---

### 9. UI Organization — The Drawer Taxonomy

You suggested three concepts:
- **Routines** = recurring tasks (gym M/W/F)
- **Sequences** = chained task relationships (laundry → fold)
- **Note Groups** = tag-based groupings (grocery list)

**Q9.1: Should all three live in the same drawer, or separate locations?**
- [ ] Same drawer with tabs/sections
- [ ] Different buttons in the header
- [ ] Note Groups should be somewhere else (backlog header?)
- [ ] Other: ___

> YOUR ANSWER:

**Q9.2: Alternative naming ideas (pick favorites or suggest your own):**

| Current | Alt 1 | Alt 2 | Alt 3 |
|---------|-------|-------|-------|
| Routines | Habits | Repeats | Recurrings |
| Sequences | Chains | Workflows | Multi-steps |
| Note Groups | Tags | Categories | Lists |

> YOUR PREFERENCES:

---

### 10. Note Groups / Tags UI

You said tags should be "exposed as pill button options."

**Q10.1: Where should these pills appear?**
- [ ] In the backlog section header (filter by tag)
- [ ] As a selection when creating backlog items
- [ ] Both
- [ ] Other: ___

> YOUR ANSWER:

**Q10.2: Who manages tags?**
- [ ] Tags are created automatically when someone types #tagname
- [ ] Tags must be pre-created in the Note Groups manager
- [ ] Hybrid: auto-create, but can also manage/rename/delete in settings

> YOUR ANSWER:

---

### 11. Completed Cards Lifecycle

Cards stay visible but greyed when done. What about the next day?

**Q11.1: On day rollover, completed cards should:**
- [ ] Disappear (they served their purpose)
- [ ] Stay visible in a "completed" archive section
- [ ] Stay on that day's column forever (historical record)
- [ ] Other: ___

> YOUR ANSWER:

---

### 12. Ad-hoc Card → Tag Linking

When User A creates a Friday grocery trip (ad-hoc, not from the routine):

**Q12.1: How does it know to pull in #grocery items?**
- [ ] User types #grocery tag when creating the card
- [ ] User selects "grocery" from Note Groups dropdown
- [ ] Both work (tag typing or dropdown selection)
- [ ] Other: ___

> YOUR ANSWER:

---

### 13. Time Input UX

**Q13.1: How should users enter time?**
- [ ] Native time picker (click, scroll wheels)
- [ ] Text input like "2:30pm"
- [ ] Quick presets + custom (e.g., "Morning | Afternoon | Evening | Pick time")
- [ ] Other: ___

> YOUR ANSWER:

---

### 14. Backlog Item Carryover

You mentioned eggs should "carry over to any future grocery trip."

**Q14.1: Does this mean:**
- [ ] The item appears on ALL future cards with that tag until completed
- [ ] The item appears on the NEXT card with that tag only
- [ ] Both visible, but "stickier" on the card it was first added to

> YOUR ANSWER:

**Q14.2: If I check "eggs" on Friday but Saturday's grocery trip also shows eggs (since it's a recurring instance):**
- [ ] Checking on Friday removes from Saturday too (they're the same item)
- [ ] Each instance has its own checkbox state (confusing?)
- [ ] The item disappears from all trips once checked anywhere

> YOUR ANSWER:

---

### 15. Edge Case: Empty Sequences

If I create a "Laundry" sequence but the user just marks "Wash" done without continuing:

**Q15.1: What happens to uncompleted chain steps?**
- [ ] They sit in limbo (user must dismiss or complete)
- [ ] They auto-add to backlog after X time
- [ ] Nothing, user can restart the chain later
- [ ] Other: ___

> YOUR ANSWER:

---

## Summary Table (I'll fill after Round 2)

| Feature | Decision | Notes |
|---------|----------|-------|
| Card completion | "Mark Done" button, greyed out | |
| Completed visibility | Stay visible (greyed/struck) | |
| Unchecking linked item | Stays on card + returns to backlog | |
| Ad-hoc cards | Separate from recurring, no effect on routines | |
| Rescheduling | Delete and recreate | |
| Chain dropdown | Both card and backlog (tasks only) | |
| Mid-chain | Skip earlier steps | |
| Chain trigger | "Complete" button | |
| Tag management | Exposed as pills, "Note Groups" UI | |
| Time | Any card can have time, sorted chronologically | |
