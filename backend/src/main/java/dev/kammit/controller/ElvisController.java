package dev.kammit.controller;

import dev.kammit.config.AdminKeyGuard;
import dev.kammit.model.ElvisState;
import dev.kammit.model.PhraseDto;
import dev.kammit.service.CatChatService;
import dev.kammit.service.ElvisService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
public class ElvisController {

    private final ElvisService elvisService;
    private final CatChatService catChatService;
    private final AdminKeyGuard adminKeyGuard;

    public ElvisController(
            ElvisService elvisService,
            CatChatService catChatService,
            AdminKeyGuard adminKeyGuard
    ) {
        this.elvisService = elvisService;
        this.catChatService = catChatService;
        this.adminKeyGuard = adminKeyGuard;
    }

    @GetMapping("/elvis")
    public ElvisState getElvis() {
        return elvisService.getState();
    }

    @PostMapping("/elvis/feed")
    public ElvisState feed() {
        return elvisService.feed();
    }

    @PostMapping("/elvis/pet")
    public ElvisState pet() {
        return elvisService.pet();
    }

    @PostMapping("/elvis/play")
    public ElvisState play() {
        return elvisService.play();
    }

    @PostMapping("/elvis/clean")
    public ElvisState clean() {
        return elvisService.clean();
    }

    @PostMapping("/elvis/heart")
    public ElvisState heart() {
        return elvisService.heart();
    }

    @GetMapping("/elvis/phrases")
    public List<PhraseDto> phrases() {
        return elvisService.getKnownPhrases();
    }

    @PostMapping("/elvis/teach")
    public ResponseEntity<Map<String, Object>> teach(@Valid @RequestBody TeachRequest request) {
        ElvisService.TeachResult result = elvisService.teachPhrase(request.phrase(), request.authorName());
        return ResponseEntity.ok(Map.of(
                "success", result.success(),
                "message", result.message(),
                "phrase", result.phrase() != null ? result.phrase() : ""
        ));
    }

    @DeleteMapping("/elvis/phrases/{id}")
    public ResponseEntity<Void> deletePhrase(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        if (!adminKeyGuard.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Admin delete is not configured");
        }
        if (!adminKeyGuard.matches(adminKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nope.");
        }
        try {
            elvisService.deletePhrase(id);
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/elvis/chat")
    public Map<String, String> chat(@RequestBody ChatRequest request) {
        return Map.of("response", catChatService.respond(request.message()));
    }

    public record TeachRequest(
            @NotBlank @Size(max = 120) String phrase,
            @NotBlank @Size(max = 40) String authorName
    ) {}

    public record ChatRequest(String message) {}
}
