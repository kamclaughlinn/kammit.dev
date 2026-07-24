package dev.kammit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminKeyGuard {

    private final String adminKey;

    public AdminKeyGuard(@Value("${elvis.admin-key:}") String adminKey) {
        this.adminKey = adminKey == null ? "" : adminKey.trim();
    }

    public boolean isConfigured() {
        return !adminKey.isBlank();
    }

    public boolean matches(String provided) {
        return isConfigured()
                && provided != null
                && !provided.isBlank()
                && adminKey.equals(provided.trim());
    }
}
