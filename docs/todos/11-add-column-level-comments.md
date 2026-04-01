# 11 — Add Column-Level Comments for HR Schema

## Priority: P0

## Problem

The existing `add_comments.sql` adds table-level comments, which helps Select AI understand what each table is about. But **column-level comments** are where the real NL2SQL accuracy gains happen.

Without column comments, Select AI has to guess:

- Is `SALARY` monthly or annual? Gross or net?
- Does `COMMISSION_PCT` mean 0.1 = 10% or 0.1 = 0.1%?
- Is `MANAGER_ID` a reference to another employee, or a separate managers table?
- What does NULL in `DEPARTMENT_ID` mean?

Column comments eliminate these ambiguities. This is the single highest-ROI change for NL2SQL accuracy.

## What Needs to Change

### 1. SQL Script — Add Column Comments

**File:** `deploy/ansible/ops/base/files/init/add_comments.sql`

Add `COMMENT ON COLUMN` for every column in the HR schema. Focus on:

- **Data types and units** — "Monthly salary in USD", "Commission as decimal (0.1 = 10%)"
- **NULL semantics** — "NULL means no manager (top of org chart)", "NULL means not on commission"
- **Foreign key meaning** — "References EMPLOYEES.EMPLOYEE_ID for the direct manager"
- **Business context** — "JOB_ID references JOBS table for title and salary band"

