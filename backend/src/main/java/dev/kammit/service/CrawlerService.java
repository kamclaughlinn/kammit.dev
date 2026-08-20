package dev.kammit.service;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import dev.kammit.crawler.Crawler;
import dev.kammit.crawler.CrawlResult;
import dev.kammit.crawler.Fetcher;
import dev.kammit.crawler.JsoupFetcher;
import dev.kammit.crawler.Parser;
import dev.kammit.crawler.UrlPolicy;

/**
 * Runs a bounded crawl for the portfolio demo.
 * Blocks private / loopback hosts to reduce SSRF risk on a public API.
 */
@Service
public class CrawlerService {

    private static final int FETCH_TIMEOUT_MS = 8_000;
    private static final int DEFAULT_MAX_PAGES = 12;
    private static final int HARD_MAX_PAGES = 20;
    private static final int THREAD_COUNT = 6;

    public CrawlResult run(String rawStartUrl, Integer requestedMaxPages) {
        String startUrl = rawStartUrl == null ? "" : rawStartUrl.trim();
        if (startUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start URL is required");
        }
        if (!startUrl.startsWith("http://") && !startUrl.startsWith("https://")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL must start with http:// or https://");
        }

        URI uri;
        try {
            uri = URI.create(startUrl);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid URL");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL has no host");
        }
        if (isBlockedHost(host)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "That host isn't allowed for the public demo (no localhost / private networks)"
            );
        }

        int maxPages = DEFAULT_MAX_PAGES;
        if (requestedMaxPages != null) {
            maxPages = Math.max(1, Math.min(HARD_MAX_PAGES, requestedMaxPages));
        }

        UrlPolicy policy = new UrlPolicy(startUrl);
        Fetcher fetcher = new JsoupFetcher(FETCH_TIMEOUT_MS);
        Parser parser = new Parser();
        Crawler crawler = new Crawler(fetcher, parser, policy, maxPages, THREAD_COUNT);
        return crawler.crawl(startUrl);
    }

    private boolean isBlockedHost(String host) {
        String h = host.toLowerCase();
        if ("localhost".equals(h) || h.endsWith(".localhost") || h.endsWith(".local") || "0.0.0.0".equals(h)) {
            return true;
        }
        try {
            for (InetAddress addr : InetAddress.getAllByName(h)) {
                if (addr.isAnyLocalAddress()
                        || addr.isLoopbackAddress()
                        || addr.isLinkLocalAddress()
                        || addr.isSiteLocalAddress()
                        || addr.isMulticastAddress()) {
                    return true;
                }
            }
        } catch (UnknownHostException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not resolve host");
        }
        return false;
    }
}
