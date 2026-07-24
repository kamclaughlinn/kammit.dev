package dev.kammit.config;

import java.net.URI;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Render injects DATABASE_URL as postgresql://user:pass@host/db.
 * Spring/Hikari need jdbc:postgresql://... — build that DataSource explicitly.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String fallbackUrl,
            @Value("${spring.datasource.username:sa}") String fallbackUsername,
            @Value("${spring.datasource.password:}") String fallbackPassword,
            @Value("${spring.datasource.driver-class-name:${spring.datasource.driverClassName:org.h2.Driver}}") String fallbackDriver
    ) {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank()
                && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            ParsedPostgres parsed = parsePostgresUrl(databaseUrl);
            log.info("Using PostgreSQL datasource host={} db={}", parsed.host(), parsed.database());
            return DataSourceBuilder.create()
                    .driverClassName("org.postgresql.Driver")
                    .url(parsed.jdbcUrl())
                    .username(parsed.username())
                    .password(parsed.password())
                    .build();
        }

        log.warn("DATABASE_URL not set — falling back to {}", fallbackUrl);
        return DataSourceBuilder.create()
                .driverClassName(fallbackDriver)
                .url(fallbackUrl)
                .username(fallbackUsername)
                .password(fallbackPassword)
                .build();
    }

    static ParsedPostgres parsePostgresUrl(String databaseUrl) {
        URI uri = URI.create(databaseUrl);
        String userInfo = uri.getUserInfo();
        if (userInfo == null || !userInfo.contains(":")) {
            throw new IllegalStateException("DATABASE_URL must include username:password");
        }

        String[] parts = userInfo.split(":", 2);
        String username = parts[0];
        String password = parts[1];
        String host = uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getPath() == null ? "" : uri.getPath();
        String database = path.startsWith("/") ? path.substring(1) : path;
        String query = uri.getQuery();

        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path
                + (query == null || query.isBlank() ? "" : "?" + query);
        if (!jdbcUrl.contains("sslmode=")) {
            jdbcUrl += (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        return new ParsedPostgres(jdbcUrl, username, password, host, database);
    }

    record ParsedPostgres(String jdbcUrl, String username, String password, String host, String database) {}
}
