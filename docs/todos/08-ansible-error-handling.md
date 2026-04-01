# 08 — Ansible Error Handling for SQL Script Execution

## Problem

The Ansible ops playbook executes SQL scripts via `sql -name admin -s @/home/opc/init/...` but does not check whether execution succeeded. If a profile creation fails (invalid attributes, missing privileges, network issues), the playbook silently continues, leaving the system in a broken state that's hard to diagnose.

## What Needs to Change

### `deploy/ansible/ops/base/tasks/main.yaml`

For each SQL execution task, add `register` and `failed_when`:

```yaml
- name: Create Select AI profiles
  ansible.builtin.command: "sql -name admin -s @/home/opc/init/create_profile_{{ item }}.sql"
  become_user: opc
  register: sql_result
  failed_when: "'ORA-' in sql_result.stdout or sql_result.rc != 0"
  loop:
    - select_ai
    - agents
    - rag

- name: Show SQL output
  ansible.builtin.debug:
    msg: "{{ sql_result.results | map(attribute='stdout_lines') | list }}"
```

Apply the same pattern to:

- `grant_permissions.sql` execution
- `enable_resource_principal.sql` execution
- `create_vector_index.sql` execution (once [TODO-03](03-fix-select-ai-rag.md) adds it)
- `create_agent.sql` execution (once [TODO-02](02-fix-select-ai-agents.md) adds it)
- `add_comments.sql` execution
- `network_acl.sql` execution

## Acceptance Criteria

- [ ] Playbook fails fast on any ORA- error in SQL output
- [ ] SQL output is visible in Ansible logs for debugging
- [ ] Successful runs show clean output without false positives
