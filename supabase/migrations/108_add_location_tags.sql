-- Add location-specific tags: church, school, business, park, construction
-- These tags help categorize pins by location type

-- ============================================================================
-- STEP 1: Insert the new location tags
-- ============================================================================

INSERT INTO public.tags (slug, label, emoji, description, entity_type, display_order, is_active, is_public) VALUES
  ('church', 'Church', '⛪', 'Churches, places of worship, and religious institutions', 'pin', 13, true, true),
  ('school', 'School', '🏫', 'Schools, educational institutions, and learning centers', 'pin', 14, true, true),
  ('business', 'Business', '🏢', 'Businesses, commercial establishments, and offices', 'pin', 15, true, true),
  ('park', 'Park', '🌳', 'Parks, recreational areas, and green spaces', 'pin', 16, true, true),
  ('construction', 'Construction', '🚧', 'Construction sites, building projects, and development areas', 'pin', 17, true, true)
ON CONFLICT (slug, entity_type) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: Add comments
-- ============================================================================

COMMENT ON TABLE public.tags IS 'General tagging system for pins and other entities. Includes location-specific tags for churches, schools, businesses, parks, and construction sites.';







