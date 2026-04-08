# 19 — Role-Based Access Control for Select AI

## Priority: P1

## Problem

Right now, anyone using the demo can ask anything. "Who are the top 3 highest-paid employees?" returns salary data regardless of who's asking. In a real scenario, an employee with no HR privileges should never see that. This is the single biggest objection enterprise security teams will raise — and it's also Oracle's strongest differentiator: Select AI runs as the calling database user, so standard Oracle security applies automatically.

## Why This Matters for the Demo

A live side-by-side where the same natural language question returns different results depending on who's logged in is the most powerful slide-killer in the deck. It proves that Select AI isn't a security hole — it's a security feature. The database enforces access control on AI-generated SQL the same way it does on hand-written SQL.

## Research Summary

### Core Fact: Select AI Executes as the Session User

When `DBMS_CLOUD_AI.GENERATE()` produces SQL, that SQL runs with the **connected user's privileges**. This is not a special AI feature — it's how Oracle works. If the user has no `SELECT` on `HR.EMPLOYEES`, Select AI gets `ORA-00942` just like any other query would.

This means three Oracle security mechanisms work transparently with Select AI:

### 1. Standard Grants (Table-Level Access)

Different database users with different `SELECT` grants on different tables. An `EMPLOYEE` user with access only to `DEPARTMENTS` and `LOCATIONS` simply cannot query salary data through Select AI — the generated SQL will fail at execution.

### 2. VPD / Virtual Private Database (Row-Level Access)

`DBMS_RLS.ADD_POLICY` attaches a dynamic `WHERE` clause to every query against a table. Since Select AI generates standard SQL, VPD predicates are injected automatically before results return.

Example: A manager in department 60 asks "Show me all employees" — VPD appends `WHERE department_id = 60` and they only see their team. The LLM never even knows the filter exists.

