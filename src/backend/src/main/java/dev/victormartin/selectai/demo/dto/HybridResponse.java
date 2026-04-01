package dev.victormartin.selectai.demo.dto;

public record HybridResponse(
        String prompt,
        String answer,
        long timeInMillis
) {
}
