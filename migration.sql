ALTER TABLE merchants ADD COLUMN merchant_key TEXT DEFAULT '';
CREATE INDEX idx_merchants_key ON merchants(merchant_key);
