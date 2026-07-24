package dev.kammit.controller;

import dev.kammit.model.ElvisState;
import dev.kammit.service.CatChatService;
import dev.kammit.service.ElvisService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ElvisController {

    private final ElvisService elvisService;
    private final CatChatService catChatService;

    public ElvisController(ElvisService elvisService, CatChatService catChatService) {
        this.elvisService = elvisService;
        this.catChatService = catChatService;
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
    public List<String> phrases() {
        return elvisService.getKnownPhrases();
    }

    @PostMapping("/elvis/teach")
    public ResponseEntity<Map<String, Object>> teach(@RequestBody TeachRequest request) {
        ElvisService.TeachResult result = elvisService.teachPhrase(request.phrase());
        return ResponseEntity.ok(Map.of(
                "success", result.success(),
                "message", result.message(),
                "phrase", result.phrase() != null ? result.phrase() : ""
        ));
    }

    @PostMapping("/elvis/chat")
    public Map<String, String> chat(@RequestBody ChatRequest request) {
        return Map.of("response", catChatService.respond(request.message()));
    }

    public record TeachRequest(
            @NotBlank @Size(max = 120) String phrase
    ) {}

    public record ChatRequest(String message) {}
}
