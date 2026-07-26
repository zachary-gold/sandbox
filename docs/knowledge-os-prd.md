# Knowledge OS - Product Requirements Document

**Author:** Zachary Gold + Claude
**Created:** 2025-01-10
**Status:** Draft

---

## 1. Overview

### 1.1 Vision
A personal "homepage for life" — a local-first knowledge management system where Claude acts as an active research partner. The system captures, organizes, and surfaces information across journaling, research, and reference materials.

### 1.2 Problem Statement
Knowledge is scattered across browser tabs, random notes, memory, and chat histories. There's no unified place to:
- Commission research and receive structured outputs
- Build an accumulating knowledge base over time
- Have an AI assistant that understands your personal context
- Review and approve AI-generated content before it becomes part of your knowledge base

### 1.3 Target User
**Primary:** Zachary Gold (single-user, personal tool)

**User Profile:**
- Knowledge worker who researches diverse topics
- Wants AI assistance but with human oversight
- Values local-first, owns-their-data approach
- Starting fresh with no existing PKM system

---

## 2. Goals & Success Metrics

### 2.1 Primary Goal
Build an accumulating knowledge base with meaningful, organized content that is regularly referenced and useful.

### 2.2 Success Metrics (1-month checkpoint)
| Metric | Target |
|--------|--------|
| Research outputs in vault | 10+ approved notes |
| Weekly vault interactions | 3+ sessions |
| Notes referenced in conversations | Regularly citing past research |
| Subjective: "Can I find things?" | Yes |

### 2.3 Non-Goals (MVP)
- **Mobile access** — Desktop-only is acceptable
- **Sharing/collaboration** — Single-user only
- **Real-time sync** — Local files, no cloud dependency
- **Custom UI development** — Leverage Obsidian's existing interface

---

## 3. User Stories

### 3.1 Core Research Workflow

**US-1: Request Research**
> As Zachary, I want to ask Claude to research a topic so that I receive a structured summary without doing the searching myself.

Acceptance Criteria:
- Can issue a natural language research request ("research X")
- Claude understands scope (quick lookup vs. deep dive)
- Research begins immediately in the current session

**US-2: Review Research Output**
> As Zachary, I want to review Claude's research output before it becomes part of my knowledge base so that I maintain quality control.

Acceptance Criteria:
- Research outputs land in a `drafts/` folder
- Can read outputs in Obsidian
- Can approve (move to knowledge base) or reject (delete/revise)
- Claude does not modify approved content without permission

**US-3: Iterative Research**
> As Zachary, I want to ask follow-up questions or request revisions on research so that I get exactly what I need.

Acceptance Criteria:
- Can reference a draft and ask for changes
- Claude can read the draft and revise it
- Revision replaces or appends to the draft

### 3.2 Knowledge Management

**US-4: Accumulate Knowledge**
> As Zachary, I want approved research to be organized in my vault so that I can find it later.

Acceptance Criteria:
- Approved notes have consistent formatting
- Notes include metadata (date, topic, sources)
- Notes are in appropriate folders

**US-5: Reference Past Research**
> As Zachary, I want Claude to be able to read my existing notes so that research builds on what I already know.

Acceptance Criteria:
- Claude can search the vault semantically
- Claude references existing notes in new research
- Claude avoids duplicating existing content

**US-6: Context Persistence**
> As Zachary, I want Claude to remember my preferences and context across sessions so that I don't repeat myself.

Acceptance Criteria:
- Preferences stored in memory graph
- Claude checks memory at session start
- Can update/delete memories as needed

### 3.3 Journaling (Future)

**US-7: Daily Notes**
> As Zachary, I want to capture daily thoughts and observations in a structured way.

Acceptance Criteria:
- Daily note template exists
- Easy to create new daily note
- Linked to relevant research/notes

### 3.4 Web Capture (Future)

**US-8: Capture Highlights**
> As Zachary, I want to save highlights from websites (Twitter, Reddit, etc.) to my vault.

Acceptance Criteria:
- Browser extension or bookmarklet
- Captures source URL, date, and selected text
- Lands in `highlights/` folder for processing

---

## 4. Functional Requirements

### 4.1 Research System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Claude can receive natural language research requests | P0 |
| FR-2 | Claude uses web search to gather information | P0 |
| FR-3 | Claude can read/fetch web pages for deeper content | P0 |
| FR-4 | Claude writes structured output to `research/drafts/` | P0 |
| FR-5 | Output includes sources with URLs | P0 |
| FR-6 | Claude can spawn sub-agents for parallel research | P1 |
| FR-7 | Claude can read existing vault notes for context | P1 |
| FR-8 | Semantic search across vault | P2 |

