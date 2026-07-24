package dev.kammit.model;

import jakarta.persistence.*;

@Entity
@Table(name = "elvis_stats")
public class ElvisStats {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private long totalHearts = 0;

    protected ElvisStats() {}

    public static ElvisStats initial() {
        return new ElvisStats();
    }

    public long getTotalHearts() {
        return totalHearts;
    }

    public long incrementHearts() {
        totalHearts++;
        return totalHearts;
    }
}
