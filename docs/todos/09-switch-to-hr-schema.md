# 09 — Switch from SH to HR Schema + Demo Scenarios

## Why HR Instead of SH?

The current project uses the **SH (Sales History)** sample schema. Switching to **HR (Human Resources)** is better for demos because:

- **Everyone understands HR** — employees, departments, salaries, managers are universally relatable
- **Rich relationships** — self-join (manager), multi-table joins (employee → department → location → country → region), temporal data (job_history)
- **Natural questions** — people instinctively ask "who earns the most?", "how many people in engineering?", "who reports to whom?"
- **Clean RAG story** — HR policy documents (PTO, benefits, onboarding) are a perfect RAG use case that's clearly distinct from the database queries

## HR Schema Tables

The HR sample schema is pre-installed on Oracle Autonomous Database. These are the tables Select AI will query:

| Table            | Key Columns                                                                                                     | Demo Value                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `HR.EMPLOYEES`   | employee_id, first_name, last_name, email, hire_date, job_id, salary, commission_pct, manager_id, department_id | Core entity — salaries, org chart, tenure                        |
| `HR.DEPARTMENTS` | department_id, department_name, manager_id, location_id                                                         | Grouping, department heads                                       |
| `HR.JOBS`        | job_id, job_title, min_salary, max_salary                                                                       | Salary bands, role analysis                                      |
| `HR.JOB_HISTORY` | employee_id, start_date, end_date, job_id, department_id                                                        | Career progression, turnover                                     |
| `HR.LOCATIONS`   | location_id, street_address, city, state_province, country_id                                                   | Office locations                                                 |
| `HR.COUNTRIES`   | country_id, country_name, region_id                                                                             | Geographic grouping                                              |
| `HR.REGIONS`     | region_id, region_name                                                                                          | Top-level geography (Americas, Europe, Asia, Middle East/Africa) |

## What Needs to Change

### 1. SQL Profile — Update Object List

**File:** `deploy/ansible/ops/base/files/init/create_profile_select_ai.sql.j2`

Change the `object_list` in profile attributes from SH tables to HR tables:

```json
"object_list": [
  {"owner": "HR", "name": "EMPLOYEES"},
  {"owner": "HR", "name": "DEPARTMENTS"},
  {"owner": "HR", "name": "JOBS"},
  {"owner": "HR", "name": "JOB_HISTORY"},
  {"owner": "HR", "name": "LOCATIONS"},
  {"owner": "HR", "name": "COUNTRIES"},
  {"owner": "HR", "name": "REGIONS"}
]
```

### 2. Table Comments — Help Select AI Understand the Schema

**File:** `deploy/ansible/ops/base/files/init/add_comments.sql`

Replace all SH table/column comments with HR equivalents. Good comments dramatically improve NL2SQL accuracy. Examples:

```sql
COMMENT ON TABLE HR.EMPLOYEES IS 'All employees in the organization with their job, salary, manager, and department';
COMMENT ON COLUMN HR.EMPLOYEES.SALARY IS 'Monthly salary in USD';
COMMENT ON COLUMN HR.EMPLOYEES.COMMISSION_PCT IS 'Commission percentage for sales roles, NULL for non-sales';
COMMENT ON COLUMN HR.EMPLOYEES.MANAGER_ID IS 'Employee ID of direct manager, NULL for CEO';
COMMENT ON TABLE HR.JOB_HISTORY IS 'Historical record of job changes - each row is a previous position held by an employee';
COMMENT ON TABLE HR.JOBS IS 'Job titles and salary ranges (min_salary and max_salary define the pay band)';
```

### 3. Test Queries

**File:** `deploy/ansible/ops/base/files/queries/test_select_ai.sql`

```sql
SELECT AI What is the total number of employees;
```

**File:** `deploy/ansible/ops/base/files/queries/test_rag.sql`

```sql
SELECT AI narrate How many vacation days do new employees get;
```

### 4. Frontend — Update Examples and Placeholders

**File:** `src/frontend/src/app/query/query.component.ts`

```typescript
examples = [
  "Who are the top 5 highest paid employees?",
  "How many employees are in each department?",
  "Show me all employees hired in the last 3 years",
];
```

Placeholder: `"e.g. Who are the highest paid employees in the IT department?"`

**File:** `src/frontend/src/app/agents/agents.component.ts`

Placeholder: `"e.g. Analyze salary distribution across departments and identify outliers"`

Example prompts:

