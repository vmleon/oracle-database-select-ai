# 13 — Add Hybrid NL2SQL + RAG Demo Scenario

## Priority: P1

## Problem

The demo treats NL2SQL and RAG as completely separate features in separate tabs. But Oracle's killer differentiator is that Select AI can combine **structured data queries** (from database tables) with **document retrieval** (from vector-indexed documents) in a single interaction.

No other database vendor can do this. This is the most memorable thing in the demo.

## Concept

A hybrid query requires information from both sources:

> _"What is our PTO policy, and how many vacation days has Steven King taken this year?"_

- **RAG part:** PTO policy details come from `pto-policy.txt`
- **NL2SQL part:** Steven King's actual leave data comes from database tables

The audience immediately sees that Oracle handles both structured and unstructured data through one interface.

## What Needs to Change

### 1. Investigate Feasibility

Before implementing, verify how Select AI handles hybrid queries:

**Option A — Single profile with both NL2SQL + RAG:**
If a profile has both `object_list` (tables) and `vector_index_name` (documents), does `SELECT AI narrate` automatically combine both sources?

Test with sqlcl:

```sql
-- Set profile that has BOTH object_list and vector_index_name
EXEC DBMS_CLOUD_AI.SET_PROFILE('GENAI_HYBRID');

-- Ask a question that needs both sources
SELECT AI narrate What is our PTO policy and how many vacation days has Steven King used this year;
```

**Option B — Agent with both tools:**
If a single profile can't do both, an Agent can be configured with:

- NL2SQL tool (for querying HR tables)
- RAG tool (for searching policy documents)

The agent decides which tool(s) to use based on the question.

**Option C — Frontend orchestration:**
As a fallback, the frontend could split the question and call both endpoints, then combine the results. This is less impressive but still demonstrates the concept.

### 2. Create Hybrid Profile (if Option A works)

**File:** `deploy/ansible/ops/base/files/init/create_profile_select_ai.sql.j2`

Create a fourth profile that combines both capabilities:

```json
{
  "provider": "oci",
  "credential_name": "OCI$RESOURCE_PRINCIPAL",
  "object_list": [
    {"owner": "HR", "name": "EMPLOYEES"},
    {"owner": "HR", "name": "DEPARTMENTS"},
    ...
  ],
  "vector_index_name": "HR_POLICY_INDEX",
  "region": "{{ region_name }}",
  "oci_compartment_id": "{{ oci_genai_compartment_id }}",
  "oci_apiformat": "GENERIC"
}
```

### 3. Backend — Add Hybrid Endpoint or Mode

**File:** `src/backend/.../controller/SelectAIController.java`

If this needs a separate endpoint:

```java
@PostMapping("/hybrid")
public HybridResponse hybrid(@RequestBody HybridRequest request) {
    setProfile(hybridProfile);
    String answer = jdbcTemplate.queryForObject(
        String.format("SELECT AI narrate %s", prompt), String.class);
    return new HybridResponse(request.prompt(), answer, elapsed);
}
```

Or add it as a section within the existing RAG or Query tab.

### 4. Frontend — Showcase the Hybrid Capability

This could be:

- A dedicated "Hybrid" tab (most visible)
- A special section at the bottom of the RAG tab
- A "Try This" callout in the demo flow

Example prompts:
| Prompt | RAG Source | NL2SQL Source |
|--------|-----------|---------------|
| "What is our PTO policy and how many days has Steven King used?" | pto-policy.txt | HR.EMPLOYEES + leave tracking |
| "What are the health insurance options and which department has the most employees enrolled?" | benefits-guide.txt | HR.EMPLOYEES + HR.DEPARTMENTS |
| "Explain the performance review process and show me employees due for review this quarter" | performance-review-guide.txt | HR.EMPLOYEES (hire_date-based) |

## Demo Impact

This is the "and one more thing" moment:

> **Presenter:** "We've seen Select AI query data and search documents separately. But what if you need both?"
> _Types: "What is our PTO policy and how many vacation days has Steven King taken?"_
> **Presenter:** "One question. Oracle found the policy in your documents AND queried the employee database. Same interface. That's something no other database can do."

## Acceptance Criteria

- [ ] Hybrid queries that need both structured data and documents return combined answers
- [ ] At least one demo scenario works end-to-end
- [ ] The UI makes it clear that both data sources were used
- [ ] If hybrid isn't supported in a single call, document the limitation and implement the best alternative

## References

- [Select AI with RAG](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-retrieval-augmented-generation.html)
- [Select AI Profiles](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/manage-select-ai-profiles.html)
