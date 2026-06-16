-- Add route_type column to Gatepass table if it doesn't exist.
-- null         = normal approval flow (unchanged)
-- HOSTEL_WARDEN = after-3PM hosteler request routed to the gender-matched hostel warden
ALTER TABLE Gatepass ADD COLUMN IF NOT EXISTS route_type VARCHAR(50) NULL;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Gatepass' AND COLUMN_NAME = 'route_type';
