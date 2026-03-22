---
trigger: always_on
---

ANTIGRAVITY RULES INDEX
=======================

Quick navigation to all development rules for Radwa Platform

Last Updated: February 15, 2026

TABLE OF CONTENTS
-----------------

01 - Code Standards

- TypeScript configuration and usage
- Naming conventions for files, variables, functions
- File organization and structure
- Import/export patterns
- Comment guidelines
- Commit message format

02 - Component Rules

- Server Components vs Client Components
- When to use 'use client'
- Component structure patterns
- Props and TypeScript interfaces
- Error boundaries
- Component reusability

03 - API Rules

- API route structure
- Authentication checks
- Input validation with Zod
- Error handling patterns
- Response format standards
- Rate limiting

04 - Database Rules

- Supabase client usage (server vs client)
- Query optimization
- RLS (Row Level Security) policies
- Transaction handling
- Database migrations
- Index usage

05 - Styling Rules

- Tailwind CSS patterns
- Design system colors
- Responsive design (mobile-first)
- Shadcn UI component usage
- Accessibility

06 - Security Rules

- Authentication and authorization
- Input sanitization
- Environment variables
- API security
- Database security (RLS)
- Secret management

QUICK COMMANDS
--------------

Development:
  npm run dev

Type Checking:
  npm run type-check

Linting:
  npm run lint
  npm run lint:fix

Testing:
  npm run test
  npm run test:coverage

Building:
  npm run build

PRE-COMMIT CHECKLIST
--------------------

Before every commit, ensure:

  1. Run npm run type-check (no TypeScript errors)
  2. Run npm run lint (no linting errors)
  3. Test the feature manually in browser
  4. Check browser console for errors or warnings
  5. Remove all console.log statements
  6. Test on mobile viewport
  7. Test loading and error states
  8. Write a clear, descriptive commit message

COMMIT MESSAGE FORMAT
---------------------

Format:
  type: description

Types:
  feat     - New feature
  fix      - Bug fix
  docs     - Documentation changes
  style    - Code formatting (no logic change)
  refactor - Code restructuring (no feature/bug change)
  perf     - Performance improvements
  test     - Adding or updating tests
  chore    - Build, dependencies, or config changes

Examples:
  feat: add course enrollment flow
  fix: resolve video playback issue on Safari
  docs: update API authentication guide
  perf: optimize course listing database query
  refactor: extract validation logic to separate file

RELATED DOCUMENTATION
---------------------

Workflows:
  See WORKFLOWS.md for common development workflows like:

- Creating components
- Creating API routes
- Fixing bugs
- Adding features
- Optimizing performance

Issue Tracking:
  See ISSUE-LOG.md for bug documentation and resolution tracking

Project Documentation:
  See main /docs folder for complete project documentation including:

- Database schema
- API routes
- Component inventory
- Pages structure
- State management
- Deployment guide
- Testing guide

GETTING HELP
------------

If you encounter an issue:

  1. Check the relevant rule file in /docs/rules
  2. Review the main project documentation in /docs
  3. Search ISSUE-LOG.md for similar problems and solutions
  4. Check the codebase for similar implementations
  5. Ask the project lead

PHILOSOPHY
----------

This project follows these core principles:

- Server-first architecture (use Server Components by default)
- Type safety with strict TypeScript
- Mobile-first responsive design
- Performance optimization
- Security best practices
- Clean, maintainable code
