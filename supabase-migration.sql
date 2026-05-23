-- Migration: Add public_order_id to orders table

-- 1. Add the column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_order_id TEXT UNIQUE;

-- 2. Populate for existing records using the suffix of their uuid
-- (This handles old IMPURA UUIDs created with fake '13904a50-dec0-4bda-8000-' prefix)
UPDATE orders 
SET public_order_id = 'IMPURA' || RIGHT(id::text, 12)
WHERE public_order_id IS NULL AND id::text LIKE '13904a50-dec0-4bda-8000-%';

-- 3. Populate for any other existing orders randomly to satisfy uniqueness
UPDATE orders 
SET public_order_id = 'IMPURA' || lpad(floor(random() * 1000000000000)::text, 12, '0')
WHERE public_order_id IS NULL;

-- Migration: Warranty Options

-- Create product_warranties table
CREATE TABLE IF NOT EXISTS product_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  extra_price NUMERIC NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add warranty columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS warranty_id UUID REFERENCES product_warranties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS warranty_title TEXT,
  ADD COLUMN IF NOT EXISTS warranty_price NUMERIC,
  ADD COLUMN IF NOT EXISTS warranty_duration_days INTEGER;
