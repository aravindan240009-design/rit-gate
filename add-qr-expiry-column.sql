-- Add qr_expires_at column to QR table (midnight expiry for single & bulk gate passes)
ALTER TABLE `QR`
  ADD COLUMN `qr_expires_at` DATETIME NULL COMMENT 'Midnight of the day the QR was generated — QR is invalid after this time';

-- Add qr_expires_at column to Gatepass table
ALTER TABLE `Gatepass`
  ADD COLUMN IF NOT EXISTS `qr_expires_at` DATETIME NULL COMMENT 'Midnight of the day the QR was generated — QR is invalid after this time';
