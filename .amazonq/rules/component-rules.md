---
trigger: always_on
---

COMPONENT RULES
===============

Guidelines for creating and organizing React components in Radwa Platform

Last Updated: February 15, 2026

SERVER COMPONENTS VS CLIENT COMPONENTS
---------------------------------------

Next.js 14 App Router uses React Server Components by default.
This is a major shift from traditional React development.

Default: All components are Server Components

- Run on the server only
- Can fetch data directly
- Cannot use React hooks (useState, useEffect, etc)
- Cannot use browser APIs
- No JavaScript sent to client
- Better performance and SEO

Use 'use client' directive ONLY when you need:

- React hooks (useState, useEffect, useContext, etc)
- Event handlers (onClick, onChange, onSubmit, etc)
- Browser APIs (localStorage, window, document, etc)
- Third-party libraries that require client-side execution

SERVER COMPONENT PATTERN
-------------------------

This is the default. No special directive needed.

Example:
  // app/courses/page.tsx
  
  import { createClient } from '@/lib/supabase/server'
  import { CourseCard } from '@/components/features/course-card'
  
  export default async function CoursesPage() {
    const supabase = createClient()

    // Fetch data directly in the component
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
    
    if (error) {
      throw new Error('Failed to fetch courses')
    }
    
    return (
      <div className="container py-16">
        <h1>Available Courses</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    )
  }

Benefits of Server Components:

- No loading states needed (data ready on first render)
- Better SEO (fully rendered HTML)
- Smaller JavaScript bundle
- Direct database access (no API route needed)
- Automatic code splitting

CLIENT COMPONENT PATTERN
-------------------------

Add 'use client' at the top of the file when you need interactivity.

Example:
  // components/features/enrollment-button.tsx
  'use client'
  
  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { Button } from '@/components/ui/button'
  
  export function EnrollmentButton({ courseId, price }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleEnroll = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/courses/enroll', {
          method: 'POST',
          body: JSON.stringify({ courseId })
        })
        
        if (response.ok) {
          router.push('/dashboard/courses')
        }
      } catch (error) {
        console.error('Enrollment failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <Button onClick={handleEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </Button>
    )
  }

When to use Client Components:

- Forms with validation and submission
- Interactive UI elements (modals, dropdowns, tabs)
- Components that need useState or useEffect
- Components using third-party libraries (SWR, React Hook Form, etc)
- Real-time features (WebSocket, Supabase Realtime)

MIXING SERVER AND CLIENT COMPONENTS
------------------------------------

You can nest Client Components inside Server Components, but NOT the reverse.

Good (Client inside Server):
  // app/courses/[slug]/page.tsx (Server Component)
  
  import { EnrollmentButton } from '@/components/features/enrollment-button'
  
  export default async function CourseDetailPage({ params }) {
    const course = await fetchCourse(params.slug)

    return (
      <div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        
        {/* Client Component inside Server Component */}
        <EnrollmentButton courseId={course.id} price={course.price} />
      </div>
    )
  }

Bad (Server inside Client):
  'use client'
  
  export default function ClientPage() {
    const data = await fetchData() // ERROR: Can't use await in Client Component
    return <div>{data}</div>
  }

COMPONENT STRUCTURE
-------------------

Follow this structure for all components:

1. File-level directives ('use client' if needed)
2. Imports (in order: React, external, internal, components, types)
3. Type/Interface definitions
4. Component function
5. Helper functions (if any)
6. Export

Example:
  'use client'
  
  import { useState } from 'react'
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  
  import { createClient } from '@/lib/supabase/client'
  import { Button } from '@/components/ui/button'
  
  import type { Course } from '@/types/course'
  
  interface CourseFormProps {
    course?: Course
    onSuccess?: () => void
  }
  
  export function CourseForm({ course, onSuccess }: CourseFormProps) {
    const [loading, setLoading] = useState(false)

    // Component logic here
    
    return (
      <form>
        {/* JSX here */}
      </form>
    )
  }
  
  // Helper functions
  function formatCourseData(data: any): Course {
    // Helper logic
  }

PROPS AND TYPES
---------------

Always define TypeScript interfaces for component props.

Good:
  interface UserProfileProps {
    userId: string
    showActions?: boolean
    onEdit?: () => void
  }
  
  export function UserProfile({ userId, showActions = true, onEdit }: UserProfileProps) {
    // Component logic
  }

Bad:
  export function UserProfile(props) {
    // No type safety
  }

