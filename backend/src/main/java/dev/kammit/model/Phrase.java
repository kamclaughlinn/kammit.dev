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

    @Column(length = 40)
    private String authorName;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Phrase() {}

    public Phrase(String text, String authorName) {
        this.text = text;
        this.authorName = authorName;
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }

    public String getAuthorName() {
        return authorName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
