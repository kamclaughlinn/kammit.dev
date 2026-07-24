package dev.kammit.model;

import java.time.Instant;

public record PhraseDto(Long id, String text, String authorName, Instant createdAt) {
    public static PhraseDto from(Phrase phrase) {
        String author = phrase.getAuthorName();
        if (author == null || author.isBlank()) {
            author = "anon";
        }
        return new PhraseDto(phrase.getId(), phrase.getText(), author, phrase.getCreatedAt());
    }
}