### 4.2 Knowledge Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9 | Consistent note template for research outputs | P0 |
| FR-10 | Folder structure matches specification | P0 |
| FR-11 | Metadata in frontmatter (date, tags, sources) | P1 |
| FR-12 | Backlinks between related notes | P2 |

### 4.3 Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-13 | Obsidian MCP server connected | P0 |
| FR-14 | Memory graph persists across sessions | P0 |
| FR-15 | CLAUDE.md includes session start instructions | P0 |

---

## 5. Technical Architecture

### 5.1 Components

```
┌─────────────────────────────────────────────────────────┐
│                     User (Zachary)                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Claude Code CLI                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Web Search  │  │  WebFetch   │  │  Task (Agents)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────┐
│   Memory MCP        │       │   Obsidian MCP Server   │
│   (preferences,     │       │   (vault read/write,    │
│    context)         │       │    semantic search)     │
└─────────────────────┘       └─────────────────────────┘
           │                               │
           ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────┐
│  ~/.claude/memory/  │       │  ~/knowledge/ (vault)   │
│  (JSON graph)       │       │  (Markdown files)       │
└─────────────────────┘       └─────────────────────────┘
```

### 5.2 Vault Structure

```
~/knowledge/
├── journal/              # Daily notes, personal entries
├── notes/                # General knowledge, approved content
├── research/
│   └── drafts/           # Claude outputs pending review
├── highlights/           # Web clippings (future)
├── templates/            # Note templates
└── .claude/              # Claude scratch space, logs
```

### 5.3 Dependencies

| Component | Source | Notes |
|-----------|--------|-------|
| Obsidian | obsidian.md | Already widely used, free |
| Local REST API Plugin | Obsidian community | Required for MCP |
| obsidian-mcp-tools | jacksteamdev/obsidian-mcp-tools | Semantic search, templates |
| Memory MCP | @modelcontextprotocol/server-memory | Already configured |

---

## 6. Implementation Phases

### Phase 1: Foundation (Session 1)
- [ ] Install Obsidian (if needed)
- [ ] Create vault at `~/knowledge/`
- [ ] Set up folder structure
- [ ] Install Local REST API plugin
- [ ] Configure Obsidian MCP server in Claude
- [ ] Create research output template
- [ ] Test: basic read/write via MCP

### Phase 2: Research Workflow (Session 1-2)
- [ ] Test end-to-end research flow
- [ ] Establish conventions for request → draft → approve
- [ ] Store conventions in memory
- [ ] Create 2-3 real research outputs

### Phase 3: Polish (Session 2-3)
- [ ] Refine templates based on usage
- [ ] Add sub-agent research patterns
- [ ] Document workflow in vault itself
- [ ] Set up journal template (optional)

### Phase 4: Enhancements (Future)
- [ ] Web clipping integration (Obsidian Web Clipper)
- [ ] Dashboard/notification concepts
- [ ] Readwise integration for highlights
- [ ] Mobile access if needed

---

## 7. Research Output Template

```markdown
---
created: {{date}}
type: research
status: draft
topic:
tags: []
sources: []
---

# {{title}}

## Summary
[2-3 sentence overview]

## Key Findings
- Finding 1
- Finding 2
- Finding 3

## Details
[Expanded information organized by subtopic]

## Sources
- [Source Title](URL) - Brief description
- [Source Title](URL) - Brief description

## Open Questions
- Questions that emerged during research

---
*Generated by Claude | Review status: pending*
```

---

## 8. Open Questions & Risks

### 8.1 Open Questions
1. **Vault location**: `~/knowledge/` or somewhere else?
2. **MCP server choice**: obsidian-mcp-tools vs simpler mcp-obsidian?
3. **Review workflow**: Move files manually, or have Claude do it on approval?

### 8.2 Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MCP server setup complexity | Medium | High | Start with simpler mcp-obsidian if needed |
| Research quality varies | Medium | Medium | Iterate on prompts/templates |
| Vault gets messy | Low | Medium | Establish conventions early |
| Semantic search not needed yet | Low | Low | Can defer, use simple file access |

---

## 9. Appendix

### 9.1 Related Documents
- Planning notes: `~/.claude/plans/flickering-mapping-parnas.md`

### 9.2 References
- [Obsidian](https://obsidian.md)
- [obsidian-mcp-tools](https://github.com/jacksteamdev/obsidian-mcp-tools)
- [mcp-obsidian](https://github.com/bitbonsai/mcp-obsidian)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

*Last updated: 2025-01-10*
