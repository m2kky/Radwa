---
description: project standards. Determines Server vs Client component type, sets up TypeScript interfaces, applies Tailwind styling, and ensures mobile responsiveness. Includes templates for both component types with proper error handling and loading states
---

CREATE COMPONENT WORKFLOW
=========================

Purpose: Create properly structured React components

STEP 1: DETERMINE COMPONENT TYPE
---------------------------------

Server Component (Default):
  Use when:
    - Component only displays data
    - No user interactions needed
    - No React hooks required
    - Can fetch data directly
  
  Benefits:
    - Better performance
    - Smaller bundle size
    - SEO friendly
    - Direct database access

Client Component (add 'use client'):
  Use when:
    - Need useState, useEffect, hooks
    - Event handlers (onClick, onChange)
    - Browser APIs (localStorage, window)
    - Third-party interactive libraries

STEP 2: CHOOSE LOCATION
------------------------

  components/features/     Business components
  components/forms/        Form components
  components/sections/     Page sections
  components/shared/       Reusable utilities
  components/dashboard/    Dashboard widgets

STEP 3: NAMING
--------------

File: kebab-case.tsx
  ✓ course-card.tsx
  ✗ CourseCard.tsx

Component: PascalCase
  ✓ CourseCard
  ✗ courseCard

STEP 4: SERVER COMPONENT
-------------------------

// components/features/course-card.tsx

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface CourseCardProps {
  course: {
    id: string
    title: string
    subtitle: string
    slug: string
    thumbnail_url: string
    price: number
    enrollments_count: number
  }
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <Image
          src={course.thumbnail_url}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>

      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{course.title}</h3>
          <p className="text-muted-foreground text-sm">{course.subtitle}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">${course.price}</span>
          <span className="text-sm text-muted-foreground">
            {course.enrollments_count} students
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link href={`/courses/${course.slug}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

STEP 5: CLIENT COMPONENT
-------------------------

// components/features/enrollment-button.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EnrollmentButtonProps {
  courseId: string
  price: number
}

export function EnrollmentButton({ courseId, price }: EnrollmentButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const handleEnroll = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Enrollment failed')
      }
      
      toast.success('Successfully enrolled!')
      router.push('/dashboard/courses')
      
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Button onClick={handleEnroll} disabled={loading} className="w-full" size="lg">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Enrolling...' : `Enroll Now - $${price}`}
    </Button>
  )
}

STEP 6: TYPESCRIPT INTERFACES
------------------------------

Always define props interface:

  interface ComponentProps {
    // Required props
    userId: string
    title: string

    // Optional props
    showActions?: boolean
    className?: string
    
    // Event handlers
    onSubmit?: () => void
    onCancel?: () => void
    
    // Children
    children?: React.ReactNode
  }

STEP 7: STYLING
---------------

Use Tailwind classes:
  Layout: flex, grid, space-y-4
  Spacing: p-6, m-4, gap-6
  Colors: bg-brand-primary, text-muted-foreground
  Typography: text-h1, font-bold
  Responsive: md:grid-cols-2, lg:text-lg

STEP 8: ERROR HANDLING
-----------------------

Client components need error handling:

  try {
    await operation()
    toast.success('Success!')
  } catch (error) {
    console.error('Error:', error)
    toast.error('An error occurred')
  }

STEP 9: LOADING STATES
-----------------------

Show loading indicators:

  const [loading, setLoading] = useState(false)
  
  return (
    <Button disabled={loading}>
      {loading && <Loader2 className="animate-spin" />}
      {loading ? 'Loading...' : 'Submit'}
    </Button>
  )

STEP 10: TESTING
----------------

After creating:
  ✓ npm run type-check
  ✓ Test in browser
  ✓ Check mobile viewport
  ✓ Test loading states
  ✓ Test error states
  ✓ Verify accessibility

CHECKLIST
---------

  ✓ Correct location chosen
  ✓ Proper naming (file and component)
  ✓ 'use client' added if needed
  ✓ TypeScript interface defined
  ✓ Tailwind classes used
  ✓ Mobile responsive
  ✓ Loading states included
  ✓ Error handling added
  ✓ Type check passes
  ✓ Tested manually
