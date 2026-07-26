# Instructions for Agents working in this Sandbox

Personal multi-project workspace. Keep Pops work and personal work separate under the folders below.

## Memory

Your memory is OptMem:
- The tool is `~/.optmem/memo`
- Your memories are in `~/.optmem/memory`

OptMem outlives every session, compaction, model and vendor change.
Without it you do not know who you are, or what was decided and tried.

### At startup: activating OptMem (mandatory)

Run `~/.optmem/memo wake` before any other tool call, in every session, and
then do exactly what it prints, to the end of its output.

### While working: register memories (mandatory)

Call `~/.optmem/memo note "<1 line, max 280 chars>"` whenever you learn
something new, or something worth keeping happens. That covers a task
worth real effort, a fact or insight the user teaches you, anything you
learn about their life (even indirectly), any event of lasting effect.

Do not register redundant memories.

If `~/.optmem/memo note` asks a compression: do it before your next action.

Never edit or delete anything under `~/.optmem/memory`: the tool manages it.

### When you need an old memory: search, or navigate

`~/.optmem/memo recall <regex>` searches every memory, word for word.

Your memories also form a binary tree: #0-1, #2-3 ... exist as one-line
summaries, pairs of those as #0-3, and so on -- every `#a-b` line wake
prints is one node of it. `~/.optmem/memo zoom <a-b>` opens a node into its
two halves, down to the raw memories.

### If you're a subagent: skip everything above

Parallel sessions on this machine are all you, and may all write memories.
A subagent is not: it must never run `memo`, because it cannot judge what
is already known, and its notes would arrive duplicated and incorrectly.
When you spawn one, write: `You are a subagent. Don't run memo.`

## Rules

### Workspace boundary

- When working in this sandbox workspace, only create/edit/delete project files under `~/sandbox`.
- Do not reach into `~/Documents/GitHub`, `~/projects`, `~/knowledge`, or other home paths unless the user explicitly expands scope.
- Exception: OptMem under `~/.optmem` is allowed for permanent agent memory (`memo wake` / `memo note` / etc.).

### Workstream map

- `pops/` — Pops work; `pops/product-os/` for Product OS.
- `personal/cozy-tracker/` — personal cozy tracker app.
- `personal/writing-editing/` — writing/editing work.
- `docs/knowledge-os-prd.md` — personal Knowledge OS PRD (not Product OS).
- Keep workstream artifacts in the matching folder; do not mix Pops and personal project files at the root.

### Hygiene

- No junk at root (no `hello.txt`, nested sandbox-in-sandbox, duplicate case studies).
- Prefer updating this AGENTS.md when new durable conventions appear in conversation.
- Do not commit unless asked.
