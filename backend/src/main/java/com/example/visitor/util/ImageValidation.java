package com.example.visitor.util;

import java.util.Base64;
import java.util.regex.Pattern;

/**
 * Validates base64 data-URI photo uploads (visitor registration / pre-registration).
 * Rejects non-image types, oversized payloads, and corrupted base64 before it
 * ever reaches the database.
 */
public final class ImageValidation {

    private static final Pattern DATA_URI = Pattern.compile(
        "^data:image/(jpeg|jpg|png|webp);base64,(.+)$", Pattern.CASE_INSENSITIVE
    );

    // Decoded byte size cap — generous for a compressed face photo, well under
    // the 16MB MEDIUMTEXT column ceiling.
    private static final int MAX_DECODED_BYTES = 5 * 1024 * 1024;

    private ImageValidation() {}

    /** Returns an error message if the photo is invalid, or null if it's valid. */
    public static String validate(String photoDataUri) {
        if (photoDataUri == null || photoDataUri.isBlank()) {
            return "Photo is required.";
        }
        var matcher = DATA_URI.matcher(photoDataUri.trim());
        if (!matcher.matches()) {
            return "Photo must be a JPEG, PNG, or WEBP image.";
        }
        String base64Payload = matcher.group(2);
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64Payload);
        } catch (IllegalArgumentException e) {
            return "Photo file is corrupted.";
        }
        if (decoded.length == 0) {
            return "Photo file is corrupted.";
        }
        if (decoded.length > MAX_DECODED_BYTES) {
            return "Photo is too large (max 5MB).";
        }
        return null;
    }
}
