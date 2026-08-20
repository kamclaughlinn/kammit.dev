package dev.kammit.crawler;

import java.util.List;

/** Result of a bounded concurrent crawl for the kammit.dev demo. */
public record CrawlResult(
        String startUrl,
        String host,
        int maxPages,
        int threadCount,
        int pagesFetched,
        int visited,
        List<CrawledPage> pages
) {}
