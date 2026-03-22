---
trigger: always_on
---

CODE STANDARDS
==============

Standards for writing consistent, maintainable code in the Radwa Platform

Last Updated: February 15, 2026

TYPESCRIPT CONFIGURATION
------------------------

The project uses strict TypeScript configuration:

- strict: true
- noImplicitAny: true
- strictNullChecks: true
- noUnusedLocals: true
- noUnusedParameters: true

Always use explicit types. Never use 'any' type.

Good example:
  function calculatePrice(amount: number, tax: number): number {
    return amount * (1 + tax)
  }

  interface User {
    id: string
    name: string
    email: string
  }

Bad example:
  function process(data: any) {
    return data.something
  }

If the type is truly unknown, use 'unknown' instead of 'any':
  function process(data: unknown) {
    if (typeof data === 'object' && data !== null) {
      // Type narrowing here
    }
  }

NAMING CONVENTIONS
------------------

Files:
  Use kebab-case for all files
  Good: user-profile.tsx, course-card.tsx, format-date.ts
  Bad: UserProfile.tsx, courseCard.tsx, formatDate.ts

  Exception: Next.js convention files (page.tsx, layout.tsx, route.ts)

Variables:
  Use camelCase
  const userName = 'John'
  const courseList = []
  const totalPrice = 500

Functions:
  Use camelCase
  function getUserData() {}
  function calculateTotal() {}
  function formatDate() {}

Components:
  Use PascalCase
  function UserProfile() {}
  function CourseCard() {}
  function EnrollmentButton() {}

Constants:
  Use SCREAMING_SNAKE_CASE
  const MAX_FILE_SIZE = 5 *1024* 1024
  const API_BASE_URL = '<https://api.example.com>'
  const DEFAULT_TIMEOUT = 30000

Boolean variables:
  Prefix with is, has, or should
  const isLoading = true
  const hasAccess = false
  const shouldRender = true
  const canEdit = false

Interfaces and Types:
  Use PascalCase
  interface User { }
  type CourseStatus = 'draft' | 'published'
  
  For component props, suffix with 'Props'
  interface UserProfileProps {
    userId: string
    showActions?: boolean
  }

Event handlers:
  Prefix with 'on'
  interface ButtonProps {
    onClick?: () => void
    onHover?: () => void
    onSubmit?: () => void
  }

FILE ORGANIZATION
-----------------

Project structure:

app/
  Contains all Next.js pages and API routes
  (public)/         Public pages (no auth required)
  (auth)/           Authentication pages
  dashboard/        Student dashboard pages
  admin/            Admin dashboard pages
  api/              API route handlers

components/
  ui/               Shadcn UI components (do not modify these)
  features/         Feature-specific business components
  sections/         Reusable page sections
  forms/            Form components
  dashboard/        Dashboard-specific components
  shared/           Shared utility components

lib/
  supabase/         Supabase client configurations
  utils/            Utility functions
  hooks/            Custom React hooks
  stores/           Zustand state stores
  validations/      Zod validation schemas

types/
  Global TypeScript type definitions

public/
  Static assets (images, fonts, etc)

docs/
  Project documentation and rules

IMPORT ORDER
------------

Organize imports in this order:

1. React and Next.js imports
2. External library imports
3. Internal utility imports
4. Component imports
5. Type imports
6. Style imports (if any)

Example:
  // React and Next.js
  import { useState, useEffect } from 'react'
  import { useRouter } from 'next/navigation'
  import Image from 'next/image'
  import Link from 'next/link'

  // External libraries
  import { z } from 'zod'
  import { format } from 'date-fns'
  import { useForm } from 'react-hook-form'

  // Internal utilities
  import { cn } from '@/lib/utils'
  import { createClient } from '@/lib/supabase/client'

  // Components
  import { Button } from '@/components/ui/button'
  import { CourseCard } from '@/components/features/course-card'

  // Types
  import type { Course } from '@/types/course'

EXPORT PATTERNS
---------------

For utility functions:
  Use named exports
  export function formatDate() {}
  export function formatPrice() {}

For React components:
  Use default export
  export default function UserProfile() {}

Export types alongside components:
  export interface UserProfileProps {
    userId: string
  }
  
  export default function UserProfile(props: UserProfileProps) {
    return <div>...</div>
  }

CODE FORMATTING
---------------

Use clear, readable formatting. Break long chains into multiple lines.

Good:
  const courses = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

Bad:
  const courses = await supabase.from('courses').select('*').eq('status', 'published').order('created_at', { ascending: false })

Use destructuring with clear names:
  const { data: courses, error } = await fetchCourses()

