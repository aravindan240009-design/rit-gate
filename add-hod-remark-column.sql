-- Add hod_remark column to Gatepass table if it doesn't exist
ALTER TABLE Gatepass ADD COLUMN IF NOT EXISTS hod_remark TEXT NULL;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Gatepass' AND COLUMN_NAME = 'hod_remark';
