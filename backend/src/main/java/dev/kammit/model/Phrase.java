package dev.kammit.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "phrases")
public class Phrase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String text;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Phrase() {}

    public Phrase(String text) {
        this.text = text;
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
