---
description: Create API endpoints with authentication, input validation using Zod, proper error handling, and consistent response format. Includes templates for GET, POST, PUT, DELETE methods with examples of database queries and business logic implementation.
---

CREATE API ROUTE WORKFLOW
=========================

Purpose: Create API endpoints with proper structure

STEP 1: DETERMINE LOCATION
---------------------------

  app/api/[feature]/route.ts           List/create
  app/api/[feature]/[id]/route.ts      Get/update/delete
  app/api/[feature]/[id]/action/route.ts  Specific action

Examples:
  app/api/courses/route.ts              GET, POST courses
  app/api/courses/[id]/route.ts         GET, PUT, DELETE course
  app/api/courses/[id]/enroll/route.ts  POST enrollment

STEP 2: BASIC TEMPLATE
-----------------------

// app/api/courses/[id]/enroll/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const enrollmentSchema = z.object({
  paymentOption: z.enum(['full', 'installment_2', 'installment_4']),
  couponCode: z.string().optional()
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // 2. VALIDATE INPUT
    const body = await req.json()
    const { paymentOption, couponCode } = enrollmentSchema.parse(body)
    const courseId = params.id
    
    // 3. BUSINESS LOGIC
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { error: { code: 'ALREADY_ENROLLED', message: 'Already enrolled' } },
        { status: 409 }
      )
    }
    
    // 4. DATABASE OPERATION
    const { data, error: dbError } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        payment_option: paymentOption
      })
      .select()
      .single()
    
    if (dbError) throw dbError
    
    // 5. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('API Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    )
  }
}

STEP 3: GET ENDPOINT
--------------------

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Query database
    const from = (page - 1) * limit
    const { data, error, count } = await supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .range(from, from + limit - 1)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch' } },
      { status: 500 }
    )
  }
}

STEP 4: PUT ENDPOINT
--------------------

const updateSchema = z.object({
  name: z.string().min(3).max(255),
  bio: z.string().max(500).optional()
})

export async function PUT(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Auth required' } },
        { status: 401 }
      )
    }
    
    // Validate
    const body = await req.json()
    const validated = updateSchema.parse(body)
    
    // Update
    const { data, error } = await supabase
      .from('users')
      .update(validated)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Update failed' } },
      { status: 500 }
    )
  }
}

STEP 5: DELETE ENDPOINT
------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Auth required' } },
        { status: 401 }
      )
    }
    
    // Verify ownership
    const { data: item } = await supabase
      .from('items')
      .select('user_id')
      .eq('id', params.id)
      .single()
    
    if (!item) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Not found' } },
        { status: 404 }
      )
    }
    
    if (item.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized' } },
        { status: 403 }
      )
    }
    
    // Delete
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, message: 'Deleted' })
    
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Delete failed' } },
      { status: 500 }
    )
  }
}

STEP 6: VALIDATION SCHEMAS
---------------------------

Common Zod patterns:

  z.string().email()              Email
  z.string().uuid()               UUID
  z.string().url()                URL
  z.string().min(3).max(255)      Length
  z.string().regex(/^[a-z]+$/)   Pattern
  z.number().positive()           Positive number
  z.number().int()                Integer
  z.enum(['a', 'b'])             Enum
  z.array(z.string())             Array
  z.object({ key: z.string() })   Object
  z.string().optional()           Optional

STEP 7: RESPONSE FORMAT
------------------------

Success:
  {
    "success": true,
    "data": { ... }
  }

Error:
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Description"
    }
  }

Paginated:
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

STEP 8: TESTING
---------------

Using curl:
  curl -X POST <http://localhost:3000/api/endpoint> \
    -H "Content-Type: application/json" \
    -d '{"key":"value"}'

Using Postman:

  1. Create request (GET/POST/PUT/DELETE)
  2. Set URL
  3. Add headers (Content-Type: application/json)
  4. Add body (raw JSON)

Test cases:
  ✓ Success case
  ✓ Missing auth
  ✓ Invalid input
  ✓ Business rule violation
  ✓ Database error

CHECKLIST
---------

  ✓ Route location correct
  ✓ Auth check added
  ✓ Input validated with Zod
  ✓ Error handling complete
  ✓ Response format consistent
  ✓ Status codes appropriate
  ✓ Tested with Postman/curl
  ✓ Database queries optimized
