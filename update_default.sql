-- Update existing records to have status = 0 (Inactive) if they are currently NULL or 1
UPDATE merchants SET status = 0 WHERE status IS NULL OR status = 1;
