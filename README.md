# Oracle Database 26ai Select AI Demo

Demo project showcasing three Oracle Database 26ai Select AI capabilities on Autonomous Database (OCI):

- **Select AI** — Natural language to SQL. Ask questions in plain English, get SQL queries and results from the SH sample schema.
- **Select AI Agents** — Agentic AI capabilities. Let the database autonomously reason and execute multi-step operations.
- **Select AI RAG** — Retrieval Augmented Generation. Combine database knowledge with document retrieval for richer answers.

## Prerequisites

- Python 3.11+
- OCI CLI configured (`~/.oci/config`)
- Terraform 1.5+
- Ansible 2.15+
- Java 23 (GraalVM or OpenJDK)
- Node.js 22+ / npm 11+

## Quick Start

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Interactive OCI setup (creates .env)
python manage.py setup

# 3. Generate Terraform variables
python manage.py tf

# 4. Deploy infrastructure
cd deploy/tf/app
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 5. After deployment, get Ansible commands
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

```bash
# Backend
cd src/backend
./gradlew bootRun --args='--spring.profiles.active=local'

# Frontend (proxies /api to localhost:8080)
cd src/frontend
npm install
npm start
```

Open http://localhost:4200 in your browser.
