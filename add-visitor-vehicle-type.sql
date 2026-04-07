-- Add vehicle_type column to Visitor table
ALTER TABLE Visitor ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) NULL;
