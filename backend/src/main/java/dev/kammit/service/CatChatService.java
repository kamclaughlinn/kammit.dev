package dev.kammit.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class CatChatService {

    private static final List<String> RESPONSES = List.of(
            "Meow!",
            "Mrrrp~",
            "Prrrrrrrr...",
            "Mew?",
            "MROW!",
            "*stares blankly*",
            "Nyaa~",
            "Mrp.",
            "*head tilt*",
            "Mrrrow mrow!",
            "*slow blink*",
            "Mew mew mew!",
            "*knocks something off desk*",
            "Hrrrmph.",
            "*tail swish*",
            "Mrrp mrrp!",
            "*demands treats*",
            "Prrt!",
            "*ignores you completely*",
            "Mao~",
            "*zoomies activated*",
            "Mrrrrrrp?",
            "*sits on keyboard*",
            "Mew... mew?",
            "*licks paw dramatically*"
    );

    private final Random random = new Random();

    public String respond(String userMessage) {
        if (userMessage != null && userMessage.toLowerCase().contains("treat")) {
            return pick(List.of("MROW!!!", "*demands treats*", "Mew mew MEW!", "Prrrrrrrr..."));
        }
        if (userMessage != null && userMessage.toLowerCase().contains("elvis")) {
            return pick(List.of("*perks up ears*", "Mrrrp~", "Mew! (that's me!)", "*slow blink of approval*"));
        }
        return RESPONSES.get(random.nextInt(RESPONSES.size()));
    }

    private String pick(List<String> options) {
        return options.get(random.nextInt(options.size()));
    }
}
