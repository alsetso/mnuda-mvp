-- Seed onboarding questions for each account type
-- Questions are shown after user selects their account_type

-- ============================================================================
-- HOMEOWNER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('homeowner', 'property_address', 'What property are you dealing with?', 'Enter the address of the property you need help with', 'address', NULL, true, 10),
('homeowner', 'help_needed', 'What do you need help with right now?', NULL, 'single_select', '{"values": ["Selling", "Repairs/Bids", "Cleanup/Junk Removal", "Rental/tenant issues", "Neighborhood concern"]}', true, 20),
('homeowner', 'urgency', 'How urgent is this?', 'Rate from 1 (not urgent) to 5 (very urgent)', 'range', '{"min": 1, "max": 5, "step": 1}', true, 30),
('homeowner', 'considering_selling', 'Are you considering selling the property?', NULL, 'boolean', NULL, false, 40),
('homeowner', 'property_condition', 'What''s the current condition?', NULL, 'single_select', '{"values": ["Light repairs", "Moderate", "Heavy repairs"]}', false, 50);

-- ============================================================================
-- RESIDENT Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('renter', 'neighborhood_focus', 'What neighborhood do you care about?', 'Enter an address or select a radius', 'location', NULL, true, 10),
('renter', 'stay_updated_on', 'What would you like to stay updated on?', NULL, 'multi_select', '{"values": ["Safety", "Development", "Cleanup", "Local activity"]}', true, 20),
('renter', 'anonymous_reports', 'Would you like to report concerns anonymously?', NULL, 'boolean', NULL, false, 30),
('renter', 'rent_or_own', 'Do you rent or own?', NULL, 'single_select', '{"values": ["Own", "Rent"]}', true, 40),
('renter', 'area_alerts', 'Would you like alerts for changes in your area?', NULL, 'boolean', NULL, false, 50);

-- ============================================================================
-- INVESTOR Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('investor', 'invest_counties', 'What counties do you invest in?', NULL, 'multi_select', '{"values": ["Hennepin", "Ramsey", "Dakota", "Anoka", "Washington", "Carver", "Scott", "Wright", "Sherburne", "Stearns", "Olmsted", "St. Louis", "Other"]}', true, 10),
('investor', 'deal_types', 'What type of deals are you looking for?', NULL, 'multi_select', '{"values": ["Fix & Flip", "BRRRR", "Rentals", "Land"]}', true, 20),
('investor', 'price_range', 'What''s your ideal price range?', 'Enter minimum and maximum', 'string', NULL, true, 30),
('investor', 'property_condition', 'What''s your preferred property condition?', NULL, 'single_select', '{"values": ["Light rehab", "Medium rehab", "Heavy rehab"]}', true, 40),
('investor', 'close_speed', 'How quickly can you close?', NULL, 'single_select', '{"values": ["0-7 days", "7-14 days", "30+ days"]}', true, 50);

-- ============================================================================
-- REALTOR Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('realtor', 'service_areas', 'What areas do you serve?', NULL, 'multi_select', '{"values": ["Hennepin", "Ramsey", "Dakota", "Anoka", "Washington", "Carver", "Scott", "Wright", "Sherburne", "Stearns", "Olmsted", "St. Louis", "Other"]}', true, 10),
('realtor', 'property_specialties', 'What property types do you specialize in?', NULL, 'multi_select', '{"values": ["Single-family", "Multi-family", "Land", "Commercial"]}', true, 20),
('realtor', 'off_market_opportunities', 'Are you open to off-market opportunities?', NULL, 'boolean', NULL, false, 30),
('realtor', 'homeowner_requests', 'Do you want homeowner repair/sell requests sent to you?', NULL, 'boolean', NULL, false, 40),
('realtor', 'license_number', 'What is your license number?', 'Optional but helps build trust', 'string', NULL, false, 50);

-- ============================================================================
-- WHOLESALER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('wholesaler', 'wholesale_counties', 'What counties do you wholesale in?', NULL, 'multi_select', '{"values": ["Hennepin", "Ramsey", "Dakota", "Anoka", "Washington", "Carver", "Scott", "Wright", "Sherburne", "Stearns", "Olmsted", "St. Louis", "Other"]}', true, 10),
('wholesaler', 'property_types', 'What type of properties do you assign?', NULL, 'multi_select', '{"values": ["Single-family", "Multi-family", "Land"]}', true, 20),
('wholesaler', 'arv_range', 'What''s your typical ARV range?', 'Enter minimum and maximum ARV', 'string', NULL, true, 30),
('wholesaler', 'deal_size', 'What''s your ideal deal size?', 'Enter minimum and maximum deal size', 'string', NULL, true, 40),
('wholesaler', 'buyers_ready', 'Do you have buyers ready now?', NULL, 'boolean', NULL, true, 50);

