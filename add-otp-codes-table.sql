-- Durable OTP storage. Replaces the in-memory OTP maps in AuthController so that
-- pending OTPs survive backend restarts (Render free tier restarts frequently).
CREATE TABLE IF NOT EXISTS otp_codes (
    email           VARCHAR(255) PRIMARY KEY,
    hashed_otp      VARCHAR(255) NOT NULL,
    created_at      DATETIME     NOT NULL,
    expires_at      DATETIME     NOT NULL,
    attempts        INT          NOT NULL DEFAULT 0,
    last_request_at DATETIME     NULL
);

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'otp_codes';
