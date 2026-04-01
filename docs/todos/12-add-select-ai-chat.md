# 12 — Add SELECT AI chat Action

## Priority: P1

## Problem

Select AI has four actions: `showsql`, `narrate`, `runsql`, and `chat`. The demo only uses `showsql` and `narrate`. The `chat` action lets the database answer general knowledge questions without querying any tables — pure LLM conversation through the same SQL interface.

This matters because it shows Select AI is a **unified natural language interface**, not just NL2SQL. The same `SELECT AI` syntax handles structured data queries AND general conversation.

## What Needs to Change

### 1. Backend — Add Chat Endpoint

**File:** `src/backend/.../controller/SelectAIController.java`

```java
@PostMapping("/chat")
public ChatResponse chat(@RequestBody ChatRequest request) {
    String prompt = validatePrompt(request.prompt());
    setProfile(queryProfile);  // Uses the base Select AI profile

    long start = System.currentTimeMillis();
    String response = jdbcTemplate.queryForObject(
        String.format("SELECT AI chat %s", prompt), String.class);
    long elapsed = System.currentTimeMillis() - start;

    return new ChatResponse(request.prompt(), response, elapsed);
}
```

### 2. Backend — New DTOs

**File:** `src/backend/.../dto/ChatRequest.java` (new)

```java
public record ChatRequest(String prompt) {}
```

**File:** `src/backend/.../dto/ChatResponse.java` (new)

```java
public record ChatResponse(
    String prompt,
    String response,
    long timeInMillis
) {}
```

### 3. Frontend — Add Chat Tab

**File:** `src/frontend/src/app/chat/chat.component.ts` (new)

A simple chat component — text input, submit, display response. Simpler than the query component since there's no SQL or result table to show.

Example prompts:

```typescript
examples = [
  "What is a foreign key in a relational database?",
  "Explain the difference between INNER JOIN and LEFT JOIN",
  "What are best practices for database indexing?",
];
```

Placeholder: `"e.g. What is a foreign key?"`

### 4. Frontend — Add Route and Navigation

**File:** `src/frontend/src/app/app.routes.ts`

```typescript
{ path: 'chat', component: ChatComponent }
```

Add "Chat" to the navigation bar alongside Query, Agents, and RAG.

### 5. Frontend — Update Service

**File:** `src/frontend/src/app/select-ai.service.ts`

```typescript
chat(prompt: string): Observable<ChatResponse> {
  return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, { prompt });
}
```

## Demo Impact

Place Chat between NL2SQL and Agents in the demo flow to show breadth:

> **NL2SQL:** "Ask questions about your data" (SELECT AI runsql/showsql/narrate)
> **Chat:** "Ask general questions through the same interface" (SELECT AI chat)
> **Agents:** "Let AI analyze and reason" (DBMS_CLOUD_AI_AGENT)
> **RAG:** "Ask questions about your documents" (SELECT AI with vector index)

The key insight for the audience: **one interface, four capabilities**.

## Acceptance Criteria

- [ ] `POST /api/v1/selectai/chat` returns LLM response for general questions
- [ ] Chat tab appears in frontend navigation
- [ ] Example prompts work and return meaningful answers
- [ ] Chat responses are clearly distinct from NL2SQL results (no SQL generated)

## References

- [SELECT AI Actions](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/sql-generation-ai-autonomous-database.html)
