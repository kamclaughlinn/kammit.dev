package dev.kammit.service;

import dev.kammit.model.ElvisState;
import dev.kammit.model.ElvisStats;
import dev.kammit.model.Phrase;
import dev.kammit.repository.ElvisStatsRepository;
import dev.kammit.repository.PhraseRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class ElvisService {

    private static final int MIN = 0;
    private static final int MAX = 100;

    private int hunger = 30;
    private int happiness = 75;
    private int cleanliness = 80;
    private int energy = 70;

    private final PhraseRepository phraseRepository;
    private final ElvisStatsRepository statsRepository;
    private final ContentFilterService contentFilter;
    private final Random random = new Random();

    public ElvisService(
            PhraseRepository phraseRepository,
            ElvisStatsRepository statsRepository,
            ContentFilterService contentFilter
    ) {
        this.phraseRepository = phraseRepository;
        this.statsRepository = statsRepository;
        this.contentFilter = contentFilter;
    }

    public synchronized ElvisState getState() {
        applyDecay();
        return buildState(null);
    }

    public synchronized ElvisState feed() {
        applyDecay();
        hunger = clamp(hunger - 25);
        happiness = clamp(happiness + 5);
        cleanliness = clamp(cleanliness - 5);
        return buildState("Elvis chomps happily! *nom nom nom*");
    }

    public synchronized ElvisState pet() {
        applyDecay();
        happiness = clamp(happiness + 20);
        energy = clamp(energy + 5);
        return buildState("Elvis purrs loudly and nuzzles your hand~");
    }

    public synchronized ElvisState play() {
        applyDecay();
        if (energy < 15) {
            return buildState("Elvis is too tired to play... let him nap first zzz");
        }
        happiness = clamp(happiness + 15);
        energy = clamp(energy - 20);
        hunger = clamp(hunger + 10);
        cleanliness = clamp(cleanliness - 8);
        return buildState("Elvis zooms around! *bat bat bat*");
    }

    public synchronized ElvisState clean() {
        applyDecay();
        cleanliness = clamp(cleanliness + 30);
        happiness = clamp(happiness - 5);
        return buildState("Elvis tolerates the brushing... barely. *grumble purr*");
    }

    public synchronized ElvisState heart() {
        applyDecay();
        happiness = clamp(happiness + 15);
        energy = clamp(energy + 5);
        ElvisStats stats = getStats();
        long totalHearts = stats.incrementHearts();
        statsRepository.save(stats);
        return buildState("Elvis slow-blinks at you with love~ ♥ *prrrrr*", totalHearts);
    }

    public synchronized TeachResult teachPhrase(String rawPhrase) {
        ContentFilterService.FilterResult filter = contentFilter.validate(rawPhrase);
        if (!filter.allowed()) {
            return new TeachResult(false, filter.reason(), null);
        }

        if (phraseRepository.countByTextIgnoreCase(filter.sanitized()) > 0) {
            return new TeachResult(false, "Elvis already knows that one!", null);
        }

        Phrase saved = phraseRepository.save(new Phrase(filter.sanitized()));
        return new TeachResult(true, "Elvis learned: \"" + saved.getText() + "\"!", saved.getText());
    }

    public List<String> getKnownPhrases() {
        return phraseRepository.findAll().stream()
                .map(Phrase::getText)
                .toList();
    }

    public synchronized String randomPhrase() {
        List<String> phrases = getKnownPhrases();
        if (phrases.isEmpty()) {
            return pickDefaultPhrase();
        }
        return phrases.get(random.nextInt(phrases.size()));
    }

    @Scheduled(fixedRate = 60_000)
    public synchronized void tick() {
        applyDecay();
    }

    private void applyDecay() {
        hunger = clamp(hunger + 2);
        happiness = clamp(happiness - 1);
        cleanliness = clamp(cleanliness - 1);
        energy = clamp(energy + 1);
    }

    private ElvisState buildState(String actionMessage) {
        return buildState(actionMessage, getStats().getTotalHearts());
    }

    private ElvisState buildState(String actionMessage, long totalHearts) {
        String mood = computeMood();
        String message = actionMessage != null ? actionMessage : randomStatusMessage(mood);
        return new ElvisState(hunger, happiness, cleanliness, energy, mood, message, totalHearts);
    }

    private ElvisStats getStats() {
        return statsRepository.findById(1L).orElseGet(() -> statsRepository.save(ElvisStats.initial()));
    }

    private String computeMood() {
        if (hunger > 80) return "starving";
        if (cleanliness < 25) return "grumpy";
        if (energy < 20) return "sleepy";
        if (happiness > 80) return "ecstatic";
        if (happiness > 60) return "content";
        if (happiness < 30) return "sad";
        return "chill";
    }

    private String randomStatusMessage(String mood) {
        return switch (mood) {
            case "starving" -> "Hungry right now icl.";
            case "grumpy" -> "I smell.";
            case "sleepy" -> "zzz";
            case "ecstatic" -> randomPhrase();
            case "content" -> pick(List.of(
                    "Elvis is vibing~", "Elvis slow-blinks at you",
                    "*tail up, happy cat*", randomPhrase()));
            case "sad" -> "pet me???";
            default -> pick(List.of("*contemplates 747s and how cool they are...*", "*stares at wall*", randomPhrase()));
        };
    }

    private String pickDefaultPhrase() {
        return pick(List.of(
                "Meow?", "Mrrrp~", "*exists*", "I am Elvis","*hisses*"
        ));
    }

    private String pick(List<String> options) {
        return options.get(random.nextInt(options.size()));
    }

    private int clamp(int value) {
        return Math.max(MIN, Math.min(MAX, value));
    }

    public record TeachResult(boolean success, String message, String phrase) {}
}
