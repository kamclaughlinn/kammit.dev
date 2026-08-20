package dev.kammit.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kammit.crawler.CrawlResult;
import dev.kammit.service.CrawlerService;

@RestController
@RequestMapping("/api/crawler")
public class CrawlerController {

    private final CrawlerService crawlerService;

    public CrawlerController(CrawlerService crawlerService) {
        this.crawlerService = crawlerService;
    }

    /**
     * Run a short concurrent crawl from a user-supplied start URL
     * (web equivalent of reading the URL with a Scanner).
     */
    @PostMapping("/run")
    public CrawlResult run(@RequestBody CrawlRequest request) {
        return crawlerService.run(request.startUrl(), request.maxPages());
    }

    public record CrawlRequest(String startUrl, Integer maxPages) {}
}
