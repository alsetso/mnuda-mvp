-- Seed onboarding questions for each profile type
-- These questions are shown during onboarding to collect location-based data

-- ============================================================================
-- RENTER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('renter', 'current_location', 'Where do you currently live or spend most of your time?', 'This connects you to local housing options, safety alerts, and community activity.', 'map_point', NULL, true, 10, true);

-- ============================================================================
-- INVESTOR Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('investor', 'investment_areas', 'Show us the areas in Minnesota where you want to find properties.', 'This defines your buy-box geography and drives deal matching.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- REALTOR Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('realtor', 'service_territory', 'Outline the areas where you primarily serve clients.', 'This builds a visual "territory" for clients, listings, and lead routing.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- WHOLESALER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('wholesaler', 'deal_flow_zones', 'Mark the areas where you typically source or assign deals.', 'This identifies your deal flow zones and sends you targeted distressed property alerts.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- CONTRACTOR Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('contractor', 'service_area', 'Draw the area where you take jobs or offer services.', 'This matches you to homeowners needing bids within your service radius.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- SERVICES Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('services', 'operating_area', 'Mark the geographic area where your service business operates.', 'This routes homeowners, renters, investors, etc. to you based on location.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- DEVELOPER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('developer', 'development_zones', 'Highlight the zones where you''re looking for land or development opportunities.', 'This shows where infill, multi-family, or mixed-use opportunities are wanted.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- PROPERTY_MANAGER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('property_manager', 'management_area', 'Draw the area where you currently manage properties or want new doors.', 'This routes landlords and small multi-family owners to you.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- ORGANIZATION Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('organization', 'focus_region', 'Outline the community or region your organization focuses on improving.', 'This shows residents local programs, grants, incentives, and community resources.', 'map_area', NULL, true, 10, true);


