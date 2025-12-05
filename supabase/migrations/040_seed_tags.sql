-- Seed 12 tags for pins
-- These tags represent the main categories of content on the map

-- ============================================================================
-- STEP 1: Insert the 12 tags
-- ============================================================================

INSERT INTO public.tags (slug, label, emoji, description, entity_type, display_order, is_active, is_public) VALUES
  ('deals', 'DEALS', '💰', 'Anything involving buying, selling, or acquiring property or businesses. Examples: Off-market property, Assignment contract, Business for sale, Land opportunity, Wholesale deal, Investor partnership, Seller financing, FSBO. Why it matters: Money moves through this pin.', 'pin', 1, true, true),
  ('work', 'WORK', '🔨', 'Jobs related to property, construction, trades, or skills. Examples: Roofing job, Plumber needed, Laborers for demo, Snow removal, Landscaping, Cleanup crews, Handyman jobs, Project manager. Why it matters: Connects Minnesotans to local work instantly.', 'pin', 2, true, true),
  ('services', 'SERVICES', '🛠️', 'Local professionals offering licensed or general services. Examples: Electrician, Contractor, Attorney, Lender, Inspector, Appraiser, Accountant, Title company, Consultant. Why it matters: Centralizes Minnesota service providers.', 'pin', 3, true, true),
  ('rentals', 'RENTALS', '🏠', 'Anything rentable for short-term or long-term. Examples: Rental housing, Commercial space, Event venues, Tools for rent, Equipment for rent, Contractor gear, Extra storage space. Why it matters: People and businesses need access, not ownership.', 'pin', 4, true, true),
  ('projects', 'PROJECTS', '🏗️', 'Active or upcoming real estate or renovation projects. Examples: Home under renovation, Foundation issues, Flips in progress, City permits active, Before/after transformations, Need help with a remodel. Why it matters: Real transparency about what''s happening in Minnesota.', 'pin', 5, true, true),
  ('businesses', 'BUSINESSES', '🏪', 'Minnesota businesses pinning themselves on the map. Examples: Local shop, Contractor company, Property management office, Investor group, New business opening, Business advertising services. Why it matters: The Minnesota business directory becomes the map.', 'pin', 6, true, true),
  ('community', 'COMMUNITY', '👥', 'Everything people care about locally. Examples: Neighborhood news, Yard sales, School fundraisers, Lost & found, Local events, Recommendations, City discussions, Park activities. Why it matters: Turns the map into a Minnesota community hub.', 'pin', 7, true, true),
  ('safety', 'SAFETY', '🚨', 'Real, important local updates. Examples: Suspicious activity, Break-ins, Scam warnings, Wildlife alerts, Road closures, Fire or storm reports, Flood areas, Emergency notices. Why it matters: This becomes Minnesota''s neighborhood watch on a map.', 'pin', 8, true, true),
  ('help', 'HELP', '🤝', 'Requests or offers of support. Examples: Need help shoveling, Need a ride, Need food pantry info, Helping seniors, Borrow a tool, Helping after a storm, Asking for advice or guidance. Why it matters: Creates real Minnesota kindness — in action.', 'pin', 9, true, true),
  ('for-sale', 'FOR SALE', '🛒', 'Items that are not property or businesses. Examples: Trucks, Equipment, Tools, Appliances, Building materials, Trailers, Furniture. Why it matters: Local commerce without relying on Facebook Marketplace.', 'pin', 10, true, true),
  ('groups', 'GROUPS', '👨‍👩‍👧‍👦', 'Pins tied to a specific Minnesota group or association. Examples: Investment clubs, City community groups, Church-based groups, Local business associations, Neighborhood circles, Youth groups, County coalitions. Why it matters: Groups anchor people to local identity.', 'pin', 11, true, true),
  ('government', 'GOVERNMENT', '🏛️', 'Pins for official and civic resources. Examples: City hall, County offices, Permit updates, Zoning boundaries, Public meetings, Voting locations, Government alerts. Why it matters: Adds structure and legitimacy to the platform.', 'pin', 12, true, true)
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

COMMENT ON TABLE public.tags IS 'General tagging system for pins and other entities';
COMMENT ON COLUMN public.tags.entity_type IS 'Type of entity this tag applies to (pin, area, post, project, general)';
COMMENT ON COLUMN public.tags.display_order IS 'Order in which tags should be displayed (lower numbers first)';


