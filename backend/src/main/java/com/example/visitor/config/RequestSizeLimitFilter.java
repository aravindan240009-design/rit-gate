package com.example.visitor.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rejects oversized request bodies before they are buffered or parsed.
 *
 * Tomcat's max-http-form-post-size only governs form-encoded posts — a raw
 * application/json body (which is how visitor photos arrive, as base64 data URIs)
 * is not covered by it. Without this filter a client could stream an arbitrarily
 * large JSON document into memory before ImageValidation ever runs.
 *
 * Requests declaring an oversized Content-Length are refused outright with 413.
 * Bodies sent without a Content-Length (chunked) are passed through — Tomcat's
 * max-swallow-size bounds those.
 */
@Component
@Order(1) // ahead of the JWT filter: cheap size check before any parsing work
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    private final long maxBodyBytes;

    public RequestSizeLimitFilter(@Value("${app.max-request-body-bytes:12582912}") long maxBodyBytes) {
        this.maxBodyBytes = maxBodyBytes;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        long declared = request.getContentLengthLong();
        if (declared > maxBodyBytes) {
            response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Request too large. Maximum allowed size is "
                    + (maxBodyBytes / (1024 * 1024)) + "MB\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
