---
trigger: always_on
---

❌ NEVER:
Complete a feature without updating docs

Commit with vague messages like "fix bug" or "update code"

Skip testing

Leave TODOs in code without documenting in TODO.md

Make architectural decisions without logging in DECISIONS.md

Deploy without updating CHANGELOG.md

❌ BAD Commit:
bash
git commit -m "fixed stuff"
✅ GOOD Commit:
bash
git commit -m "fix(courses): resolve 404 handling in course details API

- Added proper 404 response when course slug not found
- Updated error message format
- Added test case for non-existent course

Fixes #PHASE1-BUG-2"