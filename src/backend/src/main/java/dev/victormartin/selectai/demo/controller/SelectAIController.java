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

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/selectai")
public class SelectAIController {

    private static final Logger log = LoggerFactory.getLogger(SelectAIController.class);
    private static final int MAX_RESULT_ROWS = 500;
    private static final Pattern ALLOWED_PROMPT = Pattern.compile("^[\\p{L}\\p{N}\\s,\\.\\-()\\?!':;\"/&#%]+$");

    private static final String GENERATE_SQL =
            "SELECT DBMS_CLOUD_AI.GENERATE(prompt => ?, profile_name => ?, action => ?) FROM DUAL";

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

        long t0 = System.currentTimeMillis();
        try {
            String sqlCode = jdbcTemplate.queryForObject(
                    GENERATE_SQL, String.class, prompt, queryProfile, "showsql");
            long sqlQueryTime = System.currentTimeMillis() - t0;

            long t1 = System.currentTimeMillis();
            String narration = jdbcTemplate.queryForObject(
                    GENERATE_SQL, String.class, prompt, queryProfile, "narrate");
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

            long totalElapsed = System.currentTimeMillis() - t0;
            log.info("Select AI query OK in {}ms (sql={}ms, narrate={}ms, exec={}ms, rows={})",
                    totalElapsed, sqlQueryTime, narrationTime, resultTime, result.size());
            return new QueryResponse(
                    request.prompt(), sqlCode, sqlQueryTime,
                    narration, narrationTime,
                    result, resultTime);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("Select AI query failed after {}ms: {}", elapsed, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/runsql")
    public RunSqlResponse runsql(@RequestBody QueryRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI runsql: {}", prompt);

        long t0 = System.currentTimeMillis();
        try {
            String sqlCode = jdbcTemplate.queryForObject(
                    GENERATE_SQL, String.class, prompt, queryProfile, "showsql");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM (" + sqlCode + ") WHERE ROWNUM <= " + MAX_RESULT_ROWS);
            long elapsed = System.currentTimeMillis() - t0;

            List<Map<String, String>> result = rows.stream()
                    .map(row -> row.entrySet().stream()
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    e -> String.valueOf(e.getValue()))))
                    .collect(Collectors.toList());

            log.info("Select AI runsql OK in {}ms (rows={})", elapsed, result.size());
            return new RunSqlResponse(request.prompt(), result, elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("Select AI runsql failed after {}ms: {}", elapsed, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/agents")
    public AgentResponse agents(@RequestBody AgentRequest request) {
        String prompt = validatePrompt(request.prompt());
        String conversationId = request.conversationId() != null
                ? request.conversationId()
                : UUID.randomUUID().toString();
        log.info("Select AI agent: {} (conversation: {})", prompt, conversationId);

        String paramsJson = String.format("{\"conversation_id\": \"%s\"}", conversationId);

        long t0 = System.currentTimeMillis();
        String response;
        try {
            response = jdbcTemplate.queryForObject(
                    "SELECT DBMS_CLOUD_AI_AGENT.RUN_TEAM(?, ?, ?) FROM DUAL",
                    String.class,
                    agentsTeam, prompt, paramsJson);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("Select AI agent failed after {}ms (conversation: {}): {}",
                    elapsed, conversationId, e.getMessage(), e);
            throw e;
        }
        long elapsed = System.currentTimeMillis() - t0;
        log.info("Select AI agent OK in {}ms (conversation: {})", elapsed, conversationId);

        return new AgentResponse(request.prompt(), response, conversationId, elapsed);
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI chat: {}", prompt);

        long t0 = System.currentTimeMillis();
        try {
            String response = jdbcTemplate.queryForObject(
                    GENERATE_SQL, String.class, prompt, queryProfile, "chat");
            long elapsed = System.currentTimeMillis() - t0;

            log.info("Select AI chat OK in {}ms", elapsed);
            return new ChatResponse(request.prompt(), response, elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("Select AI chat failed after {}ms: {}", elapsed, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/rag")
    public RagResponse rag(@RequestBody RagRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI RAG: {}", prompt);

        long t0 = System.currentTimeMillis();
        try {
            String answer = jdbcTemplate.queryForObject(
                    GENERATE_SQL, String.class, prompt, ragProfile, "narrate");
            long elapsed = System.currentTimeMillis() - t0;

            log.info("Select AI RAG OK in {}ms", elapsed);
            return new RagResponse(request.prompt(), answer, elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("Select AI RAG failed after {}ms: {}", elapsed, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/hybrid")
    public HybridResponse hybrid(@RequestBody HybridRequest request) {
        String prompt = validatePrompt(request.prompt());
        log.info("Select AI hybrid: {}", prompt);

        long t0 = System.currentTimeMillis();
        try {
            String answer = jdbcTemplate.queryForObject(
                    GENERATE_SQL, String.class, prompt, ragProfile, "narrate");
            long elapsed = System.currentTimeMillis() - t0;

            log.info("Select AI hybrid OK in {}ms", elapsed);
            return new HybridResponse(request.prompt(), answer, elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("Select AI hybrid failed after {}ms: {}", elapsed, e.getMessage(), e);
            throw e;
        }
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
