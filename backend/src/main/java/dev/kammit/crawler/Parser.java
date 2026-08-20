package dev.kammit.crawler;

import java.util.ArrayList;
import java.util.List;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

/**
 * Extracts absolute hrefs from a JSoup document (including mailto/tel/external).
 * Skips blank hrefs — JSoup would otherwise resolve {@code href=""} to the base URL.
 */
public final class Parser {

    public List<String> extractLinks(Document document) {
        List<String> links = new ArrayList<>();
        for (Element link : document.select("a[href]")) {
            String rawHref = link.attr("href");
            if (rawHref == null || rawHref.isBlank()) {
                continue;
            }
            String absHref = link.attr("abs:href");
            if (absHref != null && !absHref.isBlank()) {
                links.add(absHref);
            }
        }
        return links;
    }
}
