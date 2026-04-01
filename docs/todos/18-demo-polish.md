# 18 — Demo Polish (P3 Items)

## Priority: P3

A collection of lower-priority improvements that add polish to the demo. Each is independent — implement any subset.

---

## A. SQL Complexity Indicator

**Problem:** The value of Select AI is visceral when you see a 15-line SQL query with 3 joins next to the 12-word natural language question that generated it. The current demo shows them sequentially, missing the visual impact.

**Change:** After `showsql` returns, compute and display:

- SQL line count
- Number of JOINs
- Number of subqueries or CTEs
- A one-liner: _"Your 12-word question generated a 23-line query with 4 table joins."_

**File:** `src/frontend/src/app/query/query.component.ts`

Simple string parsing — count `JOIN`, `SELECT` (for subqueries), and newlines. No backend change needed.

---

## B. Mention ORDS as Zero-Code Alternative

**Problem:** The demo uses Spring Boot as the API layer, which is great for showing custom integration. But Oracle REST Data Services (ORDS) natively exposes Select AI via REST endpoints with zero application code. Enterprise customers should know this option exists.

**Change:** Add a note in the project README (when one exists) or as a comment in the backend:

> **Note:** For zero-code deployments, Oracle REST Data Services (ORDS) can expose Select AI directly as REST endpoints without a custom backend. This demo uses Spring Boot to demonstrate the JDBC integration pattern.

No code change — just documentation.

---

## C. Security / Data Governance Story

**Problem:** Select AI respects Oracle's row-level security (VPD), privilege grants, and audit policies. A demo where two different database users ask the same question but get different results is powerful for enterprise security teams. This is a differentiator vs. connecting an external LLM directly to your database.

**Change (if pursuing):**

1. Create a second database user (e.g., `HR_VIEWER`) with SELECT on only EMPLOYEES and DEPARTMENTS
2. Create a second profile for that user
3. Show that asking "What regions do we operate in?" fails for HR_VIEWER (no access to LOCATIONS/COUNTRIES/REGIONS) but works for ADMIN

This is more complex to set up. Consider it a stretch goal or a talking point without live demo.

---

## D. Error Handling UX

**Problem:** When Select AI can't generate valid SQL (ambiguous question, unsupported query type), the demo currently shows a raw error or stack trace. This undermines confidence in the product.

**Change:** Catch common error cases in the backend and return user-friendly messages:

**File:** `src/backend/.../controller/SelectAIController.java`

```java
@ExceptionHandler(DataAccessException.class)
public ResponseEntity<ErrorResponse> handleSqlError(DataAccessException e) {
    String message = e.getMessage();
    if (message.contains("ORA-20001") || message.contains("unable to generate")) {
        return ResponseEntity.badRequest().body(
            new ErrorResponse("I couldn't generate a SQL query for that question. Try rephrasing or being more specific.")
        );
    }
    // ... other known error patterns
    return ResponseEntity.internalServerError().body(
        new ErrorResponse("Something went wrong. Please try again.")
    );
}
```

**Frontend:** Display error messages inline (not as alerts or console errors). Suggest alternative phrasings.

---

## Acceptance Criteria

- [ ] **A:** Complexity indicator shows line count and JOIN count for generated SQL
- [ ] **B:** ORDS mentioned as alternative in documentation
- [ ] **C:** Security story documented as talking point (or demoed if time allows)
- [ ] **D:** Ambiguous or unsupported queries show a friendly error message instead of stack traces