For optional props, provide default values:
  interface ButtonProps {
    variant?: 'default' | 'outline'
    size?: 'sm' | 'md' | 'lg'
  }
  
  export function Button({ variant = 'default', size = 'md' }: ButtonProps) {
    // Component logic
  }

For children prop:
  import type { ReactNode } from 'react'
  
  interface CardProps {
    children: ReactNode
    title?: string
  }
  
  export function Card({ children, title }: CardProps) {
    return (
      <div>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    )
  }

COMPONENT NAMING
----------------

Component files: kebab-case
  course-card.tsx
  enrollment-button.tsx
  user-profile.tsx

Component names: PascalCase
  CourseCard
  EnrollmentButton
  UserProfile

Prefix boolean props with 'is', 'has', 'should':
  isLoading
  hasAccess
  shouldShow

Event handler props: prefix with 'on'
  onClick
  onSubmit
  onChange
  onClose

ERROR BOUNDARIES
----------------

For critical components, wrap them in error boundaries.

Create error boundary component:
  // components/shared/error-boundary.tsx
  'use client'
  
  import { Component, ReactNode } from 'react'
  
  interface Props {
    children: ReactNode
    fallback?: ReactNode
  }
  
  interface State {
    hasError: boolean
  }
  
  export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
      return { hasError: true }
    }
    
    componentDidCatch(error: Error, errorInfo: any) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    
    render() {
      if (this.state.hasError) {
        return this.props.fallback || <div>Something went wrong</div>
      }
      
      return this.props.children
    }
  }

Usage:
  <ErrorBoundary fallback={<ErrorMessage />}>
    <CriticalComponent />
  </ErrorBoundary>

COMPONENT REUSABILITY
---------------------

Extract common patterns into reusable components.

Bad (duplicated code):
  // In multiple files
  <div className="rounded-lg border p-4 shadow-sm">
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>

Good (reusable component):
  // components/shared/info-card.tsx
  interface InfoCardProps {
    title: string
    description: string
    icon?: ReactNode
  }
  
  export function InfoCard({ title, description, icon }: InfoCardProps) {
    return (
      <div className="rounded-lg border p-4 shadow-sm">
        {icon && <div className="mb-2">{icon}</div>}
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    )
  }
  
  // Usage in multiple places
  <InfoCard title="Title" description="Description" />

COMPONENT COMPOSITION
---------------------

Build complex components by composing smaller ones.

Example (Card component with composition):
  // components/ui/card.tsx
  export function Card({ children, className }) {
    return <div className={cn("rounded-lg border", className)}>{children}</div>
  }
  
  export function CardHeader({ children }) {
    return <div className="p-6 pb-0">{children}</div>
  }
  
  export function CardContent({ children }) {
    return <div className="p-6">{children}</div>
  }
  
  export function CardFooter({ children }) {
    return <div className="p-6 pt-0">{children}</div>
  }

Usage:
  <Card>
    <CardHeader>
      <h2>Title</h2>
    </CardHeader>
    <CardContent>
      <p>Content</p>
    </CardContent>
    <CardFooter>
      <Button>Save</Button>
    </CardFooter>
  </Card>

PERFORMANCE OPTIMIZATION
------------------------

For expensive components, use React.memo:
  import { memo } from 'react'
  
  export const CourseCard = memo(function CourseCard({ course }) {
    return <div>{course.title}</div>
  })

For heavy components, use dynamic imports:
  import dynamic from 'next/dynamic'
  
  const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
    loading: () => <LoadingSpinner />,
    ssr: false
  })

Use Suspense for data fetching:
  import { Suspense } from 'react'
  
  export default function Page() {
    return (
      <div>
        <Suspense fallback={<LoadingSpinner />}>
          <AsyncComponent />
        </Suspense>
      </div>
    )
  }

FORM COMPONENTS
---------------

Always use React Hook Form with Zod validation.

Example:
  'use client'
  
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  
  const schema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
  
  type FormData = z.infer<typeof schema>
  
  export function LoginForm() {
    const form = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        email: '',
        password: ''
      }
    })

    const onSubmit = async (data: FormData) => {
      // Handle form submission
    }
    
    return (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <input {...form.register('email')} />
        {form.formState.errors.email && (
          <span>{form.formState.errors.email.message}</span>
        )}
        
        <button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    )
  }

LOADING STATES
--------------

Always show loading indicators for async operations.

Example:
  'use client'
  
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Loader2 } from 'lucide-react'
  
  export function SubmitButton() {
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
      setLoading(true)
      try {
        await someAsyncOperation()
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <Button onClick={handleClick} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Processing...' : 'Submit'}
      </Button>
    )
  }
