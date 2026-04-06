# Oracle Database 26ai Select AI Demo

A full-stack demo that puts Oracle Database 26ai's Select AI features in front of a web UI. Users type natural-language questions; the Autonomous Database translates them into SQL, orchestrates agentic workflows, or retrieves answers from documents — all powered by OCI Generative AI.

The backend is a thin Spring Boot layer that forwards prompts to the database via JDBC. The database does the heavy lifting: it generates SQL, calls the LLM, manages agent reasoning, and performs vector search over indexed documents. Infrastructure is provisioned with Terraform on OCI and configured with Ansible.

### Features

- **Select AI (NL2SQL)** — Natural language to SQL. Ask questions in plain English, get SQL queries and results from the HR sample schema.
- **Select AI Agents** — Agentic AI. The database autonomously reasons and executes multi-step analytical tasks.
- **Select AI RAG** — Retrieval Augmented Generation. Combines database knowledge with document retrieval for richer answers.

## Architecture

```mermaid
graph LR
    User([User])
    FE[Angular Frontend]
    LB[OCI Load Balancer]
    BE[Spring Boot Backend]
    ADB[(Autonomous Database 26ai)]
    GenAI[OCI Generative AI]
    ObjStore[Object Storage]

    User --> FE
    FE --> LB
    LB --> BE
    BE -- JDBC --> ADB
    ADB -- LLM calls --> GenAI
    ADB -- RAG documents --> ObjStore
```

## Data Flow by Feature

```mermaid
sequenceDiagram
    participant U as User
    participant BE as Backend
    participant ADB as ADB 26ai
    participant AI as OCI GenAI
    participant OS as Object Storage

    rect rgb(230, 240, 255)
    Note over U,AI: Select AI (NL2SQL)
    U->>BE: natural-language question
    BE->>ADB: SELECT AI showsql / narrate
    ADB->>AI: translate prompt to SQL
    AI-->>ADB: generated SQL
    ADB-->>BE: SQL + narration + result rows
    BE-->>U: structured response
    end

    rect rgb(230, 255, 230)
    Note over U,AI: Select AI Agents
    U->>BE: analytical question
    BE->>ADB: DBMS_CLOUD_AI_AGENT.RUN_TEAM
    ADB->>AI: multi-step reasoning
    AI-->>ADB: agent actions + final answer
    ADB-->>BE: response
    BE-->>U: agent response
    end

    rect rgb(255, 240, 230)
    Note over U,OS: Select AI RAG
    U->>BE: document question
    BE->>ADB: SELECT AI narrate (RAG profile)
    ADB->>OS: vector search over indexed docs
    OS-->>ADB: relevant chunks
    ADB->>AI: augmented prompt + context
    AI-->>ADB: grounded answer
    ADB-->>BE: response
    BE-->>U: RAG answer
    end
```

## Prerequisites

- Python 3.11+
- OCI CLI configured (`~/.oci/config`)
- Terraform 1.5+
- Ansible 2.15+
- Java 23 (GraalVM or OpenJDK)
- Node.js 22+ / npm 11+

## Quick Start

1. Install Python dependencies

```bash
pip install -r requirements.txt
```

2. Interactive OCI setup (creates .env)

```bash
python manage.py setup
```

3. Generate Terraform variables

```bash
python manage.py tf
```

4. Deploy infrastructure

```bash
cd deploy/tf/app
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

5. After deployment, get Ansible commands

```bash
cd ../../..
python manage.py ansible
```

## Project Structure

```
├── manage.py              # CLI for setup, deployment, and management
├── requirements.txt       # Python dependencies
├── docs/                  # Documentation
│   ├── todos/             # TODO tracking
│   ├── articles/          # Technical articles
│   └── issues/            # Known issues
├── src/
│   ├── backend/           # Spring Boot 3.5 + Java 23
│   └── frontend/          # Angular v21
└── deploy/
    ├── tf/                # Terraform (OCI infrastructure)
    └── ansible/           # Ansible (configuration management)
```

## Local Development

Backend:

```bash
cd src/backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

Frontend (proxies /api to localhost:8080):

```bash
cd src/frontend
npm install
npm start
```

Open http://localhost:4200 in your browser.
