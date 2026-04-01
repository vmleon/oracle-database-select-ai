package dev.victormartin.selectai.demo.dto;

import java.util.List;
import java.util.Map;

public record QueryResponse(
        String prompt,
        String sqlQuery,
        long sqlQueryTimeInMillis,
        String narration,
        long narrationTimeInMillis,
        List<Map<String, String>> result,
        long resultTimeInMillis
) {
}
