-- Add address column to pins table

ALTER TABLE public.pins ADD COLUMN address TEXT NOT NULL DEFAULT '';

