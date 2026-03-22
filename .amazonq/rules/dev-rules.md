---
trigger: always_on
---

# Development Rules & Guidelines

**MANDATORY**: All developers (human or AI agents) MUST follow these rules.

---

## 📝 Rule #1: Documentation is NON-NEGOTIABLE

### You MUST update these files after EVERY work session:

#### 1. CHANGELOG.md
**Update Frequency:** After completing ANY feature/fix/change
**Format:**
```markdown
## [Version] - YYYY-MM-DD

### Added
- Feature description with file paths

### Changed
- What changed and why

### Fixed
- Bug description and solution

### Known Issues
- Any blockers or problems
Example:
## [0.1.0] - 2026-02-15

### Added
- **API Route**: `GET /api/courses` with pagination
  - File: `app/api/courses/route.ts`
  - Supports filters: category, level, search
  - Default limit: 12 items/page

### Known Issues
- ⚠️ Database is empty - needs seed data

2. IMPLEMENTATION-LOG.md
Update Frequency: Every 2-3 hours OR after completing a major task
What to log:

What you built (detailed)

Code decisions and why

Challenges faced and solutions

Performance notes

Testing results

Template:
2. IMPLEMENTATION-LOG.md
Update Frequency: Every 2-3 hours OR after completing a major task
What to log:

What you built (detailed)

Code decisions and why

Challenges faced and solutions

Performance notes

Testing results

Template:## YYYY-MM-DD - Session X: Task Name

### What was built:
- Detailed description
- File paths

### Code Structure:
```typescript
// Key code snippets
Decisions Made:
Decision 1: Why?

Decision 2: Why?

Challenges & Solutions:
❌ Issue: Description
✅ Solution: How you fixed it

Testing:
✅ Test 1 passed
❌ Test 2 failed - TODO: Fix X

---

#### 3. TODO.md
**Update Frequency:** IMMEDIATELY when:
- Starting a new task (mark as 🔄 In Progress)
- Completing a task (move to ✅ Completed)
- Discovering a new bug (add to 🔴 Critical)
- Blocking issue found (add 🚫 Blocked tag)

**Format:**
```markdown
## 🔴 Critical
- [ ] Task name (Blocked: Reason) [Assignee] [ETA]

## 🔄 In Progress
- [ ] Task name [Started: 2026-02-15 12:30]

## ✅ Completed
- [x] Task name *(Completed: 2026-02-15 14:00)*

4. DECISIONS.md (Optional but recommended)
Update Frequency: When making architectural decisions
Log:

Why you chose X over Y

Trade-offs considered

Future implications