-- ============================================================================
-- CONTRACTOR Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('contractor', 'work_types', 'What type of work do you do?', NULL, 'multi_select', '{"values": ["Roofing", "Plumbing", "Electrical", "HVAC", "Flooring", "Painting", "Carpentry", "Landscaping", "Foundation", "General Contracting"]}', true, 10),
('contractor', 'service_areas', 'What areas do you serve?', 'Enter radius or select counties', 'location', NULL, true, 20),
('contractor', 'licensed_insured', 'Are you licensed/insured?', NULL, 'boolean', NULL, true, 30),
('contractor', 'job_size_preference', 'What job size do you prefer?', NULL, 'single_select', '{"values": ["Small", "Medium", "Large"]}', false, 40),
('contractor', 'availability', 'When are you available to start jobs?', NULL, 'single_select', '{"values": ["Immediately", "1-2 weeks", "Later"]}', true, 50);

-- ============================================================================
-- SERVICE_PROVIDER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('service_provider', 'service_type', 'What service do you offer?', NULL, 'single_select', '{"values": ["Insurance", "Title", "Inspections", "Cleanup", "Plumbing", "Junk Removal", "Snow Removal", "Lawn Care", "Handyman", "Photography", "Other"]}', true, 10),
('service_provider', 'service_area', 'What area do you serve?', 'Enter radius or select counties', 'location', NULL, true, 20),
('service_provider', 'emergency_services', 'Do you offer emergency or rush services?', NULL, 'boolean', NULL, false, 30),
('service_provider', 'response_time', 'What is your typical response time?', NULL, 'single_select', '{"values": ["Same day", "1-2 days", "3-5 days", "1 week+"]}', false, 40),
('service_provider', 'minimum_project_size', 'Do you have a minimum project size?', 'Enter minimum if applicable', 'string', NULL, false, 50);

-- ============================================================================
-- DEVELOPER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('developer', 'development_types', 'What type of development do you do?', NULL, 'multi_select', '{"values": ["Multi-family", "Infill", "Commercial", "Land subdivision"]}', true, 10),
('developer', 'target_areas', 'What areas are you targeting?', NULL, 'multi_select', '{"values": ["Hennepin", "Ramsey", "Dakota", "Anoka", "Washington", "Carver", "Scott", "Wright", "Sherburne", "Stearns", "Olmsted", "St. Louis", "Other"]}', true, 20),
('developer', 'project_size', 'What project sizes are you looking for?', 'Enter units or budget range', 'string', NULL, false, 30),
('developer', 'needs', 'Do you need partners, land, or projects?', NULL, 'multi_select', '{"values": ["Partners", "Land", "Projects", "Financing"]}', false, 40),
('developer', 'zoning_interests', 'What zoning categories are you interested in?', NULL, 'multi_select', '{"values": ["Residential", "Commercial", "Mixed-use", "Industrial", "Agricultural"]}', false, 50);

-- ============================================================================
-- PROPERTY_MANAGER Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('property_manager', 'units_managed', 'How many units do you manage?', NULL, 'number', NULL, true, 10),
('property_manager', 'unit_locations', 'Where are your units located?', 'Enter counties or cities', 'location', NULL, true, 20),
('property_manager', 'common_issues', 'What issues do you need help with most?', NULL, 'multi_select', '{"values": ["Maintenance", "Leasing", "Repairs"]}', true, 30),
('property_manager', 'prefer_network_contractors', 'Do you prefer in-network contractors?', NULL, 'boolean', NULL, false, 40),
('property_manager', 'work_urgency', 'How quickly do you need work done?', NULL, 'single_select', '{"values": ["Immediately", "1-2 weeks", "1 month+"]}', true, 50);

-- ============================================================================
-- BUSINESS Questions
-- ============================================================================

INSERT INTO public.onboarding_questions (account_type, key, label, description, field_type, options, required, sort_order) VALUES
('business', 'business_type', 'What type of business are you?', NULL, 'single_select', '{"values": ["Small Business", "Local Service", "Municipal", "Non-profit", "Other"]}', true, 10),
('business', 'business_location', 'Where are you located?', 'Enter address or city', 'address', NULL, true, 20),
('business', 'service_radius', 'Who do you serve?', NULL, 'single_select', '{"values": ["Locals only", "Radius", "Statewide"]}', true, 30),
('business', 'business_category', 'What category are you in?', NULL, 'single_select', '{"values": ["Retail", "Food & Dining", "Professional Services", "Construction", "Real Estate", "Other"]}', false, 40),
('business', 'visibility_boosts', 'Do you want visibility boosts?', NULL, 'boolean', NULL, false, 50);



