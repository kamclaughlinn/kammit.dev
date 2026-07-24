package dev.kammit.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class ContentFilterService {

    private static final Pattern URL_PATTERN = Pattern.compile(
            "https?://|www\\.", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern REPEAT_CHARS = Pattern.compile("(.)\\1{4,}");

    private static final Set<String> BLOCKED = new HashSet<>(Arrays.asList(
            "fuck", "shit", "bitch", "asshole", "bastard", "damn", "crap",
            "dick", "piss", "slut", "whore", "cunt", "nigger", "nigga",
            "faggot", "retard", "kill yourself", "kys", "suicide",
            "porn", "nazi", "hitler", "rape", "pedo", "pedophile",
            "tranny", "fag", "dyke", "incel"
    ));

    public FilterResult validate(String input) {
        if (input == null || input.isBlank()) {
            return FilterResult.rejected("Phrase cannot be empty.");
        }

        String trimmed = input.trim();
        if (trimmed.length() < 2) {
            return FilterResult.rejected("Phrase is too short — Elvis needs at least 2 characters.");
        }
        if (trimmed.length() > 120) {
            return FilterResult.rejected("Phrase is too long — keep it under 120 characters.");
        }
        if (URL_PATTERN.matcher(trimmed).find()) {
            return FilterResult.rejected("Links aren't allowed in Elvis's vocabulary.");
        }
        if (EMAIL_PATTERN.matcher(trimmed).find()) {
            return FilterResult.rejected("Email addresses aren't allowed.");
        }
        if (REPEAT_CHARS.matcher(trimmed).find()) {
            return FilterResult.rejected("Too many repeated characters — Elvis gets confused!");
        }

        String normalized = normalize(trimmed);
        String compact = compact(trimmed);
        for (String blocked : BLOCKED) {
            if (containsBlockedWord(normalized, compact, blocked)) {
                return FilterResult.rejected("That phrase isn't suitable for Elvis's innocent ears.");
            }
        }

        if (countSpecialChars(trimmed) > trimmed.length() / 2) {
            return FilterResult.rejected("Too many special characters — try actual words!");
        }

        return FilterResult.approved(trimmed);
    }

    /** Same rules for display names / signatures. */
    public FilterResult validateName(String input) {
        if (input == null || input.isBlank()) {
            return FilterResult.rejected("Sign your name so Elvis knows who taught him!");
        }
        String trimmed = input.trim();
        if (trimmed.length() > 40) {
            return FilterResult.rejected("Name is too long.");
        }
        String normalized = normalize(trimmed);
        String compact = compact(trimmed);
        for (String blocked : BLOCKED) {
            if (containsBlockedWord(normalized, compact, blocked)) {
                return FilterResult.rejected("That name isn't allowed.");
            }
        }
        return FilterResult.approved(trimmed);
    }

    /** Keep word boundaries for phrase checks. */
    private String normalize(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /** Strip ALL separators so "n i g g e r" / "n.i.g.g.e.r" still match. */
    private String compact(String text) {
        return text.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private boolean containsBlockedWord(String normalized, String compact, String blocked) {
        String blockedCompact = blocked.replaceAll("[^a-z0-9]", "");
        if (!blockedCompact.isEmpty() && compact.contains(blockedCompact)) {
            return true;
        }
        if (blocked.contains(" ")) {
            return normalized.contains(blocked);
        }
        for (String word : normalized.split("\\s")) {
            if (word.isEmpty()) continue;
            String wordCompact = word.replaceAll("[^a-z0-9]", "");
            if (wordCompact.equals(blockedCompact) || levenshteinClose(wordCompact, blockedCompact)) {
                return true;
            }
        }
        return false;
    }

    /** Catch simple leetspeak / obfuscation like f@ck, sh1t */
    private boolean levenshteinClose(String word, String blocked) {
        if (word.length() < 3 || Math.abs(word.length() - blocked.length()) > 2) {
            return false;
        }
        return levenshteinDistance(word, blocked) <= 1;
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }

    private int countSpecialChars(String text) {
        int count = 0;
        for (char c : text.toCharArray()) {
            if (!Character.isLetterOrDigit(c) && !Character.isWhitespace(c)) {
                count++;
            }
        }
        return count;
    }

    public record FilterResult(boolean allowed, String sanitized, String reason) {
        static FilterResult approved(String text) {
            return new FilterResult(true, text, null);
        }

        static FilterResult rejected(String reason) {
            return new FilterResult(false, null, reason);
        }
    }
}
