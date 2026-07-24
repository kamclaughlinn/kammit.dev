package dev.kammit.repository;

import dev.kammit.model.Phrase;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhraseRepository extends JpaRepository<Phrase, Long> {
    long countByTextIgnoreCase(String text);
}
