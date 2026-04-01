# 16 — Display Agent Reasoning Trace

## Priority: P2

## Problem

Agent multi-step reasoning is the whole point of Select AI Agents — the agent plans, executes queries, and synthesizes results. But if the response arrives as one final blob of text, the audience misses the intelligence behind it. The "agent" feels no different from NL2SQL.

## What Needs to Change

### 1. Investigate Agent Response Structure

When calling `DBMS_CLOUD_AI_AGENT.RUN`, check what the response contains:

```sql
DECLARE
  v_result CLOB;
BEGIN
  v_result := DBMS_CLOUD_AI_AGENT.RUN(
    agent_name => 'HR_ANALYST',
    prompt     => 'Analyze salary distribution across departments'
  );
  DBMS_OUTPUT.PUT_LINE(v_result);
END;
```

The response may include:

- `steps[]` — reasoning trace showing the agent's plan
- `tool_calls[]` — which tools (NL2SQL, PL/SQL) were invoked and their results
- `final_answer` — the synthesized conclusion
- Or it may be plain text with no structure

### 2. Backend — Parse and Forward Structure

**File:** `src/backend/.../controller/SelectAIController.java`

If the response is JSON with steps:

```java
// Parse the CLOB as JSON
JsonNode agentResponse = objectMapper.readTree(result);
List<AgentStep> steps = parseSteps(agentResponse.get("steps"));
String finalAnswer = agentResponse.get("final_answer").asText();
```

**File:** `src/backend/.../dto/AgentResponse.java`

Update the DTO to include reasoning:

```java
public record AgentResponse(
    String prompt,
    String response,          // Final answer
    List<AgentStep> steps,    // Reasoning trace (may be null)
    long timeInMillis
) {}

public record AgentStep(
    String action,            // e.g., "nl2sql", "analyze"
    String description,       // e.g., "Querying average salary per department"
    String result             // e.g., the SQL or intermediate result
) {}
```

### 3. Frontend — Display Reasoning Steps

**File:** `src/frontend/src/app/agents/agents.component.ts`

If steps are available, display them as an expandable timeline above the final answer:

```
[Step 1] Querying average salary per department...
         → SELECT department_name, AVG(salary) FROM employees JOIN departments...
         → Found 11 departments

[Step 2] Calculating overall company average...
         → SELECT AVG(salary) FROM employees
         → $6,461.83

[Step 3] Comparing department averages to company average...
         → 4 departments above average

[Final Answer]
The departments with above-average salaries are: Executive ($19,333),
Accounting ($10,154), Finance ($8,601), and IT ($5,760)...
```

If steps are NOT available (plain text response), display as-is — don't break the UI for lack of structured data.

### 4. Streaming (Stretch Goal)

If `DBMS_CLOUD_AI_AGENT.RUN` supports streaming or callbacks:

- Use Server-Sent Events (SSE) to push steps to the frontend as they happen
- Each step appears in real-time, building anticipation for the final answer
- This is the most impressive demo experience but may not be supported

If streaming isn't available, display all steps at once with a brief animation (sequential reveal).

## Acceptance Criteria

- [ ] Agent response structure is documented (what fields are available)
- [ ] If structured steps exist, they're displayed in the frontend as a timeline
- [ ] If no structured steps, plain text displays correctly (graceful fallback)
- [ ] Final answer is visually distinct from reasoning steps

## References

- [DBMS_CLOUD_AI_AGENT Package](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-agent-package.html)
- [Examples of Using Select AI Agent](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/examples-using-select-ai-agent.html)
