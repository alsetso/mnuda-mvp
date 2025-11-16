-- Migrate data from credit_restoration_requests to new credit system
-- This migration extracts data from the old request-based system to the new profile-based system

-- Step 1: Migrate credit_restoration_requests to credit_profiles
-- For each user, create one credit_profile from their latest request
INSERT INTO public.credit_profiles (
  member_id,
  first_name,
  last_name,
  middle_name,
  date_of_birth,
  ssn,
  email,
  phone,
  address,
  previous_addresses,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT ON (crr.user_id)
  m.id AS member_id,
  (crr.identity_details->>'firstName')::TEXT AS first_name,
  (crr.identity_details->>'lastName')::TEXT AS last_name,
  (crr.identity_details->>'middleName')::TEXT AS middle_name,
  (crr.identity_details->>'dateOfBirth')::DATE AS date_of_birth,
  (crr.identity_details->>'ssn')::TEXT AS ssn,
  (crr.identity_details->>'email')::TEXT AS email,
  (crr.identity_details->>'phone')::TEXT AS phone,
  jsonb_build_object(
    'street', crr.identity_details->'address'->>'street',
    'city', crr.identity_details->'address'->>'city',
    'state', crr.identity_details->'address'->>'state',
    'zip_code', crr.identity_details->'address'->>'zipCode'
  ) AS address,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'street', pa->>'street',
        'city', pa->>'city',
        'state', pa->>'state',
        'zip_code', pa->>'zipCode',
        'years_at_address', pa->>'yearsAtAddress'
      )
    ) FROM jsonb_array_elements(crr.identity_details->'previousAddresses') pa),
    '[]'::jsonb
  ) AS previous_addresses,
  CASE 
    WHEN crr.status = 'completed' THEN 'active'
    WHEN crr.status = 'cancelled' THEN 'archived'
    ELSE 'active'
  END AS status,
  crr.created_at,
  crr.updated_at
FROM public.credit_restoration_requests crr
JOIN public.members m ON m.id = crr.user_id
WHERE crr.identity_details IS NOT NULL
  AND crr.identity_details->>'firstName' IS NOT NULL
  AND crr.identity_details->>'lastName' IS NOT NULL
ORDER BY crr.user_id, crr.created_at DESC
ON CONFLICT (member_id) DO NOTHING;

-- Step 2: Migrate report URLs to credit_reports
-- Create credit_reports records from the report URLs in credit_restoration_requests
INSERT INTO public.credit_reports (
  credit_profile_id,
  bureau,
  storage_path,
  file_name,
  uploaded_at,
  parsing_status,
  created_at,
  updated_at
)
SELECT 
  cp.id AS credit_profile_id,
  'experian' AS bureau,
  crr.experian_report_url AS storage_path,
  -- Extract filename from URL (last part after /)
  COALESCE(
    substring(crr.experian_report_url from '[^/]+$'),
    'experian_report.pdf'
  ) AS file_name,
  crr.created_at AS uploaded_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.credit_negatives cn 
      WHERE cn.credit_profile_id = cp.id 
      AND cn.bureau = 'experian'
    ) THEN 'completed'
    ELSE 'pending'
  END AS parsing_status,
  crr.created_at,
  crr.updated_at
FROM public.credit_restoration_requests crr
JOIN public.credit_profiles cp ON cp.member_id = crr.user_id
WHERE crr.experian_report_url IS NOT NULL
  AND crr.experian_report_url != ''
ON CONFLICT (credit_profile_id, bureau) DO NOTHING;

INSERT INTO public.credit_reports (
  credit_profile_id,
  bureau,
  storage_path,
  file_name,
  uploaded_at,
  parsing_status,
  created_at,
  updated_at
)
SELECT 
  cp.id AS credit_profile_id,
  'equifax' AS bureau,
  crr.equifax_report_url AS storage_path,
  COALESCE(
    substring(crr.equifax_report_url from '[^/]+$'),
    'equifax_report.pdf'
  ) AS file_name,
  crr.created_at AS uploaded_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.credit_negatives cn 
      WHERE cn.credit_profile_id = cp.id 
      AND cn.bureau = 'equifax'
    ) THEN 'completed'
    ELSE 'pending'
  END AS parsing_status,
  crr.created_at,
  crr.updated_at
FROM public.credit_restoration_requests crr
JOIN public.credit_profiles cp ON cp.member_id = crr.user_id
WHERE crr.equifax_report_url IS NOT NULL
  AND crr.equifax_report_url != ''
ON CONFLICT (credit_profile_id, bureau) DO NOTHING;

INSERT INTO public.credit_reports (
  credit_profile_id,
  bureau,
  storage_path,
  file_name,
  uploaded_at,
  parsing_status,
  created_at,
  updated_at
)
SELECT 
  cp.id AS credit_profile_id,
  'transunion' AS bureau,
  crr.transunion_report_url AS storage_path,
  COALESCE(
    substring(crr.transunion_report_url from '[^/]+$'),
    'transunion_report.pdf'
  ) AS file_name,
  crr.created_at AS uploaded_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.credit_negatives cn 
      WHERE cn.credit_profile_id = cp.id 
      AND cn.bureau = 'transunion'
    ) THEN 'completed'
    ELSE 'pending'
  END AS parsing_status,
  crr.created_at,
  crr.updated_at
FROM public.credit_restoration_requests crr
JOIN public.credit_profiles cp ON cp.member_id = crr.user_id
WHERE crr.transunion_report_url IS NOT NULL
  AND crr.transunion_report_url != ''
ON CONFLICT (credit_profile_id, bureau) DO NOTHING;

-- Step 3: Update credit_negatives foreign keys
-- Map credit_restoration_request_id to credit_profile_id
UPDATE public.credit_negatives cn
SET credit_profile_id = cp.id
FROM public.credit_restoration_requests crr
JOIN public.credit_profiles cp ON cp.member_id = crr.user_id
WHERE cn.credit_profile_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.credit_restoration_requests crr2
    WHERE crr2.id = (
      SELECT credit_restoration_request_id 
      FROM public.credit_negatives cn2 
      WHERE cn2.id = cn.id
      LIMIT 1
    )
  );

-- Note: The above UPDATE might not work if the column was already renamed.
-- If credit_negatives still has credit_restoration_request_id, use this instead:
-- UPDATE public.credit_negatives cn
-- SET credit_profile_id = cp.id
-- FROM public.credit_restoration_requests crr
-- JOIN public.credit_profiles cp ON cp.member_id = crr.user_id
-- WHERE cn.credit_restoration_request_id = crr.id;

-- Step 4: Archive old table
-- Rename credit_restoration_requests to credit_restoration_requests_archive
ALTER TABLE public.credit_restoration_requests RENAME TO credit_restoration_requests_archive;

-- Remove RLS policies from archived table (make it read-only for admins)
DROP POLICY IF EXISTS "Users can view own credit restoration requests" ON public.credit_restoration_requests_archive;
DROP POLICY IF EXISTS "Users can create own credit restoration requests" ON public.credit_restoration_requests_archive;
DROP POLICY IF EXISTS "Users can update own credit restoration requests" ON public.credit_restoration_requests_archive;

-- Grant read-only access (users can still view their own archived requests)
CREATE POLICY "Users can view own archived credit restoration requests"
  ON public.credit_restoration_requests_archive
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

