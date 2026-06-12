package com.example.visitor.util;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Parses client-supplied ISO datetime strings into IST wall time.
 *
 * JS clients send Date.toISOString() which is UTC with a 'Z' suffix.
 * LocalDateTime.parse silently drops the offset, storing UTC wall time
 * that then displays 5h30m behind IST. This converts offset-carrying
 * strings to IST first; bare strings are assumed to already be IST.
 */
public final class DateTimeParser {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private DateTimeParser() {}

    public static LocalDateTime parseToIST(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return OffsetDateTime.parse(s).atZoneSameInstant(IST).toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.parse(s, DateTimeFormatter.ISO_DATE_TIME);
        }
    }
}
