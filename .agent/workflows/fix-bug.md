---
description: Systematically debug and fix bugs with proper documentation. Includes steps for reproducing issues, gathering information, isolating problems, implementing fixes, and documenting in issue log to prevent future occurrences.
---

FIX BUG WORKFLOW
================

Purpose: Systematically debug and fix issues

STEP 1: REPRODUCE THE BUG
--------------------------

Document exactly:
  1. Expected behavior (what should happen)
  2. Actual behavior (what actually happens)
  3. Steps to reproduce (exact sequence)
  4. Environment (browser, device, OS, user role)
  5. Error messages (copy full error from console)
  6. Screenshots or screen recording (if visual)

Example:
  Expected: Video plays when clicking play button
  Actual: Video shows blank screen, no error message
  Steps: 
    1. Login as student
    2. Navigate to enrolled course
    3. Click first lesson
    4. Click play button
  Environment: Safari 17.2, iPhone 14, iOS 17.3
  Error: No error in console, network shows 403 on video URL


STEP 2: GATHER INFORMATION
---------------------------

Check all sources:

Browser Console:
  - Open DevTools (F12)
  - Check Console tab for JavaScript errors
  - Look for red error messages
  - Note warnings (yellow)

Network Tab:
  - Check for failed requests (red)
  - Look at status codes (404, 500, 403)
  - Check request/response headers
  - Verify API response data

React DevTools:
  - Check component props
  - Verify component state
  - Look at context values
  - Check for re-render issues

Supabase Dashboard:
  - Check logs for database errors
  - Verify RLS policies
  - Check auth logs
  - Look at API usage

Git History:
  - Check recent changes: git log --oneline -10
  - See what changed: git diff HEAD~5
  - Check specific file: git log -p filename

Check ISSUE-LOG.md:
  - Search for similar issues
  - Look for related problems
  - Check previous solutions


STEP 3: ISOLATE THE PROBLEM
----------------------------

Add strategic logging:

  console.log('Debug: Component mounted')
  console.log('Debug: Props received:', props)
  console.log('Debug: API response:', response)
  console.log('Debug: User state:', user)
  console.log('Debug: Before database query')

Narrow down systematically:

Comment out code sections:
  // Temporarily disable feature to see if error persists
  // return null

Test with minimal data:
  // Use hardcoded simple data instead of real data
  const testData = { id: '123', title: 'Test' }

Test one function at a time:
  // Isolate and test individual functions separately
  const result = await testFunction()
  console.log('Function result:', result)

Verify assumptions:
  // Check that data exists before using it
  console.log('Does user exist?', !!user)
  console.log('Is array empty?', items.length === 0)


STEP 4: IDENTIFY ROOT CAUSE
----------------------------

Ask critical questions:

Why did it happen?
  - Logic error in code?
  - Missing null check?
  - Incorrect assumption?
  - Race condition?
  - External service issue?

What assumption was wrong?
  - Assumed data always exists?
  - Assumed user always authenticated?
  - Assumed API always succeeds?

Is it a logic error or edge case?
  - Does it happen every time? (logic error)
  - Only in specific conditions? (edge case)

Is it environment-specific?
  - Only on Safari? (browser compatibility)
  - Only on mobile? (responsive design)
  - Only in production? (environment config)


STEP 5: IMPLEMENT FIX
----------------------

Make minimal, focused changes:

Fix only what's broken:
  Bad: Rewrite entire component
  Good: Fix the specific issue

Add missing error handling:
  Before:
    const data = await fetchData()
    return data.items
  
  After:
    const { data, error } = await fetchData()
    if (error) {
      console.error('Fetch error:', error)
      return []
    }
    return data?.items || []

Add missing validation:
  Before:
    function processUser(user) {
      return user.name.toUpperCase()
    }
  
  After:
    function processUser(user) {
      if (!user || !user.name) {
        return ''
      }
      return user.name.toUpperCase()
    }

Update types if needed:
  interface User {
    id: string
    name: string
    email?: string  // Add optional if can be null
  }


STEP 6: TEST THOROUGHLY
------------------------

Verify fix works:
  ✓ Bug is fixed (test exact reproduction steps)
  ✓ No new errors in console
  ✓ Related features still work
  ✓ Edge cases handled
  ✓ Mobile works (if applicable)
  ✓ Different browsers (if browser-specific)
  ✓ npm run type-check passes
  ✓ npm run lint passes

