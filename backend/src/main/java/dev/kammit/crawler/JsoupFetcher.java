package dev.kammit.crawler;

import java.io.IOException;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * HTTP GET via JSoup with a request timeout. Returns the document for HTTP 200 only.
 */
public final class JsoupFetcher implements Fetcher {

    private static final Logger log = LoggerFactory.getLogger(JsoupFetcher.class);

    private final int timeoutMs;

    public JsoupFetcher(int timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    @Override
    public Document fetch(String url) {
        try {
            Connection connection = Jsoup.connect(url)
                    .timeout(timeoutMs)
                    .userAgent("kammit-crawler/1.0 (+https://kammit.dev; portfolio demo)");
            Document document = connection.get();
            if (connection.response().statusCode() == 200) {
                return document;
            }
            log.debug("Non-OK status for {}: {}", url, connection.response().statusCode());
            return null;
        } catch (IOException e) {
            log.debug("Error fetching {}: {}", url, e.toString());
            return null;
        }
    }
}
