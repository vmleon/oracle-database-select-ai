# 02 — Fix Select AI Agents Implementation

## Problem

The current Agents feature uses a fabricated `"oci_agent": true` attribute in `DBMS_CLOUD_AI.create_profile()`. This attribute does not exist in Oracle's API.

Select AI Agent uses a **separate package** — `DBMS_CLOUD_AI_AGENT` — with its own procedures for creating agents, registering tools, and running them.

## What Needs to Change

### 1. SQL Scripts — Create Agent + Tools

**File:** `deploy/ansible/ops/base/files/init/create_agent.sql.j2` (new)

Create a PL/SQL script that:

1. Creates an AI agent via `DBMS_CLOUD_AI_AGENT.CREATE_AGENT`:
   - Agent name: `HR_ANALYST`
   - Description: agent that answers HR questions using the HR schema
   - References the existing Select AI profile for LLM access
2. Registers tools via `DBMS_CLOUD_AI_AGENT.CREATE_TOOL`:
   - **NL2SQL tool** — lets the agent query the HR schema tables (EMPLOYEES, DEPARTMENTS, JOBS, JOB_HISTORY, LOCATIONS, COUNTRIES, REGIONS)
   - Optionally a **PL/SQL tool** for computed metrics (e.g., tenure calculation, salary band classification)
3. Error handling: wrap in `BEGIN...EXCEPTION WHEN OTHERS` to handle "agent already exists" on re-runs

### 2. Ansible Tasks — Run the Agent Script

**File:** `deploy/ansible/ops/base/tasks/main.yaml`

- Remove `"oci_agent": true` from the profile creation loop attributes
- Add a new task after profile creation that runs `create_agent.sql.j2`
- Register output and fail on ORA- errors (per [TODO-08](08-ansible-error-handling.md))

### 3. Backend — Use `DBMS_CLOUD_AI_AGENT.RUN`

**File:** `src/backend/.../controller/SelectAIController.java`

The `/api/v1/selectai/agents` endpoint must change from:

```sql
-- Current (wrong): just NL2SQL with a different profile
SELECT AI <prompt>
```

To PL/SQL that calls:

```sql
DECLARE
  v_result CLOB;
BEGIN
  v_result := DBMS_CLOUD_AI_AGENT.RUN(
    agent_name => 'HR_ANALYST',
    prompt     => :prompt
  );
  :result := v_result;
END;
```

- Use `CallableStatement` or `JdbcTemplate.execute()` with an output parameter
- The agent response may include reasoning steps and tool invocations — parse the JSON response
- Update `AgentResponse` DTO if the response shape changes (may include `steps[]`, `tool_calls[]`, `final_answer`)

### 4. Frontend — Display Agent Reasoning

**File:** `src/frontend/src/app/agents/agents.component.ts`

- If the agent returns structured steps, display them as a timeline/accordion
- If it returns plain text, display as-is (keep it simple for POC)
- Update placeholder and example prompts to HR scenarios

## HR Demo Scenarios for Agents

These showcase the agent's ability to do multi-step reasoning and tool orchestration:

| Prompt                                                                                 | What the Agent Does                                             |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| "Who are the top 5 highest paid employees and what departments are they in?"           | NL2SQL → join EMPLOYEES + DEPARTMENTS, ORDER BY salary DESC     |
| "Analyze salary distribution across departments — which ones are above average?"       | Multiple queries: avg salary per dept, overall avg, comparison  |
| "Show me employees who changed roles in the last 2 years and their salary progression" | Queries JOB_HISTORY + EMPLOYEES, correlates dates and salaries  |
| "Compare headcount across all regions and identify the smallest offices"               | Joins EMPLOYEES → DEPARTMENTS → LOCATIONS → COUNTRIES → REGIONS |
| "Which managers have the most direct reports?"                                         | Self-join on EMPLOYEES.manager_id, GROUP BY + COUNT             |
| "Find departments with no job history changes — are they stable or stagnant?"          | LEFT JOIN DEPARTMENTS to JOB_HISTORY, filter NULLs              |

## Acceptance Criteria

- [ ] `DBMS_CLOUD_AI_AGENT.CREATE_AGENT` runs without errors on ADB 26ai
- [ ] At least one NL2SQL tool is registered and can query HR tables
- [ ] Backend `/api/v1/selectai/agents` returns agent response (not plain NL2SQL)
- [ ] Frontend displays agent output
- [ ] Demo scenarios above produce meaningful results

## References

- [DBMS_CLOUD_AI_AGENT Package](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-agent-package.html)
- [Examples of Using Select AI Agent](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/examples-using-select-ai-agent.html)
- [Getting Started with Select AI Agent](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/getting-started-select-ai-agent.html)
