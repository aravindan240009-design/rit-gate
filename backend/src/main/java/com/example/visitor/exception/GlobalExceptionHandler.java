package com.example.visitor.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Converts uncaught exceptions into safe client responses.
 *
 * Internal detail (exception messages, SQL state, stack traces) is logged
 * server-side and NEVER returned to the caller — those messages routinely carry
 * table names, column names and connection strings, which is a disclosure risk.
 * Each response instead carries a short errorId that ties it to the log entry,
 * so support can still trace a specific failure.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Client-safe body: a generic message plus a correlation id for the logs. */
    private Map<String, Object> body(String status, String message, String errorId) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("status", status);
        error.put("message", message);
        error.put("errorId", errorId);
        return error;
    }

    private String logAndId(String label, Exception ex) {
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        log.error("[{}] {}: {}", errorId, label, ex.getMessage(), ex);
        return errorId;
    }

    /**
     * Controllers throw this deliberately (e.g. Authz 401/403) with a message
     * already written for the user, so the reason is passed through as-is.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        String reason = ex.getReason() != null ? ex.getReason() : "Request failed";
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", reason);
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    // ---- Client-side (4xx) — safe to describe, no internal detail involved ----

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .orElse("Invalid request data");
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MissingServletRequestParameterException.class,
        MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<Map<String, Object>> handleMalformedRequest(Exception ex) {
        // Covers invalid JSON, missing params and bad path/query types.
        log.warn("Malformed request: {}", ex.getMessage());
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", "Invalid or malformed request");
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleUploadTooLarge(MaxUploadSizeExceededException ex) {
        log.warn("Upload rejected — exceeds configured size limit");
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", "File is too large. Maximum upload size is 8MB");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

    // ---- Server-side (5xx) — detail stays in the logs ----

    @ExceptionHandler(DatabaseConnectionException.class)
    public ResponseEntity<Map<String, Object>> handleDatabaseConnectionException(DatabaseConnectionException ex) {
        String errorId = logAndId("Database connection error", ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(body("SERVICE_UNAVAILABLE", "Service temporarily unavailable. Please try again.", errorId));
    }

    @ExceptionHandler({DataAccessException.class, SQLException.class})
    public ResponseEntity<Map<String, Object>> handleDataAccess(Exception ex) {
        String errorId = logAndId("Data access error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(body("ERROR", "A server error occurred. Please try again.", errorId));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        String errorId = logAndId("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(body("ERROR", "An unexpected error occurred. Please try again.", errorId));
    }
}
