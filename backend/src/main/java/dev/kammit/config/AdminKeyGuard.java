package dev.kammit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

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

    public void requireAdmin(String provided) {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Admin key is not configured");
        }
        if (!matches(provided)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nope.");
        }
    }
}
