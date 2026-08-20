package dev.kammit.crawler;

import java.net.URI;
import java.util.Optional;

/**
 * Follow only http(s) URLs whose host exactly equals the start host.
 * Strips {@code #fragments} for visited-set identity.
 */
public final class UrlPolicy {

    private final String allowedHost;

    public UrlPolicy(String startUrl) {
        String host = hostOf(startUrl);
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Start URL has no host: " + startUrl);
        }
        this.allowedHost = host;
    }

    public String allowedHost() {
        return allowedHost;
    }

    public boolean shouldFollow(String absoluteUrl) {
        if (absoluteUrl == null || absoluteUrl.isBlank()) {
            return false;
        }
        if (!absoluteUrl.startsWith("http://") && !absoluteUrl.startsWith("https://")) {
            return false;
        }
        String host = hostOf(absoluteUrl);
        return host != null && host.equals(allowedHost);
    }

    public Optional<String> normalize(String absoluteUrl) {
        if (absoluteUrl == null || absoluteUrl.isBlank()) {
            return Optional.empty();
        }
        try {
            URI uri = URI.create(absoluteUrl);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null) {
                return Optional.empty();
            }
            int port = uri.getPort();
            String path = uri.getPath() == null || uri.getPath().isEmpty() ? "/" : uri.getPath();
            String query = uri.getQuery();

            StringBuilder sb = new StringBuilder();
            sb.append(scheme).append("://").append(host);
            if (port != -1) {
                sb.append(':').append(port);
            }
            sb.append(path);
            if (query != null && !query.isEmpty()) {
                sb.append('?').append(query);
            }
            return Optional.of(sb.toString());
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public static String hostOf(String url) {
        try {
            return URI.create(url).getHost();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
