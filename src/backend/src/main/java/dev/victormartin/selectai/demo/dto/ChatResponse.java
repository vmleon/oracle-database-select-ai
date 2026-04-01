package dev.victormartin.selectai.demo.dto;

public record ChatResponse(
        String prompt,
        String response,
        long timeInMillis
) {
}
