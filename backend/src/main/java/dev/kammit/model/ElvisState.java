package dev.kammit.model;

public record ElvisState(
        int hunger,
        int happiness,
        int cleanliness,
        int energy,
        String mood,
        String message,
        long totalHearts
) {}
