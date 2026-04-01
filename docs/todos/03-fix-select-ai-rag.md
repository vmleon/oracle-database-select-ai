# 03 — Fix Select AI RAG Implementation

## Problem

The current RAG feature uses a fabricated `"oci_rag": true` attribute in `DBMS_CLOUD_AI.create_profile()`. This attribute does not exist in Oracle's API.

Select AI RAG requires:

1. A **vector index** created via `DBMS_CLOUD_AI.CREATE_VECTOR_INDEX` that indexes documents from Object Storage
2. A profile with the `vector_index_name` attribute pointing to that index
3. Documents uploaded to an Object Storage bucket for the index to consume

## What Needs to Change

### 1. Prepare HR Policy Documents

Create sample HR policy documents to upload to Object Storage. These are the "knowledge base" that RAG will search.

**Directory:** `deploy/ansible/ops/base/files/rag-docs/` (new)

Suggested documents (plain text or PDF):

| Document                       | Content                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `employee-handbook.txt`        | Company values, code of conduct, general policies         |
| `pto-policy.txt`               | Vacation days by tenure, sick leave, holiday calendar     |
| `benefits-guide.txt`           | Health insurance, 401k match, wellness programs           |
| `travel-expense-policy.txt`    | Booking guidelines, per diem rates, reimbursement process |
| `onboarding-checklist.txt`     | First week tasks, required training, IT setup             |
| `performance-review-guide.txt` | Review cycle, rating criteria, promotion process          |

These don't need to be real — just realistic enough for a compelling demo. A few paragraphs each is sufficient.

### 2. Infrastructure — Object Storage for Documents

**File:** `deploy/tf/app/storage.tf`

- Create a dedicated bucket (or subfolder in the existing artifacts bucket) for RAG documents
- Upload the sample documents via Terraform `oci_objectstorage_object` or via Ansible file copy
- Create a PAR for the bucket/prefix so the ADB can read from it

### 3. SQL Scripts — Create Vector Index + RAG Profile

**File:** `deploy/ansible/ops/base/files/init/create_vector_index.sql.j2` (new)

```sql
-- Create vector index over the HR policy documents in Object Storage
BEGIN
  DBMS_CLOUD_AI.CREATE_VECTOR_INDEX(
    index_name  => 'HR_POLICY_INDEX',
    attributes  => '{"vector_db_provider": "oracle",
                     "location":           "https://objectstorage.{{ region }}.oraclecloud.com/n/{{ namespace }}/b/{{ bucket }}/o/rag-docs/",
                     "object_storage_credential_name": "OCI$RESOURCE_PRINCIPAL",
                     "profile_name":       "GENAI_RAG",
                     "chunk_size":         1500,
                     "chunk_overlap":      300}'
  );
END;
/
```

**File:** `deploy/ansible/ops/base/files/init/create_profile_select_ai.sql.j2`

- Remove the `"oci_rag": true` attribute from the RAG profile
- Add `"vector_index_name": "HR_POLICY_INDEX"` to the RAG profile attributes instead

### 4. Ansible Tasks

**File:** `deploy/ansible/ops/base/tasks/main.yaml`

- Upload RAG documents to Object Storage (before vector index creation)
- Run `create_vector_index.sql.j2` after profile creation
- Register output and fail on ORA- errors

### 5. Backend — Mostly Correct Already

**File:** `src/backend/.../controller/SelectAIController.java`

The existing `SELECT AI narrate <prompt>` syntax is correct for RAG **once the profile has `vector_index_name` set**. Oracle automatically performs retrieval when the profile references a vector index.

Minor improvements:

- The `RagResponse.context` field is always null — investigate if Oracle returns retrieved chunks in a separate column or if we need a secondary query against the vector index
- If context retrieval isn't straightforward, drop the `context` field from the response (keep it simple)

### 6. Frontend

**File:** `src/frontend/src/app/rag/rag.component.ts`

- Update placeholder and example prompts to HR policy questions
- If `context` remains null, remove the "Retrieved Context" section from the UI
- If context is available, display the source document name and relevant chunk

## HR Demo Scenarios for RAG

These questions are answerable from the policy documents, NOT from the database tables — that's the key differentiator from NL2SQL:

| Prompt                                              | Expected Source Document     |
| --------------------------------------------------- | ---------------------------- |
| "How many vacation days do new employees get?"      | pto-policy.txt               |
| "What is the company's policy on remote work?"      | employee-handbook.txt        |
| "How do I submit a travel expense report?"          | travel-expense-policy.txt    |
| "What health insurance plans are available?"        | benefits-guide.txt           |
| "What happens during my first week at the company?" | onboarding-checklist.txt     |
| "How does the performance review process work?"     | performance-review-guide.txt |
| "What is the 401k employer match percentage?"       | benefits-guide.txt           |
| "Can I carry over unused PTO to next year?"         | pto-policy.txt               |

**Why this is a great demo:** It clearly shows that RAG answers come from _documents_, not from database queries. The audience immediately understands the difference between "ask questions about data" (NL2SQL) and "ask questions about policies" (RAG).

## Acceptance Criteria

- [ ] Sample HR policy documents created and uploaded to Object Storage
- [ ] `DBMS_CLOUD_AI.CREATE_VECTOR_INDEX` runs without errors
- [ ] RAG profile has `vector_index_name` set (not fabricated `oci_rag`)
- [ ] `SELECT AI narrate 'How many vacation days do new employees get?'` returns an answer sourced from documents
- [ ] Frontend displays RAG answers with updated HR-themed prompts

## References

- [Select AI with RAG Documentation](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-retrieval-augmented-generation.html)
- [DBMS_CLOUD_AI.CREATE_VECTOR_INDEX](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-package.html#GUID-CREATE_VECTOR_INDEX)
- [Announcing Select AI with RAG on ADB](https://blogs.oracle.com/database/announcing-select-ai-with-rag-on-adb)
