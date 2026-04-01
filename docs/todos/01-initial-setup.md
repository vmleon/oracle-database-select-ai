# 01 — Initial Setup

## Status: Done

- [x] Project scaffolding and directory structure
- [x] `manage.py` CLI with setup, tf, ansible, clean commands
- [x] Spring Boot backend skeleton (Java 23, Spring Boot 3.5, Gradle)
- [x] Angular frontend skeleton (Angular 21, standalone components, signals)
- [x] Terraform modules (adbs, backend, web, ops)
- [x] Ansible roles (ops, backend, web)
- [x] Select AI SQL profile creation scripts (Jinja2 templates)
- [x] Frontend: query, agents, and RAG components with basic UI

## Pending Validation

These items require a live OCI tenancy + Autonomous Database 26ai instance:

- [ ] Run `python manage.py setup` against real OCI tenancy — verify `.env` generation
- [ ] Run `python manage.py tf` — verify `terraform.tfvars` renders correctly
- [ ] `terraform apply` — provision ADB + compute instances + Object Storage
- [ ] Ansible ops playbook — SQL scripts execute without ORA- errors
- [ ] Ansible backend playbook — JAR deployed and Spring Boot starts
- [ ] Ansible web playbook — Angular build served via Nginx
- [ ] End-to-end: frontend → backend → ADB → Select AI response

## Depends On

Before full validation, complete these fixes first:

- [TODO-09](09-switch-to-hr-schema.md) — Switch from SH to HR schema (changes SQL scripts, profile object lists, frontend examples)
- [TODO-02](02-fix-select-ai-agents.md) — Fix agents to use `DBMS_CLOUD_AI_AGENT`
- [TODO-03](03-fix-select-ai-rag.md) — Fix RAG to use vector indexes
- [TODO-07](07-fix-terraform-par-timestamp-drift.md) — Fix PAR timestamp drift before first deploy
