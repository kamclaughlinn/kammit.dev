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
            "hissss!",
            "Mew mew mew mew!",
            "*gets stuck in blinds*",
            "huff!",
            "Ask Kerry lol",
            "Mew... mew?"
    );

    private final Random random = new Random();

    public String respond(String userMessage) {
        if (userMessage != null && userMessage.toLowerCase().contains("treat")) {
            return pick(List.of("MROW!!!", "ye", "Mew mew MEW!", "Prrrrrrrr..."));
        }
        if (userMessage != null && userMessage.toLowerCase().contains("elvis")) {
            return pick(List.of("*perks up ears*", "Mrrrp~", "Mew! (that's me!)", "*slow blink of approval*"));
        }
         if (userMessage != null && userMessage.toLowerCase().contains("?")) {
            return pick(List.of("idc","Ask kerry", "I don't work here", "idk", "*sigh*", "great question."));
        }
        return RESPONSES.get(random.nextInt(RESPONSES.size()));
    }

    private String pick(List<String> options) {
        return options.get(random.nextInt(options.size()));
    }
}
