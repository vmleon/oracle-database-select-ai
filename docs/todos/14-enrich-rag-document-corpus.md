# 14 — Enrich RAG Document Corpus

## Priority: P1

## Problem

TODO-03 plans for 6 HR policy documents, but they're described as "a few paragraphs each." That's too thin to be convincing to anyone who's evaluated RAG systems. Short documents don't exercise chunking, don't test retrieval precision, and don't demonstrate real-world complexity.

## What Needs to Change

### 1. Make Documents Substantial

**Directory:** `deploy/ansible/ops/base/files/rag-docs/`

Each document should be **2-3 pages** with realistic structure:

| Document                       | Target Length | Should Include                                                                                                    |
| ------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `employee-handbook.txt`        | 2-3 pages     | Sections: company values, code of conduct, dress code, workplace behavior, disciplinary process, confidentiality  |
| `pto-policy.txt`               | 2 pages       | Tables: PTO by tenure tier (0-2 yrs, 2-5 yrs, 5+ yrs), sick leave, holidays list, carryover rules, blackout dates |
| `benefits-guide.txt`           | 3 pages       | Plans: health (PPO vs HMO), dental, vision, 401k match tiers, HSA, wellness program, enrollment periods           |
| `travel-expense-policy.txt`    | 2 pages       | Per diem rates by city tier, booking rules, expense categories, receipt requirements, reimbursement timeline      |
| `onboarding-checklist.txt`     | 1-2 pages     | Day-by-day first week schedule, required training list, IT setup steps, buddy program, 30/60/90 day milestones    |
| `performance-review-guide.txt` | 2 pages       | Review cycle (annual + mid-year), rating scale (1-5), self-assessment template, promotion criteria, PIP process   |

### 2. Add Structure Within Documents

Documents should include:

- **Headers and sections** — tests whether the chunker preserves context across sections
- **Tables or lists** — per diem rates, PTO tiers, benefit plan comparisons
- **Cross-references** — "See the Benefits Guide for health insurance details" (tests retrieval of the right document)
- **Specific numbers** — "15 days PTO", "4% 401k match", "$75/day per diem" (enables precise answer verification)
- **Edge cases** — "PTO carryover is limited to 5 days", "Meals over $50 require manager approval" (tests whether RAG retrieves specific clauses)

### 3. Consider Adding a PDF

Add one document as `.pdf` to demonstrate format flexibility:

- `benefits-guide.pdf` is a good candidate (benefits docs are often PDFs in real companies)
- Verify that `DBMS_CLOUD_AI.CREATE_VECTOR_INDEX` handles PDF format

### 4. Verification Queries

After enriching documents, verify retrieval precision with specific questions:

| Question                                                  | Expected Answer                 | Source                       |
| --------------------------------------------------------- | ------------------------------- | ---------------------------- |
| "How many PTO days do employees with 3 years tenure get?" | Specific number from tier table | pto-policy.txt               |
| "What is the 401k match for contributions above 6%?"      | Specific match percentage       | benefits-guide.txt           |
| "What is the per diem rate for New York?"                 | Specific dollar amount          | travel-expense-policy.txt    |
| "What happens on day 3 of onboarding?"                    | Specific activities             | onboarding-checklist.txt     |
| "What rating do I need for a promotion?"                  | Specific rating from scale      | performance-review-guide.txt |

These questions test whether RAG retrieves the right chunk with the right specificity — not just "something about PTO" but the exact number.

## Acceptance Criteria

- [ ] Each document is at least 1.5 pages of realistic content
- [ ] Documents include structured data (tables, lists, specific numbers)
- [ ] At least one document is in PDF format
- [ ] Verification queries return precise answers (not vague summaries)
- [ ] Chunk size (1500) and overlap (300) from TODO-03 produce good retrieval quality

## References

- [Select AI with RAG](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-retrieval-augmented-generation.html)