Avoid unclear variable names:
  const res = await fetchCourses()
  const d = res.data

COMMENTS
--------

Write comments to explain WHY, not WHAT.

Good comment:
  // Fetch courses in parallel to reduce total wait time
  const [courses, instructors] = await Promise.all([
    fetchCourses(),
    fetchInstructors()
  ])

Bad comment:
  // Fetch courses
  const courses = await fetchCourses()

Use JSDoc for complex functions:
  /**

- Calculates installment payment schedule
- @param amount - Total course price in USD
- @param plan - Number of installments (2 or 4)
- @returns Array of payment objects with due dates and amounts
   */
  function calculateInstallments(amount: number, plan: 2 | 4) {
    // implementation
  }

Use TODO comments with assignee:
  // TODO(antigravity): Implement email notification after enrollment
  // TODO: Add error handling for network failures

ERROR HANDLING
--------------

Always handle errors explicitly. Never leave try-catch blocks empty.

Good:
  try {
    const result = await apiCall()
    return result
  } catch (error) {
    if (error instanceof ValidationError) {
      toast.error('Invalid data provided')
    } else if (error instanceof NetworkError) {
      toast.error('Check your internet connection')
    } else {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

Bad (silent failure):
  try {
    await apiCall()
  } catch (error) {
    // Empty catch block - never do this
  }

Bad (generic error):
  try {
    await apiCall()
  } catch (error) {
    toast.error('Error') // Too generic
  }

DEPENDENCIES
------------

Before adding any new npm package, ask:

  1. Is it absolutely necessary? Can we build it ourselves?
  2. Is it actively maintained?
  3. Does it have TypeScript support?
  4. What is the bundle size impact?
  5. Are there lighter alternatives?

Install packages with exact versions:
  npm install package-name --save-exact

Approved dependencies:
  Core: next, react, react-dom, typescript
  UI: @radix-ui packages (via Shadcn), tailwindcss, lucide-react
  Forms: react-hook-form, zod, @hookform/resolvers
  Database: @supabase/supabase-js, @supabase/auth-helpers-nextjs
  State: zustand (if needed)
  Utilities: date-fns, clsx, tailwind-merge

Avoid these (we have better alternatives):
  moment.js - Use date-fns instead
  lodash - Use native JavaScript methods
  axios - Use native fetch API
  Redux - Use Zustand or React Context

COMMIT MESSAGES
---------------

Format:
  type: brief description of change

Types:
  feat - New feature for the user
  fix - Bug fix
  docs - Documentation changes only
  style - Code formatting, missing semicolons, etc (no logic change)
  refactor - Code restructuring without changing functionality
  perf - Performance improvements
  test - Adding or updating tests
  chore - Changes to build process, dependencies, or configuration

Good commit messages:
  feat: add course enrollment flow with payment
  fix: resolve video playback issue on Safari browser
  docs: update API authentication documentation
  perf: optimize database queries for course listing
  refactor: extract form validation logic into separate file

Bad commit messages:
  fixed stuff
  updates
  WIP
  changes
  minor fixes

For complex changes, add a body:
  feat: add installment payment option

- Add 2 and 4 installment payment plans
- Calculate payment schedule automatically
- Integrate with Paymob API for payments
- Send confirmation email to user

  Closes #123

PRE-COMMIT CHECKLIST
--------------------

Before committing any code:

  1. Run npm run type-check - Fix all TypeScript errors
  2. Run npm run lint - Fix all linting errors
  3. Test the feature manually in the browser
  4. Open browser console and check for errors or warnings
  5. Remove all console.log statements from your code
  6. Test the page on mobile viewport (responsive design)
  7. Test loading states work properly
  8. Test error states work properly
  9. Write a clear, descriptive commit message

COMMON MISTAKES TO AVOID
-------------------------

Using 'any' type:
  Bad: const data: any = response.data
  Good: const data: Course[] = response.data

Not handling errors:
  Bad: const user = await getUser()
  Good: const { data: user, error } = await getUser()
       if (error) throw error

Mutating state directly:
  Bad: state.items.push(newItem)
  Good: setState({ ...state, items: [...state.items, newItem] })

Functions with multiple responsibilities:
  Bad: function getUserAndSendEmail(id: string) {}
  Good: function getUser(id: string) {}
        function sendEmail(to: string) {}

Magic numbers:
  Bad: if (price > 1000) {}
  Good: const MAX_COURSE_PRICE = 1000
        if (price > MAX_COURSE_PRICE) {}

Not using TypeScript features:
  Bad: function process(data) { return data.name }
  Good: function process(data: User): string { return data.name }
