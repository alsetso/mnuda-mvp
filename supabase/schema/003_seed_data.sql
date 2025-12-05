-- ============================================================================
-- CONSOLIDATED SEED DATA
-- This file represents the CURRENT STATE of seed data after all migrations
-- Use this as a reference for understanding initial data
-- DO NOT run this on existing databases - migrations handle the history
-- ============================================================================

-- ============================================================================
-- ONBOARDING QUESTIONS
-- ============================================================================

-- Delete any existing questions
DELETE FROM public.onboarding_questions;

-- Reset sequence
ALTER SEQUENCE IF EXISTS public.onboarding_questions_id_seq RESTART WITH 1;

-- Seed single question for each profile type
INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
-- Homeowner: map_point (location of property)
('homeowner', 'property_location', 'Where is your property located?', 'Mark the location of your property on the map. You can add multiple properties.', 'map_point', NULL, true, 10, true),

-- Realtor: map_area (service territory)
('realtor', 'service_territory', 'Outline your service territory', 'Draw the areas where you serve clients. You can add multiple territories.', 'map_area', NULL, true, 10, true),

-- Wholesaler: map_area (deal flow zones)
('wholesaler', 'deal_flow_zones', 'Mark your deal flow zones', 'Draw the areas where you source or assign deals. You can add multiple zones.', 'map_area', NULL, true, 10, true),

-- Investor: map_area (investment areas)
('investor', 'investment_areas', 'Show us your investment areas', 'Draw the areas in Minnesota where you want to find properties. You can add multiple areas.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- PINS (Reference Data)
-- Note: Pins are reference data seeded in migration 003
-- This is a summary - full seed data is in migration 003_create_pins_table.sql
-- ============================================================================

-- PROPERTY category pins (17 pins)
-- For Sale, For Rent, Land, FSBO, Pocket, Coming, Lead, Distressed, Vacant,
-- Abandoned, Pre-Foreclosure, Auction, Tax-Delinquent, Contract, Assignment, JV, Parcel

-- WORK category pins (17 pins)
-- Labor, Handyman, Snow, Lawn, Cleanup, Moving, Plow, Roof, Plumbing, Electrical,
-- HVAC, Carpentry, Painting, Service, Contractor, Roofing, Cleaning

-- PROJECT category pins (8 pins)
-- NewRoof, Renovation, Flip, Foundation, Addition, Build, Demo, Completed

-- CONCERN category pins (13 pins)
-- Suspicious, BreakIn, Fire, Flood, Unsafe, AbandonedCar, Yard, Pothole,
-- Trash, Water, Animal, Violation, Concern

-- BUSINESS category pins (7 pins)
-- HQ, Yard, Hiring, Equipment, Warehouse, Adjuster, Subcontract

-- OPPORTUNITY category pins (5 pins)
-- Rezoning, Environmental, Development, CityProject, Permit

-- Total: 67 pins across 6 categories
-- See migration 003_create_pins_table.sql for complete seed data


