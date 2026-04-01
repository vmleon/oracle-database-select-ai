package dev.victormartin.selectai.demo.dto;

public record RagResponse(
        String prompt,
        String answer,
        long timeInMillis
) {
}
