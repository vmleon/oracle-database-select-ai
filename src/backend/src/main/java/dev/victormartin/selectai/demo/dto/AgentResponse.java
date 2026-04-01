package dev.victormartin.selectai.demo.dto;

public record AgentResponse(
        String prompt,
        String response,
        String conversationId,
        long timeInMillis
) {
}
