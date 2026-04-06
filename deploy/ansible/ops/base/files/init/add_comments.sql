-- Add comments to HR schema tables and columns for better Select AI context
WHENEVER SQLERROR EXIT SQL.SQLCODE

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

EXIT;
