# Oracle Database 26ai Select AI Overview

## Select AI

Select AI allows users to query Oracle Database using natural language. Under the hood, it translates natural language prompts into SQL queries using a configured LLM provider (OCI Generative AI).

Key actions:

- `showsql` — Returns the generated SQL without executing it
- `narrate` — Returns a natural language explanation of the query results
- `runsql` — Executes the generated SQL and returns results

Uses `DBMS_CLOUD_AI` package with profiles that define the LLM provider, credentials, and accessible database objects.

## Select AI Agents

Oracle Database 26ai introduces agentic AI capabilities through Select AI. Agents can autonomously reason about tasks, break them into steps, and execute database operations to fulfill complex requests.

This goes beyond simple NL2SQL by allowing the AI to plan and execute multi-step workflows within the database context.

## Select AI RAG

Retrieval Augmented Generation (RAG) with Select AI combines structured database queries with unstructured document retrieval. Using Oracle AI Vector Search, relevant documents are retrieved and included as context for the LLM, producing more informed and accurate responses.

This is especially useful when answers require both tabular data and knowledge from documents, manuals, or other text sources stored in the database.

## Authentication

This demo uses **Resource Principal** authentication, where the Autonomous Database itself is authorized to call OCI Generative AI services via IAM dynamic groups and policies. No API keys need to be stored in the database.
