-- Add JSONB column for structured rich text content
-- Phase 2: Enhanced storage for rich text editor

ALTER TABLE public.credit_letters 
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Add index for JSON queries
CREATE INDEX IF NOT EXISTS idx_credit_letters_content_json 
ON public.credit_letters USING GIN (content_json);

-- Update column comments
COMMENT ON COLUMN public.credit_letters.content IS 'HTML content for rendering (legacy/compatibility)';
COMMENT ON COLUMN public.credit_letters.content_json IS 'Structured JSON content from rich text editor (TipTap/ProseMirror format)';

-- Migrate existing HTML content to JSONB format (optional, for backward compatibility)
-- This creates a simple paragraph structure from existing text content
UPDATE public.credit_letters 
SET content_json = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', content)
      )
    )
  )
)
WHERE content IS NOT NULL 
  AND content_json IS NULL 
  AND content != '';



