# 15 — Add Multi-Turn Conversation for Agents

## Priority: P2

## Problem

The current demo is single-shot: ask a question, get an answer, done. Real users think in threads — they drill down, refine, and build on previous answers. Without multi-turn, the "agent" in Select AI Agents feels like a fancy NL2SQL wrapper.

Example conversation flow:

1. _"Show me employees in the IT department"_ → table of IT employees
2. _"Now filter by salary over 10,000"_ → filtered subset
3. _"Who among them was hired in the last 2 years?"_ → further filtered
4. _"Compare their salaries to the department average"_ → analytical follow-up

Each step references the previous context. This is what makes an agent feel like an agent.

## What Needs to Change

### 1. Investigate Agent Conversation Support

Check whether `DBMS_CLOUD_AI_AGENT.RUN` supports conversation context:

```sql
-- Does it accept a conversation_id or session_id parameter?
v_result := DBMS_CLOUD_AI_AGENT.RUN(
  agent_name      => 'HR_ANALYST',
  prompt          => :prompt,
  conversation_id => :conv_id   -- Does this parameter exist?
);
```

If not natively supported, alternatives:

- **Option A:** Prepend conversation history to the prompt (simple, may work for POC)
- **Option B:** Use database session state — keep the same JDBC connection for a conversation
- **Option C:** Build conversation context in the frontend and send the full thread each time

### 2. Backend — Add Conversation State

**File:** `src/backend/.../controller/SelectAIController.java`

If using prompt prepending (Option A):

```java
@PostMapping("/agents")
public AgentResponse agents(@RequestBody AgentConversationRequest request) {
    // request includes conversationHistory: [{role, content}, ...]
    String contextualPrompt = buildContextualPrompt(
        request.conversationHistory(),
        request.prompt()
    );
    // ... call agent with contextualPrompt
}
```

If using native conversation support:

```java
// Pass conversation ID to maintain server-side context
v_result := DBMS_CLOUD_AI_AGENT.RUN(
  agent_name      => 'HR_ANALYST',
  prompt          => :prompt,
  conversation_id => :conversationId
);
```

### 3. Frontend — Chat-Style UI for Agents

**File:** `src/frontend/src/app/agents/agents.component.ts`

Transform from single-input/single-output to a chat interface:

- Display conversation as a message thread (user messages + agent responses)
- Keep input at the bottom
- Maintain conversation history in component state
- Add a "New Conversation" button to reset context
- Example prompts only shown for the first message

## Demo Scenarios

| Turn | User Says                                            | Agent Does                                         |
| ---- | ---------------------------------------------------- | -------------------------------------------------- |
| 1    | "Show me all employees in the Sales department"      | Queries EMPLOYEES + DEPARTMENTS                    |
| 2    | "Who among them earns above the department average?" | Calculates avg, filters (uses context from turn 1) |
| 3    | "Show their job history"                             | Queries JOB_HISTORY for the filtered employees     |
| 4    | "Which of them have been promoted in the last year?" | Interprets JOB_HISTORY dates as promotions         |

## Acceptance Criteria

- [ ] Agents tab displays conversation history as a chat thread
- [ ] Follow-up questions reference context from previous turns
- [ ] "New Conversation" button resets context
- [ ] At least one 3-turn conversation scenario works correctly

## References

- [DBMS_CLOUD_AI_AGENT Package](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-agent-package.html)
