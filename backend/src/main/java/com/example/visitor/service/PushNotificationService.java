package com.example.visitor.service;

import com.example.visitor.repository.UserPushTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * PushNotificationService — sends FCM push notifications via the Legacy HTTP API.
 *
 * Setup required:
 *  1. Create a Firebase project at https://console.firebase.google.com
 *  2. Add an Android app with package name: com.mygate.app
 *  3. Download google-services.json → place in frontend/android/app/
 *  4. In Firebase Console → Project Settings → Cloud Messaging → Server key
 *  5. Set environment variable: FCM_SERVER_KEY=<your-server-key>
 *
 * The Legacy HTTP API is used here because it requires only a server key (no OAuth2).
 * Upgrade to HTTP v1 API later by adding firebase-admin SDK if needed.
 */
@Service
@Slf4j
public class PushNotificationService {

    private static final String FCM_LEGACY_URL = "https://fcm.googleapis.com/fcm/send";

    @Value("${fcm.server.key:}")
    private String fcmServerKey;

    private final UserPushTokenRepository pushTokenRepository;
    private final HttpClient httpClient;

    public PushNotificationService(UserPushTokenRepository pushTokenRepository) {
        this.pushTokenRepository = pushTokenRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Send a push notification to all devices registered for a user.
     * Non-fatal — any failure is logged and swallowed.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendToUser(String userId, String title, String body, String actionRoute) {
        if (fcmServerKey == null || fcmServerKey.isBlank()) {
            log.debug("FCM_SERVER_KEY not configured — skipping push for user {}", userId);
            return;
        }
        try {
            var tokens = pushTokenRepository.findByUserId(userId);
            if (tokens.isEmpty()) return;

            for (var tokenEntity : tokens) {
                String token = tokenEntity.getPushToken();
                if (token == null || token.isBlank()) continue;
                sendFCMPush(token, title, body, actionRoute);
            }
        } catch (Exception e) {
            log.warn("⚠️ Push notification failed for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendToUser(String userId, String title, String body) {
        sendToUser(userId, title, body, null);
    }

    private void sendFCMPush(String fcmToken, String title, String body, String actionRoute) {
        try {
            // Build data payload for tap-to-navigate
            String dataFields = actionRoute != null && !actionRoute.isEmpty()
                ? String.format(",\"actionRoute\":\"%s\"", escapeJson(actionRoute))
                : "";

            // FCM Legacy HTTP payload
            String json = String.format(
                "{" +
                "\"to\":\"%s\"," +
                "\"priority\":\"high\"," +
                "\"notification\":{" +
                "  \"title\":\"%s\"," +
                "  \"body\":\"%s\"," +
                "  \"sound\":\"default\"," +
                "  \"android_channel_id\":\"ritgate_main\"" +
                "}," +
                "\"data\":{" +
                "  \"title\":\"%s\"," +
                "  \"body\":\"%s\"" +
                "  %s" +
                "}" +
                "}",
                fcmToken,
                escapeJson(title), escapeJson(body),
                escapeJson(title), escapeJson(body),
                dataFields
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(FCM_LEGACY_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "key=" + fcmServerKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                log.info("📲 FCM push sent to {} — {}", fcmToken.substring(0, Math.min(20, fcmToken.length())), title);
            } else {
                log.warn("⚠️ FCM returned HTTP {} for token {}: {}", response.statusCode(),
                    fcmToken.substring(0, Math.min(20, fcmToken.length())), response.body());
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to send FCM push: {}", e.getMessage());
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
