---
trigger: always_on
---


Commit Message Format (MANDATORY):
<type>(<scope>): <short description>

<detailed description>

<footer>
Types:

feat: New feature

fix: Bug fix

refactor: Code restructuring

docs: Documentation only

style: Formatting, no logic change

test: Adding tests

chore: Build/config changes

Example:
git commit -m "feat(auth): implement login API endpoint

- Added POST /api/auth/login with Supabase integration
- Validates email/password with Zod schema
- Returns JWT token on success
- Updates users.last_login timestamp

Files:
- app/api/auth/login/route.ts (new)
- lib/validations.ts (updated)

Closes #PHASE2-AUTH-1"