```typescript
examples = [
  "Which departments have the highest average salary?",
  "Show me employees who changed roles and their salary progression",
  "Compare headcount across all regions",
];
```

**File:** `src/frontend/src/app/rag/rag.component.ts`

Placeholder: `"e.g. How many vacation days do new employees get?"`

Example prompts:

```typescript
examples = [
  "What is the company policy on remote work?",
  "How do I submit a travel expense report?",
  "What health insurance plans are available?",
];
```

### 5. CLAUDE.md — Update Dataset Reference

**File:** `CLAUDE.md`

Change `Dataset: SH sample schema` to `Dataset: HR sample schema`.

### 6. Unlock HR Schema (if locked)

On some ADB instances, the HR account is locked by default. Add to the ops init:

```sql
ALTER USER HR ACCOUNT UNLOCK;
ALTER USER HR IDENTIFIED BY <password>;
GRANT SELECT ON HR.EMPLOYEES TO ADMIN;
GRANT SELECT ON HR.DEPARTMENTS TO ADMIN;
-- ... etc for all HR tables
```

Or use `SELECT ANY TABLE` privilege for ADMIN if simpler.

## Demo Scenarios — The Full Story

The demo tells a cohesive story across all three features. Here's the recommended flow:

### Act 1: Select AI (NL2SQL) — "Ask Questions About Your Data"

Natural language → SQL → results. The audience sees Oracle translate English into SQL in real time.

| #   | Prompt                                                     | What It Shows                                                           |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | "How many employees do we have?"                           | Simplest possible query — COUNT(\*)                                     |
| 2   | "Who are the top 5 highest paid employees?"                | ORDER BY + LIMIT, shows salary data                                     |
| 3   | "How many employees are in each department?"               | JOIN + GROUP BY — multi-table                                           |
| 4   | "Show all employees in the IT department hired after 2005" | WHERE + JOIN + date filtering                                           |
| 5   | "Which managers have the most direct reports?"             | Self-join on manager_id — impressive                                    |
| 6   | "What is the average salary by region?"                    | 4-table join: EMPLOYEES → DEPARTMENTS → LOCATIONS → COUNTRIES → REGIONS |
| 7   | "Show the salary range utilization for each job title"     | Compares actual salaries to min/max in JOBS                             |

**Narrative arc:** Start simple, build to complex multi-table queries. The audience sees Select AI handle increasingly sophisticated questions.

### Act 2: Select AI Agents — "Let AI Analyze and Reason"

The agent goes beyond single queries — it reasons, runs multiple queries, and synthesizes findings.

| #   | Prompt                                                                                            | What It Shows                                              |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | "Analyze salary distribution across departments — which ones pay above average?"                  | Multi-step: calculates per-dept avg, overall avg, compares |
| 2   | "Show employees who changed roles in the last 2 years and their salary progression"               | Correlates JOB_HISTORY with current EMPLOYEES data         |
| 3   | "Compare headcount and average compensation across all 4 regions"                                 | Cross-geography analysis with multi-table joins            |
| 4   | "Which departments might need hiring? Look at headcount relative to the number of distinct roles" | Analytical reasoning — not just data retrieval             |

**Narrative arc:** "Select AI answers questions. Agents _analyze_ your data."

### Act 3: Select AI RAG — "Ask Questions About Your Documents"

Questions answered from uploaded HR policy documents — NOT from database tables.

| #   | Prompt                                               | What It Shows                       |
| --- | ---------------------------------------------------- | ----------------------------------- |
| 1   | "How many vacation days do new employees get?"       | Retrieves from PTO policy document  |
| 2   | "What is the 401k employer match?"                   | Retrieves from benefits guide       |
| 3   | "How do I submit a travel expense report?"           | Step-by-step answer from policy doc |
| 4   | "What happens during the first week at the company?" | Retrieves from onboarding checklist |

**Narrative arc:** "Select AI queries _data_. RAG answers questions from _documents_. Together, they cover everything employees need to know."

### The Closing Message

> "With Oracle Select AI, your Autonomous Database becomes the single interface for querying structured data, running multi-step analyses, and searching through documents — all in natural language."

## Acceptance Criteria

- [ ] HR schema tables are in the Select AI profile object list
- [ ] Table/column comments added for all HR tables
- [ ] HR account unlocked and accessible
- [ ] Frontend examples and placeholders updated to HR scenarios
- [ ] `SELECT AI How many employees do we have` returns correct count
- [ ] All three demo acts produce meaningful results end-to-end
- [ ] CLAUDE.md updated to reference HR schema
