package com.example.visitor.config;

import com.example.visitor.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Enforces JWT authentication on every API call. Before this existed the entire API
 * was anonymous and trusted caller-supplied ids — anyone could read/modify anything.
 *
 * Only the genuinely public flows (login/OTP, version gate, health, visitor self
 * registration) are permitAll; everything else requires a valid token, with coarse
 * role gates on the clearly role-scoped path groups. Fine-grained ownership (IDOR)
 * is enforced inside controllers via Authz.requireSelf(...).
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ---- Public: login / OTP, version gate, health ----
                .requestMatchers("/api/auth/**", "/api/app/version", "/api/health").permitAll()
                // ---- Public: visitor self-registration + email-link approve/reject ----
                .requestMatchers(HttpMethod.POST, "/api/visitor/request",
                    "/api/unified-visitors/register", "/api/visitors").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/visitors/*/approve",
                    "/api/visitors/*/reject", "/api/unified-visitors/status/**").permitAll()
                // ---- Public: static CSV template download (opened in browser, no token) ----
                .requestMatchers(HttpMethod.GET, "/api/events/csv-template").permitAll()
                // CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ---- Visitor website pickers: scoped VISITOR_PORTAL token OR any real user ----
                // The website mints a VISITOR_PORTAL token at /api/auth/visitor-portal-token.
                // Staff email/phone are redacted for VISITOR_PORTAL in DepartmentController.
                .requestMatchers(HttpMethod.GET, "/api/departments", "/api/departments/*/staff-list")
                    .hasAnyRole("VISITOR_PORTAL", "STUDENT", "STAFF", "HOD", "HR", "SECURITY", "ADMIN")

                // ---- Admin-only sensitive/dev endpoints ----
                .requestMatchers("/api/test-email",
                    "/api/notifications/test-push",
                    "/api/notifications/debug-routing/**",
                    "/api/notifications/firebase-status",
                    "/api/security/dev/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/qr-codes/**", "/api/security/**").hasRole("ADMIN")

                // ---- Role-scoped path groups ----
                .requestMatchers("/api/students/**").hasAnyRole("ADMIN", "HOD", "HR")
                // Whole-visitor-list dump is a security-desk/admin view (the single-visitor,
                // self-register and email-link routes above remain available).
                .requestMatchers(HttpMethod.GET, "/api/visitors").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/security/**").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/qr-codes/**").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/entry-exit/**").hasAnyRole("SECURITY", "ADMIN")
                // Bulk-pass gate scanning/validation is a security-desk action.
                .requestMatchers("/api/bulk-pass/scan/**", "/api/bulk-pass/validate/**")
                    .hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/hod/**").hasAnyRole("HOD", "ADMIN")
                .requestMatchers("/api/hr/**").hasAnyRole("HR", "ADMIN")

                // ---- Everything else: any authenticated REAL user ----
                // Listed explicitly (not bare authenticated()) so the scoped VISITOR_PORTAL
                // token is contained to only the picker endpoints whitelisted above.
                .anyRequest().hasAnyRole("STUDENT", "STAFF", "HOD", "HR", "SECURITY", "ADMIN")
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
