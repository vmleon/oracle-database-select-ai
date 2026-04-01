package dev.victormartin.selectai.demo.controller;

import dev.victormartin.selectai.demo.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/selectai")
public class SelectAIController {

    private static final Logger log = LoggerFactory.getLogger(SelectAIController.class);
    private static final int MAX_RESULT_ROWS = 500;
    // Allow only natural-language characters: letters, digits, spaces, commas, periods, hyphens, parentheses
    private static final Pattern ALLOWED_PROMPT = Pattern.compile("^[\\p{L}\\p{N}\\s,\\.\\-()]+$");

    @Value("${selectai.profile.query}")
    private String queryProfile;

    @Value("${selectai.agents.team}")
    private String agentsTeam;

    @Value("${selectai.profile.rag}")
    private String ragProfile;

    private final JdbcTemplate jdbcTemplate;

    public SelectAIController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/query")
    public QueryResponse query(@RequestBody QueryRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI query: {}", prompt);

        setProfile(queryProfile);

        long t0 = System.currentTimeMillis();
        String sqlCode = jdbcTemplate.queryForObject(
                String.format("SELECT AI showsql %s", prompt), String.class);
        long sqlQueryTime = System.currentTimeMillis() - t0;

        long t1 = System.currentTimeMillis();
        String narration = jdbcTemplate.queryForObject(
                String.format("SELECT AI narrate %s", prompt), String.class);
        long narrationTime = System.currentTimeMillis() - t1;

        long t2 = System.currentTimeMillis();
        String boundedSql = "SELECT * FROM (" + sqlCode + ") WHERE ROWNUM <= " + MAX_RESULT_ROWS;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(boundedSql);
        long resultTime = System.currentTimeMillis() - t2;

        List<Map<String, String>> result = rows.stream()
                .map(row -> row.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> String.valueOf(e.getValue()))))
                .collect(Collectors.toList());

        return new QueryResponse(
                request.prompt(), sqlCode, sqlQueryTime,
                narration, narrationTime,
                result, resultTime);
    }

    @PostMapping("/runsql")
    public RunSqlResponse runsql(@RequestBody QueryRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI runsql: {}", prompt);

        setProfile(queryProfile);

        long t0 = System.currentTimeMillis();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                String.format("SELECT AI runsql %s", prompt));
        long elapsed = System.currentTimeMillis() - t0;

        List<Map<String, String>> result = rows.stream()
                .map(row -> row.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> String.valueOf(e.getValue()))))
                .collect(Collectors.toList());

        return new RunSqlResponse(request.prompt(), result, elapsed);
    }

    @PostMapping("/agents")
    public AgentResponse agents(@RequestBody AgentRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI agent: {}", prompt);

        setTeam(agentsTeam);

        long t0 = System.currentTimeMillis();
        String response = jdbcTemplate.queryForObject(
                String.format("SELECT AI AGENT %s", prompt), String.class);
        long elapsed = System.currentTimeMillis() - t0;

        return new AgentResponse(request.prompt(), response, elapsed);
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI chat: {}", prompt);

        setProfile(queryProfile);

        long t0 = System.currentTimeMillis();
        String response = jdbcTemplate.queryForObject(
                String.format("SELECT AI chat %s", prompt), String.class);
        long elapsed = System.currentTimeMillis() - t0;

        return new ChatResponse(request.prompt(), response, elapsed);
    }

    @PostMapping("/rag")
    public RagResponse rag(@RequestBody RagRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI RAG: {}", prompt);

        setProfile(ragProfile);

        long t0 = System.currentTimeMillis();
        String answer = jdbcTemplate.queryForObject(
                String.format("SELECT AI narrate %s", prompt), String.class);
        long elapsed = System.currentTimeMillis() - t0;

        return new RagResponse(request.prompt(), answer, elapsed);
    }

    private void setProfile(String profileName) {
        jdbcTemplate.execute(String.format(
                "BEGIN dbms_cloud_ai.set_profile(profile_name => '%s'); END;",
                profileName));
    }

    private void setTeam(String teamName) {
        jdbcTemplate.execute(String.format(
                "BEGIN dbms_cloud_ai_agent.set_team(team_name => '%s'); END;",
                teamName));
    }

    private String validatePrompt(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("Prompt cannot be empty");
        }
        String trimmed = prompt.trim();
        if (trimmed.length() > 1000) {
            throw new IllegalArgumentException("Prompt too long (max 1000 characters)");
        }
        if (!ALLOWED_PROMPT.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Prompt contains invalid characters");
        }
        return trimmed;
    }
}
