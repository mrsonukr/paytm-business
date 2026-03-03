-- Check if payment_link column exists and can store JSON data
-- This migration ensures the remote database is up to date

-- Add any missing columns (if they don't exist)
ALTER TABLE payment_orders ADD COLUMN qr_code_data TEXT DEFAULT '';

-- Update existing records to ensure they have proper structure
UPDATE payment_orders SET qr_code_data = '' WHERE qr_code_data IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON payment_orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON payment_orders(status);
