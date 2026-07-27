package com.example.visitor.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS policy for the browser clients (visitor website, event-manager portal).
 *
 * The origin list is an explicit allowlist driven by the CORS_ALLOWED_ORIGINS env
 * var. It previously allowed every origin ("*") WITH credentials enabled, which
 * makes the browser echo back whatever Origin it is sent — any site could then
 * call the API with the user's credentials attached. LAN dev origins are still
 * matched by pattern so Wi-Fi testing keeps working.
 *
 * Note: the React Native app is not a browser and is unaffected by CORS; this
 * only governs the two web front-ends.
 */
@Configuration
public class CorsConfig {

    /**
     * Comma-separated origin patterns. Defaults cover the deployed sites plus
     * localhost/LAN development. Override in production to lock this down further.
     */
    @Value("${cors.allowed-origins:"
        + "https://ritgate-backend.onrender.com,"
        + "https://*.onrender.com,"
        + "https://*.vercel.app,"
        + "http://localhost:*,"
        + "http://127.0.0.1:*,"
        + "http://192.168.*:*,"
        + "http://10.*:*"
        + "}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
        // allowedOriginPatterns (not allowedOrigins) so wildcard host patterns
        // remain legal alongside allowCredentials.
        configuration.setAllowedOriginPatterns(origins);

        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        // Only the headers the clients actually send.
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "Accept", "Origin",
            "X-Requested-With", "X-User-Time", "X-User-Timezone"
        ));

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
