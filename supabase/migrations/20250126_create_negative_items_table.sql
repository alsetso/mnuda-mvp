-- Create negative_items table to store parsed negative credit items
-- Links to credit restoration requests and classifies items using enums

CREATE TABLE IF NOT EXISTS public.negative_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_restoration_request_id UUID NOT NULL REFERENCES public.credit_restoration_requests(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL CHECK (bureau IN ('experian', 'equifax', 'transunion')),
  
  -- Item Classification
  item_type negative_item_type NOT NULL,
  item_subtype negative_item_subtype,
  item_status negative_item_status NOT NULL,
  
  -- Item Details
  account_name TEXT,
  account_number TEXT,
  creditor_name TEXT,
  original_creditor TEXT,
  collection_agency TEXT,
  
  -- Dates
  date_opened DATE,
  date_reported DATE,
  date_of_first_delinquency DATE,
  date_closed DATE,
  last_payment_date DATE,
  
  -- Financial Information
  balance_amount DECIMAL(12, 2),
  original_amount DECIMAL(12, 2),
  credit_limit DECIMAL(12, 2),
  monthly_payment DECIMAL(12, 2),
  
  -- Status Information
  is_paid BOOLEAN DEFAULT false,
  is_disputed BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  dispute_status TEXT,
  
  -- Compliance Violations
  compliance_violations compliance_violation_type[],
  violation_details JSONB,
  
  -- Parsing Metadata
  raw_text TEXT, -- Original text from PDF
  page_number INTEGER,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00 for AI parsing confidence
  parsing_method TEXT CHECK (parsing_method IN ('manual', 'ai', 'hybrid')),
  parsed_by_user_id UUID REFERENCES auth.users(id),
  parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Review Status
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'disputed', 'resolved')),
  reviewed_by_user_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_negative_items_request_id ON public.negative_items(credit_restoration_request_id);
CREATE INDEX IF NOT EXISTS idx_negative_items_bureau ON public.negative_items(bureau);
CREATE INDEX IF NOT EXISTS idx_negative_items_type ON public.negative_items(item_type);
CREATE INDEX IF NOT EXISTS idx_negative_items_status ON public.negative_items(item_status);
CREATE INDEX IF NOT EXISTS idx_negative_items_review_status ON public.negative_items(review_status);
CREATE INDEX IF NOT EXISTS idx_negative_items_parsing_method ON public.negative_items(parsing_method);

-- Trigger to update updated_at
CREATE TRIGGER update_negative_items_updated_at 
    BEFORE UPDATE ON public.negative_items 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.negative_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view negative items from their own requests
CREATE POLICY "Users can view own negative items"
  ON public.negative_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_restoration_requests
      WHERE id = negative_items.credit_restoration_request_id
      AND user_id = auth.uid()
    )
  );

-- Service accounts can insert negative items (for parsing)
CREATE POLICY "Service can insert negative items"
  ON public.negative_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_restoration_requests
      WHERE id = negative_items.credit_restoration_request_id
      AND user_id = auth.uid()
    )
  );

-- Users can update their own negative items
CREATE POLICY "Users can update own negative items"
  ON public.negative_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_restoration_requests
      WHERE id = negative_items.credit_restoration_request_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_restoration_requests
      WHERE id = negative_items.credit_restoration_request_id
      AND user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.negative_items TO authenticated;



