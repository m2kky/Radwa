---
trigger: always_on
---

DATABASE RULES
==============

Guidelines for database operations using Supabase in Radwa Platform

Last Updated: February 15, 2026

SUPABASE CLIENT USAGE
----------------------

Two types of Supabase clients:

Server Client (for Server Components and API routes):
  import { createServerClient } from '@/lib/supabase/server'
  
  const supabase = createServerClient()

Client Client (for Client Components):
  import { createClient } from '@/lib/supabase/client'
  
  const supabase = createClient()

Never use server client in client components.
Never use client client in API routes or server components.

SERVER COMPONENT QUERIES
-------------------------

Fetch data directly in Server Components:

  import { createServerClient } from '@/lib/supabase/server'
  
  export default async function CoursesPage() {
    const supabase = createServerClient()

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch courses')
    }
    
    return (
      <div>
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    )
  }

CLIENT COMPONENT QUERIES
-------------------------

Use useEffect for client-side data fetching (only when necessary):

  'use client'
  
  import { useState, useEffect } from 'react'
  import { createClient } from '@/lib/supabase/client'
  
  export function RecentActivity() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      async function fetchActivities() {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) {
          console.error('Error:', error)
        } else {
          setActivities(data)
        }
        
        setLoading(false)
      }
      
      fetchActivities()
    }, [])
    
    if (loading) return <LoadingSpinner />
    
    return <ActivityList activities={activities} />
  }

Prefer Server Components for data fetching when possible.

BASIC QUERIES
-------------

Select all columns:
  const { data, error } = await supabase
    .from('courses')
    .select('*')

Select specific columns:
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, price')

Filter by equality:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')

Filter by multiple conditions:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .eq('category', 'marketing')

Greater than / less than:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .gt('price', 100)
    .lt('price', 1000)

Search (LIKE):
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .ilike('title', '%marketing%')

IN operator:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .in('category', ['marketing', 'sales', 'strategy'])

Order results:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

Limit results:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(10)

Pagination:
  const page = 1
  const limit = 20
  const from = (page - 1) * limit
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .range(from, from + limit - 1)

RELATIONS (JOINS)
-----------------

Fetch related data using foreign keys:

One-to-one:
  const { data, error } = await supabase
    .from('courses')
    .select(`
*,
      instructor:instructors(*)
    `)
    .eq('id', courseId)
    .single()

One-to-many:
  const { data, error } = await supabase
    .from('courses')
    .select(`
*,
      sections:course_sections(*)
    `)
    .eq('id', courseId)

Multiple relations:
  const { data, error } = await supabase
    .from('courses')
    .select(`
*,
      instructor:instructors(name, avatar_url),
      sections:course_sections(
        *,
        lessons:lessons(*)
      )
    `)
    .eq('id', courseId)
    .single()

Count related records:
  const { data, error } = await supabase
    .from('courses')
    .select('*, enrollments(count)')

INSERT OPERATIONS
-----------------

Insert single record:
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString()
    })
    .select()
    .single()

Insert multiple records:
  const { data, error } = await supabase
    .from('lessons')
    .insert([
      { title: 'Lesson 1', order: 1 },
      { title: 'Lesson 2', order: 2 },
      { title: 'Lesson 3', order: 3 }
    ])
    .select()

Always call .select() after insert to get the inserted data.

UPDATE OPERATIONS
-----------------

Update single record by ID:
  const { data, error } = await supabase
    .from('users')
    .update({ name: 'New Name' })
    .eq('id', userId)
    .select()
    .single()

Update multiple records:
  const { data, error } = await supabase
    .from('courses')
    .update({ status: 'archived' })
    .lt('created_at', '2023-01-01')

Increment a counter:
  const { data, error } = await supabase
    .rpc('increment_enrollments_count', { course_id: courseId })

DELETE OPERATIONS
-----------------

Delete by ID:
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)

Delete with conditions:
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', oldDate)

Soft delete (preferred):
  const { data, error } = await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', courseId)

ERROR HANDLING
--------------

Always check for errors:

  const { data, error } = await supabase
    .from('courses')
    .select('*')
  
  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to fetch courses')
  }
  
  // Use data safely here

For critical operations, use try-catch:

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId })
      .select()
      .single()

    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Enrollment failed:', error)
    throw new Error('Failed to enroll in course')
  }

ROW LEVEL SECURITY (RLS)
-------------------------

All tables must have RLS enabled.

Enable RLS:
  ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

Create policies for different operations:

Public read access:
  CREATE POLICY "Anyone can view published courses"
  ON courses
  FOR SELECT
  USING (status = 'published');

User can read own data:
  CREATE POLICY "Users can view own enrollments"
  ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

User can update own data:
  CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

Admin full access:
  CREATE POLICY "Admins have full access"
  ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

QUERY OPTIMIZATION
------------------

Add indexes for frequently queried columns:

  CREATE INDEX idx_courses_status ON courses(status);
  CREATE INDEX idx_courses_slug ON courses(slug);
  CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
  CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
  CREATE INDEX idx_video_progress_user_lesson ON video_progress(user_id, lesson_id);

Select only needed columns:
  Bad: .select('*')
  Good: .select('id, title, price, thumbnail_url')

Use single() when expecting one result:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()

Limit results appropriately:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(20)

Use explain to analyze query performance:
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .explain()

TRANSACTIONS
------------

Use Supabase RPC for complex transactions:

Create function in Supabase:
  CREATE OR REPLACE FUNCTION enroll_in_course(
    p_user_id UUID,
    p_course_id UUID
  )
  RETURNS JSON
  LANGUAGE plpgsql
  AS $$
  DECLARE
    v_result JSON;
  BEGIN
    -- Insert enrollment
    INSERT INTO enrollments (user_id, course_id)
    VALUES (p_user_id, p_course_id);

    -- Update course enrollments count
    UPDATE courses
    SET enrollments_count = enrollments_count + 1
    WHERE id = p_course_id;
    
    -- Return success
    SELECT json_build_object('success', true) INTO v_result;
    RETURN v_result;
  END;
  $$;

Call from application:
  const { data, error } = await supabase
    .rpc('enroll_in_course', {
      p_user_id: userId,
      p_course_id: courseId
    })

REALTIME SUBSCRIPTIONS
----------------------

Subscribe to table changes:

  const supabase = createClient()
  
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('New notification:', payload.new)
        // Update UI with new notification
      }
    )
    .subscribe()
  
  // Cleanup
  return () => {
    supabase.removeChannel(channel)
  }

COMMON MISTAKES
---------------

Using wrong client:
  Bad: Using createClient() in Server Component
  Good: Use createServerClient() in Server Components

Not handling errors:
  Bad: const { data } = await supabase.from('courses').select()
  Good: const { data, error } = await supabase.from('courses').select()
        if (error) throw error

Fetching unnecessary data:
  Bad: .select('*') when only need few columns
  Good: .select('id, title, price')

Missing indexes:
  Bad: Query on unindexed columns
  Good: Add indexes for frequently queried columns

Not using RLS:
  Bad: Disabled RLS on tables
  Good: Enable RLS with proper policies

N+1 queries:
  Bad: Loop through courses and fetch instructor separately
  Good: Use joins to fetch related data in one query
