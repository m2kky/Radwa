---
trigger: always_on
---

SECURITY RULES
==============

Security best practices for Radwa Platform

Last Updated: February 15, 2026

AUTHENTICATION
--------------

Always verify user authentication before accessing protected resources.

Server Components:
  import { createServerClient } from '@/lib/supabase/server'
  import { redirect } from 'next/navigation'
  
  export default async function ProtectedPage() {
    const supabase = createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
    }
    
    // User is authenticated, continue
  }

API Routes:
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

Client Components:
  'use client'
  
  import { useEffect } from 'react'
  import { useRouter } from 'next/navigation'
  import { createClient } from '@/lib/supabase/client'
  
  export function ProtectedComponent() {
    const router = useRouter()

    useEffect(() => {
      async function checkAuth() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
        }
      }
      
      checkAuth()
    }, [router])
  }

AUTHORIZATION
-------------

Check user roles and permissions before allowing actions.

Admin check:
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

Resource ownership:
  const { data: course } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single()
  
  if (course.instructor_id !== user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not authorized' } },
      { status: 403 }
    )
  }

ROW LEVEL SECURITY (RLS)
-------------------------

All database tables must have RLS enabled.

Enable RLS:
  ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

Public read policy:
  CREATE POLICY "Anyone can view published courses"
  ON courses
  FOR SELECT
  USING (status = 'published');

User data policy:
  CREATE POLICY "Users can view own enrollments"
  ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

Admin policy:
  CREATE POLICY "Admins can do everything"
  ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

Never disable RLS in production.

INPUT VALIDATION
----------------

Validate all user input with Zod schemas.

API routes:
  import { z } from 'zod'
  
  const courseSchema = z.object({
    title: z.string().min(5).max(255),
    description: z.string().min(50),
    price: z.number().positive(),
    category: z.enum(['marketing', 'sales', 'strategy'])
  })
  
  try {
    const validated = courseSchema.parse(body)
    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      )
    }
  }

Common validations:
  z.string().email()           Email format
  z.string().url()             URL format
  z.string().uuid()            UUID format
  z.string().min(8)            Minimum length
  z.string().max(255)          Maximum length
  z.string().regex(/^[a-z]+$/) Pattern matching
  z.number().positive()        Positive numbers
  z.number().int()             Integers only
  z.enum(['a', 'b'])          Specific values

SANITIZATION
------------

Sanitize user input before storing or displaying.

Text content:
  Never use dangerouslySetInnerHTML with user content
  Use plain text or properly escaped HTML

URLs:
  Validate URLs before redirecting:
    const isValidUrl = (url: string) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    }

File uploads:
  Validate file types and sizes:
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 5 *1024* 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type')
    }
    
    if (file.size > maxSize) {
      throw new Error('File too large')
    }

ENVIRONMENT VARIABLES
---------------------

Never expose secrets in client-side code.

Server-only variables (no NEXT_PUBLIC prefix):
  SUPABASE_SERVICE_ROLE_KEY
  DATABASE_URL
  PAYMOB_API_KEY
  RESEND_API_KEY
  BUNNY_STORAGE_API_KEY

Client-safe variables (NEXT_PUBLIC prefix):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_APP_URL

Access in code:
  Server: process.env.SUPABASE_SERVICE_ROLE_KEY
  Client: process.env.NEXT_PUBLIC_SUPABASE_URL

Never commit .env files:
  Add to .gitignore:
    .env
    .env.local
    .env.production

API SECURITY
------------

Rate limiting:
  Implement rate limiting on sensitive endpoints
  Use Upstash Redis or similar service
  Limit: 10 requests per minute for auth endpoints
  Limit: 100 requests per minute for general APIs

CORS:
  Only allow requests from known origins
  Set appropriate CORS headers:
    Access-Control-Allow-Origin: <https://radwa.com>
    Access-Control-Allow-Methods: GET, POST, PUT, DELETE
    Access-Control-Allow-Headers: Content-Type, Authorization

HTTPS only:
  Force HTTPS in production
  Set secure cookie flags:
    httpOnly: true
    secure: true (production)
    sameSite: 'lax'

