-- Consolidate tags down to 5 core tags
-- This migration reassigns pins from duplicate/similar tags to the 5 core tags,
-- then deletes the unused tags

-- ============================================================================
-- STEP 1: Identify tags to keep (5 core tags)
-- ============================================================================

-- Core tags to keep:
-- 1. distressed (🏠, distressed)
-- 2. property (🏠, property)
-- 3. jobs (👋, jobs)
-- 4. businesses (🏪, businesses)
-- 5. community (👥, community) - consolidating concern and for-sale into this

-- ============================================================================
-- STEP 2: Create mapping of tags to consolidate
-- ============================================================================

-- First, get the IDs of tags we want to keep
DO $$
DECLARE
  v_distressed_id UUID;
  v_property_id UUID;
  v_jobs_id UUID;
  v_businesses_id UUID;
  v_community_id UUID;
  
  -- Tags to consolidate/delete
  v_concern_id UUID;
  v_for_sale_id UUID;
  v_deals_id UUID;
  v_work_id UUID;
  v_services_id UUID;
  v_rentals_id UUID;
  v_projects_id UUID;
  v_project_id UUID;
  v_business_id UUID;
  v_safety_id UUID;
  v_groups_id UUID;
  v_government_id UUID;
BEGIN
  -- Get IDs of tags to keep
  SELECT id INTO v_distressed_id FROM public.tags WHERE slug = 'distressed' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_property_id FROM public.tags WHERE slug = 'property' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_jobs_id FROM public.tags WHERE slug = 'jobs' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_businesses_id FROM public.tags WHERE slug = 'businesses' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_community_id FROM public.tags WHERE slug = 'community' AND entity_type = 'pin' LIMIT 1;
  
  -- Get IDs of tags to consolidate/delete
  SELECT id INTO v_concern_id FROM public.tags WHERE slug = 'concern' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_for_sale_id FROM public.tags WHERE slug = 'for-sale' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_deals_id FROM public.tags WHERE slug = 'deals' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_work_id FROM public.tags WHERE slug = 'work' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_services_id FROM public.tags WHERE slug = 'services' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_rentals_id FROM public.tags WHERE slug = 'rentals' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_projects_id FROM public.tags WHERE slug = 'projects' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_project_id FROM public.tags WHERE slug = 'project' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_business_id FROM public.tags WHERE slug = 'business' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_safety_id FROM public.tags WHERE slug = 'safety' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_groups_id FROM public.tags WHERE slug = 'groups' AND entity_type = 'pin' LIMIT 1;
  SELECT id INTO v_government_id FROM public.tags WHERE slug = 'government' AND entity_type = 'pin' LIMIT 1;
  
  -- ============================================================================
  -- STEP 3: Reassign pins from tags being consolidated
  -- ============================================================================
  
  -- Reassign Concern -> COMMUNITY
  IF v_concern_id IS NOT NULL AND v_community_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_community_id 
    WHERE tag_id = v_concern_id;
    RAISE NOTICE 'Reassigned pins from Concern to COMMUNITY';
  END IF;
  
  -- Reassign FOR SALE -> COMMUNITY
  IF v_for_sale_id IS NOT NULL AND v_community_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_community_id 
    WHERE tag_id = v_for_sale_id;
    RAISE NOTICE 'Reassigned pins from FOR SALE to COMMUNITY';
  END IF;
  
  -- Reassign DEALS -> COMMUNITY (or could go to property, but community is more general)
  IF v_deals_id IS NOT NULL AND v_community_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_community_id 
    WHERE tag_id = v_deals_id;
    RAISE NOTICE 'Reassigned pins from DEALS to COMMUNITY';
  END IF;
  
  -- Reassign WORK -> JOBS
  IF v_work_id IS NOT NULL AND v_jobs_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_jobs_id 
    WHERE tag_id = v_work_id;
    RAISE NOTICE 'Reassigned pins from WORK to JOBS';
  END IF;
  
  -- Reassign SERVICES -> BUSINESSES
  IF v_services_id IS NOT NULL AND v_businesses_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_businesses_id 
    WHERE tag_id = v_services_id;
    RAISE NOTICE 'Reassigned pins from SERVICES to BUSINESSES';
  END IF;
  
  -- Reassign RENTALS -> PROPERTY
  IF v_rentals_id IS NOT NULL AND v_property_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_property_id 
    WHERE tag_id = v_rentals_id;
    RAISE NOTICE 'Reassigned pins from RENTALS to PROPERTY';
  END IF;
  
  -- Reassign PROJECTS -> DISTRESSED (projects often involve distressed properties)
  IF v_projects_id IS NOT NULL AND v_distressed_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_distressed_id 
    WHERE tag_id = v_projects_id;
    RAISE NOTICE 'Reassigned pins from PROJECTS to DISTRESSED';
  END IF;
  
  -- Reassign Project -> DISTRESSED
  IF v_project_id IS NOT NULL AND v_distressed_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_distressed_id 
    WHERE tag_id = v_project_id;
    RAISE NOTICE 'Reassigned pins from Project to DISTRESSED';
  END IF;
  
  -- Reassign Business -> BUSINESSES
  IF v_business_id IS NOT NULL AND v_businesses_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_businesses_id 
    WHERE tag_id = v_business_id;
    RAISE NOTICE 'Reassigned pins from Business to BUSINESSES';
  END IF;
  
  -- Reassign SAFETY -> COMMUNITY
  IF v_safety_id IS NOT NULL AND v_community_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_community_id 
    WHERE tag_id = v_safety_id;
    RAISE NOTICE 'Reassigned pins from SAFETY to COMMUNITY';
  END IF;
  
  -- Reassign GROUPS -> COMMUNITY
  IF v_groups_id IS NOT NULL AND v_community_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_community_id 
    WHERE tag_id = v_groups_id;
    RAISE NOTICE 'Reassigned pins from GROUPS to COMMUNITY';
  END IF;
  
  -- Reassign GOVERNMENT -> COMMUNITY
  IF v_government_id IS NOT NULL AND v_community_id IS NOT NULL THEN
    UPDATE public.pins 
    SET tag_id = v_community_id 
    WHERE tag_id = v_government_id;
    RAISE NOTICE 'Reassigned pins from GOVERNMENT to COMMUNITY';
  END IF;
  
  -- ============================================================================
  -- STEP 4: Delete tags that are no longer in use
  -- ============================================================================
  
  -- Temporarily change constraint to allow deletion
  ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_tag_id_fkey;
  
  -- Delete consolidated tags (only if they have no pins now)
  DELETE FROM public.tags WHERE id = v_concern_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_concern_id);
  DELETE FROM public.tags WHERE id = v_for_sale_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_for_sale_id);
  DELETE FROM public.tags WHERE id = v_deals_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_deals_id);
  DELETE FROM public.tags WHERE id = v_work_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_work_id);
  DELETE FROM public.tags WHERE id = v_services_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_services_id);
  DELETE FROM public.tags WHERE id = v_rentals_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_rentals_id);
  DELETE FROM public.tags WHERE id = v_projects_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_projects_id);
  DELETE FROM public.tags WHERE id = v_project_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_project_id);
  DELETE FROM public.tags WHERE id = v_business_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_business_id);
  DELETE FROM public.tags WHERE id = v_safety_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_safety_id);
  DELETE FROM public.tags WHERE id = v_groups_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_groups_id);
  DELETE FROM public.tags WHERE id = v_government_id AND NOT EXISTS (SELECT 1 FROM public.pins WHERE tag_id = v_government_id);
  
  -- Recreate constraint with RESTRICT
  ALTER TABLE public.pins
    ADD CONSTRAINT pins_tag_id_fkey 
    FOREIGN KEY (tag_id) 
    REFERENCES public.tags(id) 
    ON DELETE RESTRICT;
  
  RAISE NOTICE 'Consolidation complete. Remaining tags: DISTRESSED, PROPERTY, JOBS, BUSINESSES, COMMUNITY';
END $$;

-- ============================================================================
-- STEP 5: Update display orders for the 5 remaining tags
-- ============================================================================

UPDATE public.tags SET display_order = 1 WHERE slug = 'distressed' AND entity_type = 'pin';
UPDATE public.tags SET display_order = 2 WHERE slug = 'property' AND entity_type = 'pin';
UPDATE public.tags SET display_order = 3 WHERE slug = 'jobs' AND entity_type = 'pin';
UPDATE public.tags SET display_order = 4 WHERE slug = 'businesses' AND entity_type = 'pin';
UPDATE public.tags SET display_order = 5 WHERE slug = 'community' AND entity_type = 'pin';

