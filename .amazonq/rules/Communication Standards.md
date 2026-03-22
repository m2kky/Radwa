---
trigger: always_on
---

When reporting progress:
text
✅ Completed: Feature X (3 hours)
🔄 In Progress: Feature Y (50% done, 2h remaining)
🚫 Blocked: Feature Z (Waiting for: API keys)
📝 Documentation: Updated (CHANGELOG, TODO, LOG)
When asking for clarification:
text
❓ Question: Should I implement X or Y?
📌 Context: User wants feature Z, but docs say...
🤔 Options:

  1. Option A (pros/cons)
  2. Option B (pros/cons)
🎯 Recommendation: Option A because...
🔥 EMERGENCY RULE
If you're stuck for more than 30 minutes:
⏸️ STOP coding

📝 Document the issue in IMPLEMENTATION-LOG.md

🚫 Mark task as Blocked in TODO.md

💬 Report to team/client immediately

🔄 Move to next task

DO NOT:
❌ Spend hours on a problem silently

❌ Implement hacky workarounds without documenting

❌ Skip documentation because "you'll do it later"

✅ Quick Reference Checklist
Every work session:

 Started? → Mark in TODO.md as 🔄

 Coding? → Add comments + commit regularly

 Progress? → Update IMPLEMENTATION-LOG.md

 Completed? → Update CHANGELOG.md + TODO.md

 Testing? → Document results

 Blocked? → Mark in TODO.md as 🚫

Every commit:

 Proper commit message format

 Related docs updated

 Code commented

Every phase completion:

 All 4 docs updated

 Tests documented

 Sign-off completed

Remember: Documentation is not optional. It's part of the development process.

Last Updated: 2026-02-15
Version: 1.0