PASSWORD SECURITY
-----------------

Password requirements:
  Minimum 8 characters
  Must contain uppercase and lowercase
  Must contain numbers
  Optional: Special characters

Validation schema:
  z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')

Never store plain text passwords.
Supabase handles password hashing automatically.

SESSION MANAGEMENT
------------------

Session timeout:
  Set appropriate session expiration
  Supabase default: 1 hour access token, 1 week refresh token

Refresh tokens:
  Supabase handles token refresh automatically
  Monitor for token expiration errors

Logout:
  Always clear session on logout:
    await supabase.auth.signOut()

SQL INJECTION PREVENTION
-------------------------

Always use parameterized queries.
Supabase client prevents SQL injection by default.

Good (Supabase):
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('title', userInput)

Bad (raw SQL):
  const query = `SELECT * FROM courses WHERE title = '${userInput}'`
  // NEVER DO THIS

If using raw SQL (avoid if possible):
  Use prepared statements with parameters
  Never concatenate user input into SQL strings

XSS PREVENTION
--------------

React automatically escapes content.

Safe:
  <div>{userContent}</div>
  <p>{user.name}</p>

Dangerous (avoid):
  <div dangerouslySetInnerHTML={{ __html: userContent }} />

If you must render HTML:
  Use a sanitization library like DOMPurify
  Sanitize on the server before storing

CSRF PROTECTION
---------------

Next.js provides built-in CSRF protection for:
  Server Actions
  API Routes with POST/PUT/DELETE

Additional protection:
  Verify Origin header matches your domain
  Use SameSite cookie attribute
  Require authentication for state-changing operations

FILE UPLOAD SECURITY
--------------------

Validate uploads:
  Check file type (MIME type)
  Check file size
  Scan for malware (if possible)
  Generate unique filenames

Example:
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  const maxSize = 10 *1024* 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large')
  }
  
  const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`

Store files outside web root or use CDN with access controls.

LOGGING
-------

Log security events:
  Failed login attempts
  Unauthorized access attempts
  Permission errors
  Unusual activity

Never log:
  Passwords
  API keys
  Session tokens
  Credit card numbers
  Personal identification numbers

Good logging:
  console.log('Failed login attempt', { email: user.email, ip: req.ip })

Bad logging:
  console.log('Login attempt', { password: password }) // NEVER

SECURITY HEADERS
----------------

Set security headers in Next.js config or middleware:

  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: (configure based on needs)

In middleware.ts:
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')

SECURITY CHECKLIST
------------------

Before deployment:
  Authentication on all protected routes
  Authorization checks for sensitive operations
  RLS enabled on all database tables
  Input validation with Zod
  Environment variables secured
  No secrets in client code
  Rate limiting on APIs
  HTTPS enforced
  Secure session management
  File upload validation
  Security headers set
  Error messages don't expose sensitive info
  Audit logs for security events

INCIDENT RESPONSE
-----------------

If security breach occurs:

  1. Identify affected systems
  2. Contain the breach immediately
  3. Assess the damage
  4. Notify affected users
  5. Fix the vulnerability
  6. Document the incident
  7. Review and improve security measures

COMMON SECURITY MISTAKES
-------------------------

Exposing API keys:
  Bad: const API_KEY = 'sk_live_12345' in client code
  Good: Store in server-only environment variable

Not validating input:
  Bad: Using user input directly in queries
  Good: Validate with Zod before using

Disabled RLS:
  Bad: ALTER TABLE courses DISABLE ROW LEVEL SECURITY
  Good: Keep RLS enabled with proper policies

Weak passwords:
  Bad: Allowing passwords like '12345678'
  Good: Enforce strong password requirements

Missing authentication:
  Bad: Public API routes that should be protected
  Good: Check authentication on all protected routes

Trusting client data:
  Bad: if (req.body.isAdmin) { grantAdminAccess() }
  Good: Verify admin status from database

Logging sensitive data:
  Bad: console.log('User data:', { password, creditCard })
  Good: console.log('User logged in:', { userId, timestamp })
