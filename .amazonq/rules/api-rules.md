---
trigger: always_on
---

API RULES
=========

Guidelines for creating and maintaining API routes in Radwa Platform

Last Updated: February 15, 2026

API ROUTE STRUCTURE
-------------------

All API routes live in the app/api directory.
Use route.ts files (not route.js) for TypeScript support.

Directory structure:
  app/api/
    auth/
      login/route.ts
      signup/route.ts
      logout/route.ts
    courses/
      route.ts              (GET /api/courses, POST /api/courses)
      [id]/
        route.ts            (GET /api/courses/[id])
        enroll/route.ts     (POST /api/courses/[id]/enroll)
    lessons/
      [id]/
        video/route.ts      (POST /api/lessons/[id]/video)
        progress/route.ts   (POST /api/lessons/[id]/progress)

ROUTE HANDLER FUNCTIONS
------------------------

Export named functions for each HTTP method:
  GET, POST, PUT, PATCH, DELETE

Basic template:
  import { NextRequest, NextResponse } from 'next/server'
  
  export async function GET(req: NextRequest) {
    return NextResponse.json({ message: 'Success' })
  }
  
  export async function POST(req: NextRequest) {
    const body = await req.json()
    return NextResponse.json({ data: body })
  }

Dynamic routes:
  export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    const courseId = params.id
    return NextResponse.json({ courseId })
  }

AUTHENTICATION CHECK
--------------------

Always check authentication for protected routes.

Pattern:
  import { createServerClient } from '@/lib/supabase/server'
  
  export async function POST(req: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // Continue with authenticated user
    const userId = user.id
  }

For admin-only routes:
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    )
  }

INPUT VALIDATION
----------------

Always validate request body with Zod.

Example:
  import { z } from 'zod'
  
  const enrollmentSchema = z.object({
    courseId: z.string().uuid(),
    paymentOption: z.enum(['full', 'installment_2', 'installment_4']),
    couponCode: z.string().optional()
  })
  
  export async function POST(req: NextRequest) {
    try {
      const body = await req.json()

      // Validate input
      const validated = enrollmentSchema.parse(body)
      
      // Use validated data
      const { courseId, paymentOption, couponCode } = validated
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: error.errors } },
          { status: 400 }
        )
      }
    }
  }

Common validation patterns:
  Email: z.string().email()
  Required string: z.string().min(1)
  Optional string: z.string().optional()
  Number: z.number().positive()
  Enum: z.enum(['option1', 'option2'])
  UUID: z.string().uuid()
  Date: z.string().datetime()
  Array: z.array(z.string())
  Object: z.object({ key: z.string() })

ERROR HANDLING
--------------

Use try-catch blocks for all async operations.

Standard pattern:
  export async function POST(req: NextRequest) {
    try {
      // 1. Authentication check
      const user = await checkAuth()

      // 2. Input validation
      const body = await req.json()
      const validated = schema.parse(body)
      
      // 3. Business logic
      const result = await performOperation(validated)
      
      // 4. Success response
      return NextResponse.json({
        success: true,
        data: result
      })
      
    } catch (error) {
      console.error('API Error:', error)
      
      // Handle specific error types
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: error.errors } },
          { status: 400 }
        )
      }
      
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
      }
      
      // Generic error
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
        { status: 500 }
      )
    }
  }

RESPONSE FORMAT
---------------

Use consistent response format across all API routes.

Success response:
  {
    "success": true,
    "data": {
      // Response data here
    }
  }

Error response:
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Error description"
    }
  }

List response with pagination:
  {
    "success": true,
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }

HTTP STATUS CODES
-----------------

Use appropriate status codes:
  200 - OK (successful GET, PUT, PATCH)
  201 - Created (successful POST)
  204 - No Content (successful DELETE)
  400 - Bad Request (validation error)
  401 - Unauthorized (not authenticated)
  403 - Forbidden (authenticated but no permission)
  404 - Not Found (resource doesn't exist)
  409 - Conflict (duplicate resource)
  429 - Too Many Requests (rate limit exceeded)
  500 - Internal Server Error (server error)

Examples:
  return NextResponse.json({ data }, { status: 200 })
  return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ error }, { status: 404 })

DATABASE QUERIES IN API ROUTES
-------------------------------

Use Supabase client for all database operations.

Basic query:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')

With relations:
  const { data, error } = await supabase
    .from('courses')
    .select(`
*,
      instructor:instructors(*),
      sections:course_sections(*)
    `)
    .eq('id', courseId)
    .single()

Insert:
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId
    })
    .select()
    .single()

Update:
  const { data, error } = await supabase
    .from('users')
    .update({ name: 'New Name' })
    .eq('id', userId)

Delete:
  const { data, error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)

LOGGING
-------

Log important events and errors:

  console.log('[API] User enrolled:', { userId, courseId })
  console.error('[API Error] Failed to process payment:', error)

Use structured logging for production:
  console.log(JSON.stringify({
    level: 'info',
    message: 'User enrolled',
    userId,
    courseId,
    timestamp: new Date().toISOString()
  }))

COMMON MISTAKES
---------------

Not checking authentication:
  Bad: Direct database query without auth check
  Good: Always verify user before accessing data

Missing input validation:
  Bad: Using request body directly
  Good: Validate with Zod schema first

Poor error messages:
  Bad: return NextResponse.json({ error: 'Error' })
  Good: return NextResponse.json({ error: { code: 'SPECIFIC_ERROR', message: 'Clear message' } })

Not handling edge cases:
  Bad: Assume data always exists
  Good: Check for null/undefined and handle appropriately

Exposing sensitive data:
  Bad: Return user passwords or API keys
  Good: Filter sensitive fields before responding

For detailed examples see: 03-API-EXAMPLES.md