```sql
-- EMPLOYEES
COMMENT ON TABLE HR.EMPLOYEES IS 'All current employees with their job, salary, manager, and department assignment';
COMMENT ON COLUMN HR.EMPLOYEES.EMPLOYEE_ID IS 'Unique employee identifier';
COMMENT ON COLUMN HR.EMPLOYEES.FIRST_NAME IS 'Employee first name';
COMMENT ON COLUMN HR.EMPLOYEES.LAST_NAME IS 'Employee last name';
COMMENT ON COLUMN HR.EMPLOYEES.EMAIL IS 'Employee email address (unique, used for login)';
COMMENT ON COLUMN HR.EMPLOYEES.PHONE_NUMBER IS 'Employee phone number';
COMMENT ON COLUMN HR.EMPLOYEES.HIRE_DATE IS 'Date the employee started at the company';
COMMENT ON COLUMN HR.EMPLOYEES.JOB_ID IS 'Current job role — references JOBS table for title and salary band';
COMMENT ON COLUMN HR.EMPLOYEES.SALARY IS 'Monthly salary in USD';
COMMENT ON COLUMN HR.EMPLOYEES.COMMISSION_PCT IS 'Commission percentage as a decimal (0.1 means 10%). NULL for non-sales roles';
COMMENT ON COLUMN HR.EMPLOYEES.MANAGER_ID IS 'Employee ID of the direct manager. NULL for the CEO (top of org chart). Self-join to EMPLOYEES table';
COMMENT ON COLUMN HR.EMPLOYEES.DEPARTMENT_ID IS 'Department the employee belongs to. References DEPARTMENTS table';

-- DEPARTMENTS
COMMENT ON TABLE HR.DEPARTMENTS IS 'Company departments with their manager and office location';
COMMENT ON COLUMN HR.DEPARTMENTS.DEPARTMENT_ID IS 'Unique department identifier';
COMMENT ON COLUMN HR.DEPARTMENTS.DEPARTMENT_NAME IS 'Name of the department (e.g. IT, Sales, Marketing, Human Resources)';
COMMENT ON COLUMN HR.DEPARTMENTS.MANAGER_ID IS 'Employee ID of the department head. References EMPLOYEES table';
COMMENT ON COLUMN HR.DEPARTMENTS.LOCATION_ID IS 'Office location of the department. References LOCATIONS table';

-- JOBS
COMMENT ON TABLE HR.JOBS IS 'Job titles with minimum and maximum salary bands for each role';
COMMENT ON COLUMN HR.JOBS.JOB_ID IS 'Unique job identifier (e.g. IT_PROG, SA_REP, FI_MGR)';
COMMENT ON COLUMN HR.JOBS.JOB_TITLE IS 'Human-readable job title (e.g. Programmer, Sales Representative, Finance Manager)';
COMMENT ON COLUMN HR.JOBS.MIN_SALARY IS 'Minimum monthly salary in USD for this job role';
COMMENT ON COLUMN HR.JOBS.MAX_SALARY IS 'Maximum monthly salary in USD for this job role';

-- JOB_HISTORY
COMMENT ON TABLE HR.JOB_HISTORY IS 'Historical record of employee job changes. Each row is a previous position — the current position is in EMPLOYEES, not here';
COMMENT ON COLUMN HR.JOB_HISTORY.EMPLOYEE_ID IS 'Employee who held this previous position. References EMPLOYEES table';
COMMENT ON COLUMN HR.JOB_HISTORY.START_DATE IS 'Date the employee started this previous position';
COMMENT ON COLUMN HR.JOB_HISTORY.END_DATE IS 'Date the employee left this position (moved to a new role or department)';
COMMENT ON COLUMN HR.JOB_HISTORY.JOB_ID IS 'The job role held during this period. References JOBS table';
COMMENT ON COLUMN HR.JOB_HISTORY.DEPARTMENT_ID IS 'The department during this period. References DEPARTMENTS table';

-- LOCATIONS
COMMENT ON TABLE HR.LOCATIONS IS 'Office locations with street address, city, and country';
COMMENT ON COLUMN HR.LOCATIONS.LOCATION_ID IS 'Unique location identifier';
COMMENT ON COLUMN HR.LOCATIONS.STREET_ADDRESS IS 'Street address of the office';
COMMENT ON COLUMN HR.LOCATIONS.POSTAL_CODE IS 'Postal or ZIP code';
COMMENT ON COLUMN HR.LOCATIONS.CITY IS 'City where the office is located';
COMMENT ON COLUMN HR.LOCATIONS.STATE_PROVINCE IS 'State or province (may be NULL for some countries)';
COMMENT ON COLUMN HR.LOCATIONS.COUNTRY_ID IS 'Country of the office. References COUNTRIES table';

-- COUNTRIES
COMMENT ON TABLE HR.COUNTRIES IS 'Countries with their world region grouping';
COMMENT ON COLUMN HR.COUNTRIES.COUNTRY_ID IS 'Two-letter country code (e.g. US, UK, DE)';
COMMENT ON COLUMN HR.COUNTRIES.COUNTRY_NAME IS 'Full country name';
COMMENT ON COLUMN HR.COUNTRIES.REGION_ID IS 'World region this country belongs to. References REGIONS table';

-- REGIONS
COMMENT ON TABLE HR.REGIONS IS 'Four world regions: Americas, Europe, Asia, Middle East and Africa';
COMMENT ON COLUMN HR.REGIONS.REGION_ID IS 'Unique region identifier';
COMMENT ON COLUMN HR.REGIONS.REGION_NAME IS 'Region name: Americas, Europe, Asia, or Middle East and Africa';
```

### 2. Key Principles for Good Comments

- **Be specific about units** — "Monthly salary in USD" not just "Salary"
- **Explain NULLs** — Every nullable column should say what NULL means
- **Describe relationships** — "References EMPLOYEES table" helps the LLM pick the right JOIN
- **Use business language** — "CEO" and "department head" help match natural language questions
- **Clarify ambiguity** — "0.1 means 10%" prevents math errors in generated SQL

## Acceptance Criteria

- [ ] Every column in all 7 HR tables has a `COMMENT ON COLUMN` statement
- [ ] Comments include units, NULL semantics, and FK descriptions
- [ ] `SELECT AI showsql Who are the highest paid employees?` generates correct SQL using SALARY column
- [ ] `SELECT AI showsql Which managers have the most reports?` correctly uses the MANAGER_ID self-join
- [ ] Ansible task runs the updated comments script without errors

## References

- [Improve NL2SQL Accuracy with Metadata](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/improve-natural-language-sql-generation-ai.html)
