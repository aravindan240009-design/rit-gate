package com.example.visitor.util;

/**
 * Converts exception messages into text safe to show end users.
 * Business errors thrown by our services ("Student not found with regNo: X")
 * pass through unchanged; technical errors (SQL, Hibernate, transactions,
 * connection failures) are replaced with a friendly generic message so raw
 * database details never reach the app.
 */
public final class ErrorMessages {

    public static final String GENERIC = "Something went wrong. Please try again.";

    private static final String[] TECHNICAL_MARKERS = {
        "could not execute", "constraint", "foreign key", "sqlexception",
        "sql [", "jdbc", "hibernate", "rollback", "rolled back", "transaction",
        "deadlock", "duplicate entry", "data truncation", "incorrect string",
        "communications link", "connection", "timeout", "statementcallback",
        "preparedstatement", "dataintegrityviolation", "jpasystem",
        "org.springframework", "org.hibernate", "java.sql", "exception:",
        "nullpointerexception", "indexoutofbounds", "classcastexception",
        "illegalargument", "illegalstate", "stacktrace"
    };

    private ErrorMessages() {}

    public static String userFriendly(Throwable e) {
        return userFriendly(e, GENERIC);
    }

    public static String userFriendly(Throwable e, String fallback) {
        if (e == null) return fallback;
        String msg = e.getMessage();
        if (msg == null || msg.isBlank()) return fallback;
        // Long messages are almost always SQL/stack dumps
        if (msg.length() > 160) return fallback;
        String lower = msg.toLowerCase();
        for (String marker : TECHNICAL_MARKERS) {
            if (lower.contains(marker)) return fallback;
        }
        return msg;
    }
}
