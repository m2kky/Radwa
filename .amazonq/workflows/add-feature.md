---
description: 
---

ADD FEATURE WORKFLOW
====================

Purpose: Add new functionality systematically

STEP 1: PLAN THE FEATURE
-------------------------

Write user story:
  As a [user type]
  I want to [action]
  So that [benefit]

Example:
  As a student
  I want to rate and review courses I've completed
  So that other students can make informed enrollment decisions

Define acceptance criteria:
  - Students can submit ratings (1-5 stars)
  - Students can write text reviews (optional)
  - Students can only review courses they've enrolled in
  - Students can edit/delete their own reviews
  - Reviews display on course detail page
  - Average rating shows on course cards

List technical requirements:
  Database: New 'reviews' table
  API: POST /api/courses/[id]/reviews, GET, PUT, DELETE
  Components: ReviewForm, ReviewsList, RatingStars
  Pages: Update course detail page
  Validation: Rating 1-5, max review length 500 chars


STEP 2: DATABASE CHANGES
-------------------------

Plan schema:

  reviews table:
    - id (UUID, primary key)
    - user_id (UUID, foreign key to users)
    - course_id (UUID, foreign key to courses)
    - rating (INTEGER, 1-5)
    - comment (TEXT, optional)
    - created_at (TIMESTAMP)
    - updated_at (TIMESTAMP)

Create migration in Supabase:

  -- Create reviews table
  CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)  -- One review per user per course
  );
  
  -- Create indexes
  CREATE INDEX idx_reviews_course ON reviews(course_id);
  CREATE INDEX idx_reviews_user ON reviews(user_id);
  
  -- Create RLS policies
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);
  
  CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);
  
  -- Add average_rating to courses table
  ALTER TABLE courses ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
  ALTER TABLE courses ADD COLUMN reviews_count INTEGER DEFAULT 0;


STEP 3: CREATE API ENDPOINTS
-----------------------------

POST /api/courses/[id]/reviews:

  // app/api/courses/[id]/reviews/route.ts
  
  import { NextRequest, NextResponse } from 'next/server'
  import { createServerClient } from '@/lib/supabase/server'
  import { z } from 'zod'
  
  const reviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional()
  })
  
  export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
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
      
      // Validate input
      const body = await req.json()
      const { rating, comment } = reviewSchema.parse(body)
      const courseId = params.id
      
      // Check enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()
      
      if (!enrollment) {
        return NextResponse.json(
          { error: { code: 'NOT_ENROLLED', message: 'Must be enrolled' } },
          { status: 403 }
        )
      }
      
      // Create review
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          course_id: courseId,
          rating,
          comment
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {  // Unique violation
          return NextResponse.json(
            { error: { code: 'ALREADY_REVIEWED', message: 'Already reviewed' } },
            { status: 409 }
          )
        }
        throw error
      }
      
      // Update course average rating
      await updateCourseRating(supabase, courseId)
      
      return NextResponse.json({ success: true, data: review })
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: error.errors } },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create review' } },
        { status: 500 }
      )
    }
  }
  
  async function updateCourseRating(supabase, courseId) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('course_id', courseId)
    
    if (reviews && reviews.length > 0) {
      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      
      await supabase
        .from('courses')
        .update({
          average_rating: average.toFixed(1),
          reviews_count: reviews.length
        })
        .eq('id', courseId)
    }
  }

GET /api/courses/[id]/reviews:

  export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const supabase = createServerClient()
      const courseId = params.id
      
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return NextResponse.json({ success: true, data: reviews })
      
    } catch (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' } },
        { status: 500 }
      )
    }
  }


STEP 4: CREATE COMPONENTS
--------------------------

RatingStars component:

  // components/shared/rating-stars.tsx
  
  import { Star } from 'lucide-react'
  
  interface RatingStarsProps {
    rating: number
    size?: 'sm' | 'md' | 'lg'
    interactive?: boolean
    onChange?: (rating: number) => void
  }
  
  export function RatingStars({
    rating,
    size = 'md',
    interactive = false,
    onChange
  }: RatingStarsProps) {
    const sizeClass = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }[size]
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
            onClick={() => interactive && onChange?.(star)}
          />
        ))}
      </div>
    )
  }

ReviewForm component:

  // components/features/review-form.tsx
  'use client'
  
  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { Button } from '@/components/ui/button'
  import { Textarea } from '@/components/ui/textarea'
  import { RatingStars } from '@/components/shared/rating-stars'
  import { toast } from 'sonner'
  
  interface ReviewFormProps {
    courseId: string
  }
  
  export function ReviewForm({ courseId }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (rating === 0) {
        toast.error('Please select a rating')
        return
      }
      
      setLoading(true)
      
      try {
        const response = await fetch(`/api/courses/${courseId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment })
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error?.message || 'Failed to submit review')
        }
        
        toast.success('Review submitted successfully!')
        router.refresh()
        setRating(0)
        setComment('')
        
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Your Rating</label>
          <RatingStars rating={rating} interactive onChange={setRating} size="lg" />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this course..."
            maxLength={500}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/500 characters
          </p>
        </div>
        
        <Button type="submit" disabled={loading || rating === 0}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    )
  }


STEP 5: UPDATE PAGES
--------------------

Update course detail page:

  // app/courses/[slug]/page.tsx
  
  import { ReviewForm } from '@/components/features/review-form'
  import { ReviewsList } from '@/components/features/reviews-list'
  
  export default async function CoursePage({ params }) {
    // ... existing code ...
    
    return (
      <div>
        {/* ... existing course content ... */}
        
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Reviews</h2>
          
          {isEnrolled && (
            <div className="mb-8">
              <ReviewForm courseId={course.id} />
            </div>
          )}
          
          <ReviewsList courseId={course.id} />
        </section>
      </div>
    )
  }


STEP 6: TESTING
---------------

Test all user flows:
  ✓ Submit review (success)
  ✓ Submit without rating (validation error)
  ✓ Submit with 500+ char comment (validation error)
  ✓ Submit when not enrolled (403 error)
  ✓ Submit duplicate review (409 error)
  ✓ View reviews list
  ✓ Edit own review
  ✓ Delete own review
  ✓ Average rating updates correctly
  ✓ Mobile responsive
  ✓ Loading states work
  ✓ Error states work


STEP 7: DOCUMENTATION
---------------------

Update documentation:
  - PROJECT-OVERVIEW.md: Add reviews to features list
  - API-ROUTES.md: Document new endpoints
  - COMPONENTS-INVENTORY.md: List new components
  - DATABASE-SCHEMA.md: Add reviews table
  - CHANGELOG.md: Add feature entry


CHECKLIST
---------
  ✓ User story written
  ✓ Acceptance criteria defined
  ✓ Database schema planned
  ✓ Migration created and applied
  ✓ RLS policies created
  ✓ API endpoints created
  ✓ API endpoints tested
  ✓ Components created
  ✓ Pages updated
  ✓ All user flows tested
  ✓ Mobile responsive
  ✓ Error handling complete
  ✓ Loading states added
  ✓ Documentation updated
  ✓ Code reviewed
  ✓ Deployed to staging
  ✓ Tested on staging
