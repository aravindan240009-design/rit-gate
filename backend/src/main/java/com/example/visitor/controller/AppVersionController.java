package com.example.visitor.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Drives the app's launch-time version gate. The mobile app compares its own
 * Android versionCode against minVersionCode (hard block / force-upgrade) and
 * latestVersionCode (soft, dismissible "update available").
 *
 * All values come from application.properties so the minimum can be raised
 * (e.g. after a breaking API change) by changing config/env only.
 */
@RestController
@RequestMapping("/api/app")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AppVersionController {

    @Value("${app.min-version-code:1}")
    private int minVersionCode;

    @Value("${app.latest-version-code:1}")
    private int latestVersionCode;

    @Value("${app.update-url:market://details?id=com.mygate.app}")
    private String updateUrl;

    @Value("${app.update-message:A new version is required. Please update to continue.}")
    private String updateMessage;

    @GetMapping("/version")
    public ResponseEntity<Map<String, Object>> getVersionInfo() {
        Map<String, Object> body = new HashMap<>();
        body.put("minVersionCode", minVersionCode);
        body.put("latestVersionCode", latestVersionCode);
        body.put("updateUrl", updateUrl);
        body.put("message", updateMessage);
        return ResponseEntity.ok(body);
    }
}
