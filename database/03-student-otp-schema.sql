-- ============================================
-- RADWA v2 - MIGRATION: Student Dashboard + OTP
-- Adds user_progress table and phone verification fields
-- ============================================

-- ============================================
-- TABLE: USER_PROGRESS
-- Tracks lesson progress for course products
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lesson_index INTEGER NOT NULL, -- which lesson in the lessons JSONB array
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, lesson_index)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_product ON user_progress(product_id);
CREATE INDEX idx_user_progress_lesson ON user_progress(user_id, product_id, lesson_index);

-- RLS: Users can only see their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_progress_own ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: USER_ENROLLMENTS
-- Tracks course enrollments with completion status
-- ============================================
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
  progress_percent INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_user_enrollments_user ON user_enrollments(user_id);
CREATE INDEX idx_user_enrollments_product ON user_enrollments(product_id);

-- RLS: Users can only see their own enrollments
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_enrollments_own ON user_enrollments
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- UPDATE USERS TABLE
-- Add phone verification fields for OTP
-- ============================================
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_users_phone ON users(phone);

-- ============================================
-- FUNCTION: Auto-create enrollment on course purchase
-- ============================================
CREATE OR REPLACE FUNCTION handle_course_purchase()
RETURNS TRIGGER AS $$
DECLARE
  product_type TEXT;
BEGIN
  -- Check if product is a course
  SELECT type INTO product_type
  FROM products
  WHERE id = NEW.product_id;

  -- Only create enrollment for courses (not digital products)
  IF product_type = 'course' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO user_enrollments (user_id, product_id, order_id, status)
    VALUES (NEW.user_id, NEW.product_id, NEW.id, 'active')
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create enrollment when order is completed
DROP TRIGGER IF EXISTS on_order_completed_create_enrollment ON orders;
CREATE TRIGGER on_order_completed_create_enrollment
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'completed')
  EXECUTE FUNCTION handle_course_purchase();

-- ============================================
-- FUNCTION: Update enrollment progress
-- ============================================
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  progress INTEGER;
  course_id UUID;
BEGIN
  course_id := NEW.product_id;
  
  -- Get total lessons count from product
  SELECT COALESCE(jsonb_array_length(lessons), 0)
  INTO total_lessons
  FROM products
  WHERE id = course_id;

  -- Count completed lessons
  SELECT COUNT(*)
  INTO completed_lessons
  FROM user_progress
  WHERE user_id = NEW.user_id 
    AND product_id = course_id 
    AND completed = TRUE;

  -- Calculate progress percentage
  IF total_lessons > 0 THEN
    progress := (completed_lessons * 100) / total_lessons;
  ELSE
    progress := 0;
  END IF;

  -- Update enrollment
  UPDATE user_enrollments
  SET 
    progress_percent = progress,
    last_accessed_at = NOW(),
    completed_at = CASE WHEN progress = 100 THEN NOW() ELSE completed_at END,
    status = CASE WHEN progress = 100 THEN 'completed' ELSE status END
  WHERE user_id = NEW.user_id AND product_id = course_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update progress when lesson is marked complete
DROP TRIGGER IF EXISTS on_lesson_complete_update_progress ON user_progress;
CREATE TRIGGER on_lesson_complete_update_progress
  AFTER UPDATE ON user_progress
  FOR EACH ROW
  WHEN (OLD.completed = FALSE AND NEW.completed = TRUE)
  EXECUTE FUNCTION update_enrollment_progress();
