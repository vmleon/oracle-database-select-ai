# Oracle Database 26ai Select AI Demo

## Overview

POC demo for Oracle Database 26ai Select AI features: Select AI (NL2SQL), Select AI Agents, Select AI RAG.
Autonomous Database on OCI, automated with Terraform + Ansible.

## Key Paths

- `manage.py` — Python CLI entry point (setup, tf, ansible, clean)
- `src/backend/` — Spring Boot 3.5 + Java 23 + Gradle
- `src/frontend/` — Angular v21
- `deploy/tf/` — Terraform (modules: adbs, backend, web, ops)
- `deploy/ansible/` — Ansible roles (ops, backend, web)
- `docs/` — Documentation (todos/, articles/, issues/)

## Build & Run

### Backend

```bash
cd src/backend
./gradlew build
./gradlew bootRun --args='--spring.profiles.active=local'
```

### Frontend

```bash
cd src/frontend
npm install
npm start          # dev server at localhost:4200
```

### Infrastructure

```bash
pip install -r requirements.txt
python manage.py setup     # interactive OCI config → .env
python manage.py tf        # render terraform.tfvars
python manage.py ansible   # print ansible commands
python manage.py clean     # print destroy commands
```

## Tech Stack

- Java 23, Spring Boot 3.5.3, Gradle, Oracle UCP + JDBC (no ORM)
- Angular 21, standalone components, signals
- Terraform (OCI provider ~6.35), Ansible
- Oracle Autonomous Database Shared (26ai)
- Package: dev.victormartin.selectai.demo
- OCI resource prefix: selectai
- Dataset: HR sample schema
