-- Create portfolio_items table
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Basic Info
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('project', 'case_study')),
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    
    -- Meta Info
    client_name TEXT,
    year TEXT,
    role TEXT,
    category TEXT,
    tags TEXT[],
    
    -- Rich Content
    content_body TEXT,
    gallery_images TEXT[],
    video_url TEXT,
    
    -- Case Study specific
    metrics JSONB,
    testimonial TEXT
);

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Public can read published items
CREATE POLICY "Public can read published portfolio items" 
    ON portfolio_items FOR SELECT 
    USING (is_published = true);

-- 2. Service role (Admin) can do everything
CREATE POLICY "Service role has full access to portfolio items" 
    ON portfolio_items FOR ALL 
    USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
