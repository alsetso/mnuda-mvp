-- Add additional onboarding questions for realtors
-- Includes office locations, current listings, license info, and other map-focused questions

-- ============================================================================
-- REALTOR Additional Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
-- Office locations (not required, multiple allowed)
('realtor', 'office_locations', 'Where are your office locations?', 'Add your brokerage office locations. This is optional.', 'map_point', '{"allowMultiple": true}', false, 20, true),

-- Current listings (multiple allowed)
('realtor', 'current_listings', 'Where are your current listings?', 'Pin your active listings on the map.', 'map_point', '{"allowMultiple": true}', false, 30, true),

-- License number
('realtor', 'license_number', 'What is your real estate license number?', NULL, 'text', NULL, false, 40, true),

-- Brokerage
('realtor', 'brokerage', 'What brokerage are you affiliated with?', NULL, 'text', NULL, false, 50, true);