Oracle has published a working example of VPD + Select AI: [AI and Data Security with Select AI](https://medium.com/oracledevs/ai-and-data-security-protecting-sensitive-information-with-oracle-autonomous-database-select-ai-e7ae27b4fa36).

### 3. AI Profiles with `object_list` (Schema-Level Access)

Each Select AI profile defines which tables the LLM can see via `object_list`. Profiles are schema-owned — User A's profile can expose 3 tables while User B's profile exposes 7. Combined with `"enforce_object_list": true`, the LLM cannot generate SQL referencing tables outside the list.

### What About RAG and Agents?

- **RAG:** VPD can be applied to the base document tables AND the vector index secondary tables (`$I`, `$VR`, `$D`, `$VECTORS` view). Different users searching documents via RAG only find documents they're authorized to see.
- **Agents:** `DBMS_CLOUD_AI_AGENT.RUN_TEAM()` uses Select AI profiles and SQL tools under the hood. The generated SQL executes in the calling user's session, so grants and VPD apply.
- **Hybrid:** Same as RAG — the profile's `vector_index_name` and `object_list` are both scoped to the calling user.

### Other Mechanisms (Not Needed for This Demo)

- **Database Vault:** Prevents even DBAs from accessing data in protected realms. Overkill for a POC.
- **Oracle Label Security (OLS):** Row-level labels with clearance levels. Works in theory but no explicit Select AI documentation yet.
- **Deep Data Security (26ai new):** Declarative SQL policies with OAuth2 identity propagation. Designed for agentic AI but may be limited availability. Worth mentioning as a talking point.
- **SQL Firewall:** Blocks AI-generated SQL that doesn't match allowlisted patterns. Defense against prompt injection.

## Implementation Plan

### Demo Roles

| Role           | Database User | Table Access                                     | Row Access (VPD)                  | RAG Access                   |
| -------------- | ------------- | ------------------------------------------------ | --------------------------------- | ---------------------------- |
| **Admin**      | `HR_ADMIN`    | All 7 HR tables                                  | All rows                          | All 6 policy docs            |
| **HR Manager** | `HR_MANAGER`  | EMPLOYEES, DEPARTMENTS, JOBS, JOB_HISTORY        | All rows                          | All 6 policy docs            |
| **Manager**    | `HR_MGR`      | EMPLOYEES, DEPARTMENTS, JOBS                     | Only their department's employees | Handbook, Performance Review |
| **Employee**   | `HR_EMP`      | DEPARTMENTS, JOBS, LOCATIONS, COUNTRIES, REGIONS | Only their own row in EMPLOYEES   | Handbook, PTO, Benefits      |

### Phase 1: Database Setup (Ansible)

Create the four database users and grant privileges:

```sql
-- Admin: full access
CREATE USER hr_admin IDENTIFIED BY ...;
GRANT SELECT ON hr.employees TO hr_admin;
GRANT SELECT ON hr.departments TO hr_admin;
GRANT SELECT ON hr.jobs TO hr_admin;
GRANT SELECT ON hr.job_history TO hr_admin;
GRANT SELECT ON hr.locations TO hr_admin;
GRANT SELECT ON hr.countries TO hr_admin;
GRANT SELECT ON hr.regions TO hr_admin;
GRANT EXECUTE ON dbms_cloud_ai TO hr_admin;
GRANT EXECUTE ON dbms_cloud TO hr_admin;
GRANT EXECUTE ON dbms_cloud_ai_agent TO hr_admin;

-- Employee: limited tables, VPD on employees
CREATE USER hr_emp IDENTIFIED BY ...;
GRANT SELECT ON hr.departments TO hr_emp;
GRANT SELECT ON hr.jobs TO hr_emp;
GRANT SELECT ON hr.locations TO hr_emp;
GRANT SELECT ON hr.countries TO hr_emp;
GRANT SELECT ON hr.regions TO hr_emp;
GRANT SELECT ON hr.employees TO hr_emp;  -- VPD restricts to own row
GRANT EXECUTE ON dbms_cloud_ai TO hr_emp;
GRANT EXECUTE ON dbms_cloud TO hr_emp;
-- No DBMS_CLOUD_AI_AGENT grant: employees can't use agents
```

Add VPD policy for row-level filtering:

```sql
CREATE OR REPLACE FUNCTION hr_row_security(
  p_schema VARCHAR2, p_table VARCHAR2
) RETURN VARCHAR2 AS
  v_user VARCHAR2(128) := SYS_CONTEXT('USERENV', 'SESSION_USER');
BEGIN
  CASE v_user
    WHEN 'HR_ADMIN'   THEN RETURN NULL;           -- No filter: see all
    WHEN 'HR_MANAGER' THEN RETURN NULL;           -- See all (HR team)
    WHEN 'HR_MGR'     THEN RETURN 'department_id = SYS_CONTEXT(''APP_CTX'', ''DEPT_ID'')';
    WHEN 'HR_EMP'     THEN RETURN 'employee_id = SYS_CONTEXT(''APP_CTX'', ''EMP_ID'')';
    ELSE RETURN '1=0';                             -- Deny by default
  END CASE;
END;
/

BEGIN
  DBMS_RLS.ADD_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'emp_row_security',
    policy_function => 'hr_row_security',
    statement_types => 'SELECT'
  );
END;
/
```

Create per-user Select AI profiles with different `object_list`:

```sql
-- Employee profile: limited tables, enforced
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'EMP_SELECT_AI',
    attributes   => '{
      "provider": "oci",
      "credential_name": "OCI_API_KEY_CRED",
      "object_list": [
        {"owner": "HR", "name": "DEPARTMENTS"},
        {"owner": "HR", "name": "JOBS"},
        {"owner": "HR", "name": "LOCATIONS"},
        {"owner": "HR", "name": "COUNTRIES"},
        {"owner": "HR", "name": "REGIONS"},
        {"owner": "HR", "name": "EMPLOYEES"}
      ],
      "enforce_object_list": true
    }'
  );
END;
/
```

### Phase 2: Backend — Multi-User Connection Switching

**File:** `src/backend/.../controller/SelectAIController.java`

The backend currently connects as a single database user. To support role switching:

**Option A — Proxy Users (cleanest):** Spring Boot connects as a pool user, then proxies as the end user. Oracle UCP supports this natively:

```java
// Get connection from pool, proxy as the role user
OracleConnection conn = (OracleConnection) dataSource.getConnection();
Properties props = new Properties();
props.put(OracleConnection.PROXY_USER_NAME, "HR_EMP");
conn.openProxySession(OracleConnection.PROXYTYPE_USER_NAME, props);
```

Requires: `ALTER USER hr_emp GRANT CONNECT THROUGH pool_user;`

**Option B — Multiple DataSources (simpler for POC):** Configure 4 datasources in `application.yaml`, one per role. Pick the right one based on the role header.

```yaml
spring:
  datasource:
    admin:
      url: jdbc:oracle:thin:@...
      username: hr_admin
    employee:
      url: jdbc:oracle:thin:@...
      username: hr_emp
```

**Option B is simpler for a POC.** No proxy setup, no UCP configuration. Just 4 connection pools.

Add a role header to all API calls:

```java
@PostMapping("/query")
public QueryResponse query(
    @RequestBody QueryRequest request,
    @RequestHeader("X-Demo-Role") String role) {
  JdbcTemplate jdbc = getJdbcForRole(role);  // returns role-specific JdbcTemplate
  // ... existing logic using this jdbc instead of the shared one
}
```

### Phase 3: Frontend — Login Screen and Role Indicator

**Login screen:** Simple role picker on app load. No passwords — just select who you are:

- Four cards/buttons: Admin, HR Manager, Manager, Employee
- Each with a short description of what they can see
- Selection stores role in a signal, sends it as `X-Demo-Role` header on every API call

**Role indicator:** Show current role in the header bar with a "Switch Role" button.

**Access restrictions in the UI:**

| Tab            | Admin | HR Manager | Manager      | Employee     |
| -------------- | ----- | ---------- | ------------ | ------------ |
| NL2SQL (Query) | Yes   | Yes        | Yes          | Yes          |
| Chat           | Yes   | Yes        | Yes          | Yes          |
| RAG            | Yes   | Yes        | Limited docs | Limited docs |
| Hybrid         | Yes   | Yes        | Limited      | Limited      |
| Agents         | Yes   | Yes        | No           | No           |

Disable tabs the role can't use (grey out with tooltip explaining why).

### Phase 4: Demo Script — The Money Slide

The compelling demo sequence:

1. Log in as **Employee**
2. Ask: "Who are the top 3 highest-paid employees?"
3. Result: Only sees their own record (VPD restricts to own row)
4. Switch to **Manager**
5. Same question
6. Result: Sees only their department's employees
7. Switch to **Admin**
8. Same question
9. Result: Full answer across all departments

Same question, three different answers. The database did the security enforcement — not the application, not the LLM.

## Acceptance Criteria

- [ ] Four database users created with appropriate grants
- [ ] VPD policy on EMPLOYEES filters rows by role
- [ ] Per-user Select AI profiles with scoped `object_list`
- [ ] Backend switches database connection based on role header
- [ ] Frontend has a role selection screen (no passwords)
- [ ] Current role visible in header with switch option
- [ ] Agents tab disabled for Employee and Manager roles
- [ ] Same NL question returns different results for different roles (verified)
- [ ] RAG returns different documents based on role

## References

- [DBMS_CLOUD_AI.CREATE_PROFILE](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/dbms-cloud-ai-package.html)
- [VPD + Select AI Example](https://medium.com/oracledevs/ai-and-data-security-protecting-sensitive-information-with-oracle-autonomous-database-select-ai-e7ae27b4fa36)
- [DBMS_RLS Package](https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_RLS.html)
- [Oracle Deep Data Security](https://blogs.oracle.com/database/introducing-oracle-deep-data-security-identity-aware-data-access-control-for-agentic-ai-in-oracle-ai-database-26ai)
- [Hybrid Vector Index VPD Guidelines](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/guidelines-and-restrictions-hybrid-vector-indexes.html)
