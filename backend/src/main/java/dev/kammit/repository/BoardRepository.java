package dev.kammit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.kammit.model.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {
    Optional<Board> findFirstByNameIgnoreCaseOrderByIdAsc(String name);
}
