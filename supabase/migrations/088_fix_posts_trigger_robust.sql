-- Fix posts trigger to be more robust and handle edge cases
-- This ensures the trigger doesn't fail on INSERT/UPDATE

-- ============================================================================
-- STEP 1: Make the trigger function more robust
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_post_media_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Safely determine media type, defaulting to 'text' if anything fails
  BEGIN
    NEW.media_type := public.determine_post_media_type(COALESCE(NEW.images, '[]'::jsonb));
  EXCEPTION
    WHEN OTHERS THEN
      -- If function fails, default to 'text'
      NEW.media_type := 'text'::public.post_media_type;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Ensure trigger exists and is correct
-- ============================================================================

DROP TRIGGER IF EXISTS update_post_media_type_trigger ON public.posts;

CREATE TRIGGER update_post_media_type_trigger
  BEFORE INSERT OR UPDATE OF images, media_type ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_media_type();

-- ============================================================================
-- STEP 3: Make determine_post_media_type more robust
-- ============================================================================

CREATE OR REPLACE FUNCTION public.determine_post_media_type(media_array JSONB)
RETURNS public.post_media_type AS $$
DECLARE
  has_image BOOLEAN := FALSE;
  has_video BOOLEAN := FALSE;
  media_item JSONB;
BEGIN
  -- If empty array or null, return text
  IF media_array IS NULL OR jsonb_typeof(media_array) != 'array' OR jsonb_array_length(media_array) = 0 THEN
    RETURN 'text'::public.post_media_type;
  END IF;

  -- Check each media item safely
  FOR media_item IN SELECT * FROM jsonb_array_elements(media_array)
  LOOP
    IF media_item IS NOT NULL AND jsonb_typeof(media_item) = 'object' THEN
      IF (media_item->>'type') = 'image' THEN
        has_image := TRUE;
      ELSIF (media_item->>'type') = 'video' THEN
        has_video := TRUE;
      END IF;
    END IF;
  END LOOP;

  -- Determine type
  IF has_image AND has_video THEN
    RETURN 'mixed'::public.post_media_type;
  ELSIF has_video THEN
    RETURN 'video'::public.post_media_type;
  ELSIF has_image THEN
    RETURN 'image'::public.post_media_type;
  ELSE
    RETURN 'text'::public.post_media_type;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Default to text on any error
    RETURN 'text'::public.post_media_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 4: Update any existing posts with NULL media_type
-- ============================================================================

UPDATE public.posts
SET media_type = public.determine_post_media_type(COALESCE(images, '[]'::jsonb))
WHERE media_type IS NULL;







