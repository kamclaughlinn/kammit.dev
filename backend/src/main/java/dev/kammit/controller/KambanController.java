package dev.kammit.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kammit.config.AdminKeyGuard;
import dev.kammit.model.Board;
import dev.kammit.model.Card;
import dev.kammit.service.KambanService;

@RestController
@RequestMapping("/api/kamban")
public class KambanController {

    private final KambanService kambanService;
    private final AdminKeyGuard adminKeyGuard;

    public KambanController(KambanService kambanService, AdminKeyGuard adminKeyGuard) {
        this.kambanService = kambanService;
        this.adminKeyGuard = adminKeyGuard;
    }

    @PostMapping("/boards")
    public Board createBoard(
            @RequestBody Board board,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyGuard.requireAdmin(adminKey);
        return kambanService.createBoard(board);
    }

    @GetMapping("/boards/{id}")
    public Board getBoard(@PathVariable Long id) {
        return kambanService.getBoard(id);
    }

    @PostMapping("/columns/{id}/cards")
    public Card createCard(
            @PathVariable Long id,
            @RequestBody Card card,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyGuard.requireAdmin(adminKey);
        return kambanService.createCard(id, card);
    }

    @PatchMapping("/cards/{id}")
    public Card updateCard(
            @PathVariable Long id,
            @RequestBody Card card,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyGuard.requireAdmin(adminKey);
        return kambanService.updateCard(id, card);
    }

    @PatchMapping("/cards/{id}/move")
    public Card moveCard(
            @PathVariable Long id,
            @RequestBody MoveRequest request,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyGuard.requireAdmin(adminKey);
        return kambanService.moveCard(id, request.columnId(), request.position());
    }

    @DeleteMapping("/cards/{id}")
    public void deleteCard(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyGuard.requireAdmin(adminKey);
        kambanService.deleteCard(id);
    }
}
