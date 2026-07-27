-- OTP hardening: burst-window counters + failed-attempt lockout.
--
-- Adds the columns OtpService needs to enforce
--   * max 5 OTP sends per 10-minute rolling window (request_count/window_started_at)
--   * a temporary lock after 5 incorrect OTP attempts   (locked_until)
--
-- Safe to re-run: each ADD COLUMN is guarded by an information_schema check,
-- because MySQL has no ADD COLUMN IF NOT EXISTS.

-- request_count ------------------------------------------------------------
SET @ddl = (
  SELECT IF(COUNT(*) > 0,
    'SELECT ''otp_codes.request_count already exists''',
    'ALTER TABLE otp_codes ADD COLUMN request_count INT NULL DEFAULT 0')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'otp_codes'
    AND COLUMN_NAME  = 'request_count'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- window_started_at --------------------------------------------------------
SET @ddl = (
  SELECT IF(COUNT(*) > 0,
    'SELECT ''otp_codes.window_started_at already exists''',
    'ALTER TABLE otp_codes ADD COLUMN window_started_at DATETIME NULL')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'otp_codes'
    AND COLUMN_NAME  = 'window_started_at'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- locked_until -------------------------------------------------------------
SET @ddl = (
  SELECT IF(COUNT(*) > 0,
    'SELECT ''otp_codes.locked_until already exists''',
    'ALTER TABLE otp_codes ADD COLUMN locked_until DATETIME NULL')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'otp_codes'
    AND COLUMN_NAME  = 'locked_until'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- hashed_otp is blanked (not deleted) when an OTP is consumed/expired, so the
-- row survives to keep carrying its throttle counters. Allow the empty string.
ALTER TABLE otp_codes MODIFY COLUMN hashed_otp VARCHAR(255) NOT NULL DEFAULT '';

-- Cleanup scans by expiry; index it so the 15-minute purge stays cheap.
SET @ddl = (
  SELECT IF(COUNT(*) > 0,
    'SELECT ''idx_otp_codes_expires_at already exists''',
    'CREATE INDEX idx_otp_codes_expires_at ON otp_codes (expires_at)')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'otp_codes'
    AND INDEX_NAME   = 'idx_otp_codes_expires_at'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otp_codes'
ORDER BY ORDINAL_POSITION;
