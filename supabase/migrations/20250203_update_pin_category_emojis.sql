-- Update emojis for pin categories
-- Open Project: change to hammer (🔨)
-- Active Listing: change to contract/document (📄)

UPDATE public.pins_categories
SET emoji = '🔨'
WHERE slug = 'project';

UPDATE public.pins_categories
SET emoji = '📄'
WHERE slug = 'listing';

