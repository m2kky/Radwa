-- ============================================
-- Portfolio Project Subcategories
-- ============================================

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS subcategories TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_portfolio_items_subcategories
  ON public.portfolio_items USING GIN (subcategories);
