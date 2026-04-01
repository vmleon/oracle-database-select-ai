# 06 — Fix Ansible Ops Grants for Autonomous Database

## Problem

On Autonomous Database, the ADMIN user already has EXECUTE privileges on `DBMS_CLOUD`, `DBMS_CLOUD_AI`, and `DBMS_CLOUD_AI_AGENT`. The current `grant_permissions.sql` may error or be a no-op since you can't grant privileges to yourself.

## Context

The demo currently runs everything as ADMIN. If we switch to the HR schema ([TODO-09](09-switch-to-hr-schema.md)), we might run Select AI queries as the HR user instead, which **would** need grants.

## Decision: Which user runs the queries?

### Option A: Run as ADMIN (simpler)

- ADMIN already has all privileges — remove `grant_permissions.sql` entirely
- Select AI profiles and agents created by ADMIN, queried by ADMIN
- Simplest path for a POC

### Option B: Run as HR user (more realistic)

- Grant EXECUTE on `DBMS_CLOUD_AI` and `DBMS_CLOUD_AI_AGENT` to HR
- Grant SELECT on HR tables to ADMIN (for profile object list), or create profile as HR user
- More realistic for a demo showing separation of concerns

**Recommendation:** Option A for now. Keep it simple.

## What Needs to Change

### If Option A (ADMIN):

**File:** `deploy/ansible/ops/base/files/init/grant_permissions.sql`

- Either delete the file, or wrap grants in error handling:

```sql
BEGIN
  EXECUTE IMMEDIATE 'GRANT EXECUTE ON DBMS_CLOUD_AI TO ADMIN';
EXCEPTION
  WHEN OTHERS THEN NULL; -- Already has privilege
END;
/
```

**File:** `deploy/ansible/ops/base/tasks/main.yaml`

- Add `ignore_errors: yes` on the grant task, or remove it entirely

## Acceptance Criteria

- [ ] Ansible ops playbook runs to completion without grant-related errors
- [ ] Select AI queries work with the chosen user