Test related functionality:
  If you fixed login, test:
    - Signup
    - Logout
    - Password reset
    - Session persistence

Test edge cases:
  - Empty data
  - Null values
  - Very long text
  - Special characters
  - Network failure


STEP 7: CLEAN UP
-----------------

Remove debugging code:
  - Delete console.log statements
  - Remove commented code
  - Remove test data

Update documentation if needed:
  - Update component docs if behavior changed
  - Update API docs if endpoint changed


STEP 8: DOCUMENT IN ISSUE-LOG.md
---------------------------------

Add entry to ISSUE-LOG.md:

Format:
  ## [2026-02-15] - Video Player Not Loading on Safari
  
  Problem:
  Video player shows blank screen on Safari browser. Works fine on Chrome.
  User reported they can't watch course lessons on iPhone.
  Steps: Login → Go to course → Click lesson → Click play button → Blank screen
  
  Root Cause:
  Bunny.net iframe URL was missing https:// protocol.
  Safari blocks iframes without explicit secure protocol for security.
  Chrome was more lenient and assumed https.
  
  Solution:
  Updated video player component to ensure iframe src always includes https://
  Added URL validation function before rendering iframe.
  Added fallback error message if video fails to load.
  
  Files Changed:
  - components/features/video-player.tsx (line 45-52)
    Added protocol validation and https enforcement
  - lib/utils/video.ts (added validateVideoUrl function)
    New utility function to validate and fix video URLs
  
  Prevention:
  Always validate external URLs before using in iframes
  Test on Safari/iOS during development (not just Chrome)
  Add URL validation utility for all external sources
  Consider adding automated Safari testing
  
  Related Issues:
  Similar to issue from 2026-01-10 with image loading


EXAMPLE: COMPLETE BUG FIX
--------------------------

Bug: Course enrollment button does nothing when clicked

1. REPRODUCE:
   - Login as student
   - Go to course detail page
   - Click "Enroll Now" button
   - Nothing happens, no error

2. GATHER INFO:
   Console: "TypeError: Cannot read property 'id' of undefined"
   Network: API call not even attempted
   React DevTools: courseId prop is undefined

3. ISOLATE:
   console.log('Props:', props)  // courseId is missing
   console.log('Course data:', course)  // course object exists
   
4. ROOT CAUSE:
   Parent component passing 'course' object but button expects 'courseId'
   Prop name mismatch between parent and child

5. FIX:
   // components/features/enrollment-button.tsx
   
   // Before:
   interface EnrollmentButtonProps {
     courseId: string  // Expected prop name
   }
   
   // After: Changed to match parent
   interface EnrollmentButtonProps {
     course: {
       id: string
       price: number
     }
   }
   
   export function EnrollmentButton({ course }: EnrollmentButtonProps) {
     const handleEnroll = async () => {
       await fetch('/api/enroll', {
         body: JSON.stringify({ courseId: course.id })  // Use course.id
       })
     }
   }

6. TEST:
   ✓ Button click works
   ✓ API call successful
   ✓ Enrollment created
   ✓ User redirected to dashboard
   ✓ No console errors

7. DOCUMENT:
   Added to ISSUE-LOG.md with full details


COMMON BUG PATTERNS
-------------------

Null/Undefined errors:
  Symptom: "Cannot read property X of undefined"
  Fix: Add null checks: if (user?.name)

Missing await:
  Symptom: Promise instead of data
  Fix: Add await: const data = await fetchData()

State not updating:
  Symptom: Component doesn't re-render
  Fix: Update state immutably: setState([...items, newItem])

Infinite loop:
  Symptom: Browser freezes, too many renders
  Fix: Add dependencies to useEffect: useEffect(() => {}, [deps])

Wrong Supabase client:
  Symptom: Auth errors, can't fetch data
  Fix: Use createServerClient in Server Components

Missing error handling:
  Symptom: Silent failures
  Fix: Add try-catch and error states


CHECKLIST
---------
  ✓ Bug reproduced consistently
  ✓ Root cause identified clearly
  ✓ Minimal fix implemented
  ✓ No debugging code left
  ✓ Type check passes
  ✓ Lint passes
  ✓ Bug fixed (tested reproduction steps)
  ✓ Related features work
  ✓ Edge cases tested
  ✓ Mobile tested (if applicable)
  ✓ Documented in ISSUE-LOG.md
  ✓ Prevention strategy noted
