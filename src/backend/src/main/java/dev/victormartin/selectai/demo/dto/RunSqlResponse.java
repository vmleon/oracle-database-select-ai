package dev.victormartin.selectai.demo.dto;

import java.util.List;
import java.util.Map;

public record RunSqlResponse(
        String prompt,
        List<Map<String, String>> result,
        long timeInMillis
) {
}
