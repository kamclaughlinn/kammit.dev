package dev.kammit.crawler;

import org.jsoup.nodes.Document;

/**
 * Downloads a page as a JSoup {@link Document}.
 * Interface so tests can inject fakes; production uses {@link JsoupFetcher}.
 */
public interface Fetcher {
    Document fetch(String url);
}
