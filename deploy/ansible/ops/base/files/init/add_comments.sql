-- Add comments to HR schema tables for better Select AI context
COMMENT ON TABLE HR.EMPLOYEES IS 'All employees in the organization with their job, salary, manager, and department';
COMMENT ON COLUMN HR.EMPLOYEES.SALARY IS 'Monthly salary in USD';
COMMENT ON COLUMN HR.EMPLOYEES.COMMISSION_PCT IS 'Commission percentage for sales roles, NULL for non-sales';
COMMENT ON COLUMN HR.EMPLOYEES.MANAGER_ID IS 'Employee ID of direct manager, NULL for CEO';

COMMENT ON TABLE HR.DEPARTMENTS IS 'Company departments with their manager and office location';
COMMENT ON COLUMN HR.DEPARTMENTS.MANAGER_ID IS 'Employee ID of the department manager';

COMMENT ON TABLE HR.JOBS IS 'Job titles and salary ranges (min_salary and max_salary define the pay band)';

COMMENT ON TABLE HR.JOB_HISTORY IS 'Historical record of job changes - each row is a previous position held by an employee';

COMMENT ON TABLE HR.LOCATIONS IS 'Office locations with address details and country';

COMMENT ON TABLE HR.COUNTRIES IS 'Country reference data with region grouping';

COMMENT ON TABLE HR.REGIONS IS 'Top-level geographic regions: Americas, Europe, Asia, Middle East and Africa';

EXIT;
