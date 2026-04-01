# 17 — Add Model Selection to Profiles

## Priority: P2

## Problem

The Select AI profiles don't specify which LLM to use — they default to whatever OCI Generative AI provides. Enterprise customers care deeply about model choice: Cohere Command R+, Meta Llama 3, custom fine-tuned models. Showing that you can swap models without changing application code is a key selling point.

## What Needs to Change

### 1. Investigate Available Models

Check which models are available in the target OCI region:

```sql
-- List available models (if this API exists)
SELECT * FROM DBMS_CLOUD_AI.LIST_MODELS();
```

Or check the OCI console: Generative AI > Models. Common options:

- `cohere.command-r-plus` — strong at NL2SQL
- `meta.llama-3.1-405b-instruct` — open-source alternative
- `cohere.command-r` — lighter weight option

### 2. Add Model to Profile Attributes

**File:** `deploy/ansible/ops/base/files/init/create_profile_select_ai.sql.j2`

Add the `model` attribute to the profile:

```json
{
  "provider": "oci",
  "credential_name": "OCI$RESOURCE_PRINCIPAL",
  "model": "{{ selectai_model | default('cohere.command-r-plus') }}",
  "object_list": [...],
  "region": "{{ region_name }}",
  "oci_compartment_id": "{{ oci_genai_compartment_id }}",
  "oci_apiformat": "GENERIC"
}
```

### 3. Option A — Simple: Configurable via Ansible Variable

**File:** `deploy/ansible/ops/base/defaults/main.yaml` (or vars)

```yaml
selectai_model: "cohere.command-r-plus"
```

This lets you change the model at deploy time. Simple, sufficient for a POC.

### 4. Option B — Advanced: Runtime Model Switching

Create multiple profiles with different models:

```sql
-- Profile with Cohere
DBMS_CLOUD_AI.CREATE_PROFILE('GENAI_SELECT_AI_COHERE', '{"model": "cohere.command-r-plus", ...}');

-- Profile with Llama
DBMS_CLOUD_AI.CREATE_PROFILE('GENAI_SELECT_AI_LLAMA', '{"model": "meta.llama-3.1-405b-instruct", ...}');
```

**Backend:** Add a `model` parameter to the query endpoint:

```java
@PostMapping("/query")
public QueryResponse query(@RequestBody QueryRequest request) {
    String profile = resolveProfile(request.model()); // "cohere" → GENAI_SELECT_AI_COHERE
    setProfile(profile);
    // ... rest unchanged
}
```

**Frontend:** Add a model selector dropdown:

```typescript
models = [
  { label: "Cohere Command R+", value: "cohere" },
  { label: "Meta Llama 3.1", value: "llama" },
];
```

### 5. Demo Impact — Side-by-Side Comparison

The most compelling demo: ask the same question with two different models and compare:

|                                           | Cohere Command R+             | Meta Llama 3.1                |
| ----------------------------------------- | ----------------------------- | ----------------------------- |
| **Query:** "Top 5 highest paid employees" | Shows generated SQL + results | Shows generated SQL + results |
| **SQL Quality**                           | May use different syntax      | May use different approach    |
| **Speed**                                 | X ms                          | Y ms                          |

This tells the story: _"Oracle gives you model choice. Same interface, same data, your pick of LLM."_

## Acceptance Criteria

- [ ] At least one profile specifies a model explicitly (not relying on defaults)
- [ ] Model name is visible somewhere in the UI (even just as text, not necessarily selectable)
- [ ] If implementing Option B: two models produce results for the same query

## References

- [Select AI Profile Attributes](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/manage-select-ai-profiles.html)
- [OCI Generative AI Models](https://docs.oracle.com/en-us/iaas/Content/generative-ai/use-playground-chat.htm)
