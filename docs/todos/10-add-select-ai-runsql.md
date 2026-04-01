# 10 — Add SELECT AI runsql Action

## Priority: P0

## Problem

The demo uses `SELECT AI showsql` + `SELECT AI narrate` + manual SQL execution as three separate steps. But `SELECT AI runsql` generates AND executes SQL in a single step — it's the "magic moment" that makes jaws drop. The demo is missing its most impressive action.

## What Needs to Change

### 1. Backend — Add runsql Endpoint

**File:** `src/backend/.../controller/SelectAIController.java`

Add a new endpoint or mode to the existing `/query` endpoint:

```java
@PostMapping("/runsql")
public RunSqlResponse runsql(@RequestBody QueryRequest request) {
    String prompt = validatePrompt(request.prompt());
    setProfile(queryProfile);

    long start = System.currentTimeMillis();
    // runsql generates SQL and executes it in one step
    // Returns the result set directly
    List<Map<String, Object>> results = jdbcTemplate.queryForList(
        String.format("SELECT AI runsql %s", prompt)
    );
    long elapsed = System.currentTimeMillis() - start;

    return new RunSqlResponse(request.prompt(), results, elapsed);
}
```

Note: `runsql` returns a result set, not a string. The column structure depends on the generated SQL. Handle this the same way the existing query result parsing works (convert to `List<Map<String, String>>`).

### 2. Backend — New DTO

**File:** `src/backend/.../dto/RunSqlResponse.java` (new)

```java
public record RunSqlResponse(
    String prompt,
    List<Map<String, String>> result,
    long timeInMillis
) {}
```

### 3. Frontend — Add Quick Query Mode

**File:** `src/frontend/src/app/query/query.component.ts`

Add a toggle or second button to the query component:

- **"Query" (existing)** — Shows the detailed breakdown: generated SQL + narration + results (3 steps)
- **"Quick Query" (new)** — Uses `runsql` for instant results (1 step)

The contrast between modes tells the story: _"You can go fast, or you can inspect what's happening."_

Alternatively, add `runsql` as the default and show the detailed breakdown as an expandable "Show Details" section.

### 4. Frontend — Update Service

**File:** `src/frontend/src/app/select-ai.service.ts`

```typescript
runsql(prompt: string): Observable<RunSqlResponse> {
  return this.http.post<RunSqlResponse>(`${this.baseUrl}/runsql`, { prompt });
}
```

## Demo Impact

This is the demo opener. Before showing the SQL breakdown, show `runsql`:

> **Presenter:** "Watch this. I'm going to ask the database a question in plain English."
> _Types: "Who are the top 5 highest paid employees?"_
> _Results appear instantly in a table._
> **Presenter:** "That's it. One question, instant results. Now let me show you what happened behind the scenes..."
> _Switches to detailed mode to show the generated SQL._

## Acceptance Criteria

- [ ] `POST /api/v1/selectai/runsql` returns query results from a natural language prompt
- [ ] Results display as a table in the frontend
- [ ] User can toggle between "Quick Query" and "Detailed" modes
- [ ] Timing displayed to show how fast runsql is

## References

- [SELECT AI Actions](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/sql-generation-ai-autonomous-database.html)
