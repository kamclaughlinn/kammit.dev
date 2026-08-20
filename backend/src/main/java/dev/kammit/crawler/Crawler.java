package dev.kammit.crawler;

import java.util.List;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.jsoup.nodes.Document;

/**
 * Concurrent BFS crawler for the kammit.dev demo.
 * Collects pages into a result list instead of printing to stdout.
 * <p>
 * Uses a fixed {@link ExecutorService}, {@link LinkedBlockingQueue} frontier,
 * {@link ConcurrentHashMap#newKeySet()} visited claims, {@link AtomicInteger} active/pagesFetched,
 * and a {@link CountDownLatch} for completion ({@code active == 0}).
 */
public final class Crawler {

    private final Fetcher fetcher;
    private final Parser parser;
    private final UrlPolicy policy;
    private final int maxPages;
    private final int threadCount;

    public Crawler(Fetcher fetcher, Parser parser, UrlPolicy policy, int maxPages, int threadCount) {
        this.fetcher = fetcher;
        this.parser = parser;
        this.policy = policy;
        this.maxPages = maxPages;
        this.threadCount = threadCount;
    }

    public CrawlResult crawl(String startUrl) {
        BlockingQueue<String> frontier = new LinkedBlockingQueue<>();
        Set<String> visited = ConcurrentHashMap.newKeySet();
        AtomicInteger active = new AtomicInteger(0);
        AtomicInteger pagesFetched = new AtomicInteger(0);
        CountDownLatch done = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        ConcurrentLinkedQueue<CrawledPage> pages = new ConcurrentLinkedQueue<>();

        String start = policy.normalize(startUrl).orElse(startUrl);
        enqueue(start, frontier, visited, active, pagesFetched);

        for (int i = 0; i < threadCount; i++) {
            pool.submit(() -> workerLoop(frontier, visited, active, pagesFetched, done, pages));
        }

        try {
            done.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        pool.shutdownNow();
        try {
            pool.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return new CrawlResult(
                start,
                policy.allowedHost(),
                maxPages,
                threadCount,
                pagesFetched.get(),
                visited.size(),
                List.copyOf(pages)
        );
    }

    private boolean enqueue(
            String url,
            BlockingQueue<String> frontier,
            Set<String> visited,
            AtomicInteger active,
            AtomicInteger pagesFetched
    ) {
        if (pagesFetched.get() >= maxPages) {
            return false;
        }
        if (!visited.add(url)) {
            return false;
        }
        active.incrementAndGet();
        frontier.offer(url);
        return true;
    }

    private void workerLoop(
            BlockingQueue<String> frontier,
            Set<String> visited,
            AtomicInteger active,
            AtomicInteger pagesFetched,
            CountDownLatch done,
            ConcurrentLinkedQueue<CrawledPage> pages
    ) {
        try {
            while (!Thread.currentThread().isInterrupted()) {
                String url = frontier.poll(200, TimeUnit.MILLISECONDS);

                if (url == null) {
                    if (active.get() == 0) {
                        done.countDown();
                        return;
                    }
                    continue;
                }

                try {
                    process(url, frontier, visited, active, pagesFetched, pages);
                } finally {
                    int remaining = active.decrementAndGet();
                    if (remaining == 0) {
                        done.countDown();
                        return;
                    }
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void process(
            String url,
            BlockingQueue<String> frontier,
            Set<String> visited,
            AtomicInteger active,
            AtomicInteger pagesFetched,
            ConcurrentLinkedQueue<CrawledPage> pages
    ) {
        if (pagesFetched.get() >= maxPages) {
            return;
        }

        Document document = fetcher.fetch(url);
        if (document == null) {
            return;
        }

        int fetched = pagesFetched.incrementAndGet();
        if (fetched > maxPages) {
            return;
        }

        List<String> linksFound = parser.extractLinks(document);
        pages.add(new CrawledPage(url, List.copyOf(linksFound)));

        if (pagesFetched.get() >= maxPages) {
            return;
        }

        for (String link : linksFound) {
            String candidate = policy.normalize(link).orElse(null);
            if (candidate == null || !policy.shouldFollow(candidate)) {
                continue;
            }
            enqueue(candidate, frontier, visited, active, pagesFetched);
        }
    }
}
