package dev.kammit.crawler;

import java.util.List;

/** One successfully fetched page and every link found on it. */
public record CrawledPage(String url, List<String> links) {}
