# User Flow Examples & Acceptance Testing Scenarios

**Companion document to:** PRD — Dynamic UI Workflow Engine
**Last updated:** February 28, 2026

---

## How to Use This Document

Each flow below describes a realistic usage scenario from the perspective of an API consumer (a frontend client or developer testing the engine). Every flow includes the exact API calls, expected responses, and pass/fail acceptance criteria. These can be used directly as manual test scripts or adapted into automated integration tests.

**Key principle:** This engine is domain-agnostic. The workflow schema defines the domain — the engine itself knows nothing about ecommerce, project management, or bookkeeping. These flows are designed to prove that the same engine logic works identically across any schema.

---

## Reference Schemas Used in Testing

These three schemas are used throughout the flows. Any schema conforming to the workflow protocol should produce equivalent results.

| Schema ID | Domain | Purpose in Testing |
|---|---|---|
| `ecommerce-v1` | Retail / Shopping | Tests product-oriented data and browsing patterns |
| `project-mgmt-v1` | Task / Productivity | Tests structured task data and status-driven views |
| `bookkeeping-v1` | Finance / Accounting | Tests numerical data, tabular layouts, and summaries |

---

## Flow 1: First-Time User — Multi-Turn Conversation (Any Domain)

**What this proves:** The engine can take any workflow schema, create a session, generate contextual UI, and accumulate context across turns.

**Preconditions:** Engine is running. At least one workflow schema is loaded. No existing sessions.

### Step 1.1 — Discover Available Workflows

The client fetches available workflows to determine which schema to use.

```
GET /api/engine/workflows
```

**Expected Response:**
```json
{
  "workflows": [
    {
      "workflow_id": "ecommerce-v1",
      "name": "E-Commerce Experience",
      "version": "1.0.0"
    },
    {
      "workflow_id": "project-mgmt-v1",
      "name": "Project Management",
      "version": "1.0.0"
    },
    {
      "workflow_id": "bookkeeping-v1",
      "name": "Bookkeeping",
      "version": "1.0.0"
    }
  ]
}
```

**Acceptance Criteria:**
- [ ] Returns 200 status
- [ ] Response contains all loaded workflow objects
- [ ] Each workflow has `workflow_id`, `name`, and `version`

---

### Step 1.2 — Initial Query (Session Creation)

The user's first interaction. The client selects a workflow, generates a new `session_id`, and sends an opening query.

**This step must be tested with EACH schema to prove domain agnosticism.**

**Ecommerce variant:**
```json
POST /api/engine/generate
{
  "workflow_id": "ecommerce-v1",
  "session_id": "sess_ecom_001",
  "query": "I'm looking for jackets"
}
```

**Project Management variant:**
```json
POST /api/engine/generate
{
  "workflow_id": "project-mgmt-v1",
  "session_id": "sess_pm_001",
  "query": "Show me all open tasks"
}
```

**Bookkeeping variant:**
```json
POST /api/engine/generate
{
  "workflow_id": "bookkeeping-v1",
  "session_id": "sess_bk_001",
  "query": "Show me this month's expenses"
}
```

**Acceptance Criteria (apply to ALL three):**
- [ ] Returns 200 status
- [ ] `html` field contains valid, renderable HTML
- [ ] HTML includes Tailwind CSS classes
- [ ] HTML reflects the selected schema's branding (colors, fonts)
- [ ] Generated content is relevant to the query AND the domain
- [ ] `conversation_turn` equals 1
- [ ] Session is now retrievable via GET
- [ ] Output uses component patterns appropriate to the domain (cards for products, rows/lists for tasks, tables for financial data)

---

### Step 1.3 — Refinement Query (Context Builds)

The user narrows their initial query. The engine must remember the previous context regardless of domain.

**Ecommerce variant:**
```json
{ "query": "Only show me ones under $100" }
```

**Project Management variant:**
```json
{ "query": "Just the high priority ones assigned to me" }
```

**Bookkeeping variant:**
```json
{ "query": "Only the ones categorized as software subscriptions" }
```

**Acceptance Criteria (apply to ALL three):**
- [ ] Response retains context from Turn 1 (doesn't start fresh)
- [ ] Results are filtered according to the refinement
- [ ] `conversation_turn` equals 2
- [ ] Branding remains consistent with Turn 1

---

### Step 1.4 — View Change Query (Component Type Shifts)

The user requests a different representation of the same data. This proves the engine generates different component types based on intent, not hardcoded templates.

**Ecommerce variant:**
```json
{ "query": "Compare the top 3 side by side" }
```

**Project Management variant:**
```json
{ "query": "Show these as a kanban board grouped by status" }
```

**Bookkeeping variant:**
```json
{ "query": "Graph these expenses over time" }
```

**Acceptance Criteria (apply to ALL three):**
- [ ] HTML structure fundamentally changes (e.g., grid → table, list → board, table → chart markup)
- [ ] The underlying data context is preserved (same filters from Turn 2)
- [ ] `conversation_turn` equals 3
- [ ] `components_used` metadata reflects the new component type

---

### Step 1.5 — Detail Drill-Down

The user focuses on a single item from the current view.

**Ecommerce variant:**
```json
{ "query": "Tell me more about the second one" }
```

**Project Management variant:**
```json
{ "query": "Open up the API integration task" }
```

**Bookkeeping variant:**
```json
{ "query": "Break down the largest expense" }
```

**Acceptance Criteria (apply to ALL three):**
- [ ] Output focuses on a single entity (not a list or grid)
- [ ] The selected entity matches what the user referenced from the previous turn's context
- [ ] Detail view includes domain-appropriate attributes
- [ ] `conversation_turn` equals 4

---

## Flow 2: Returning User — Session Resume (Any Domain)

**What this proves:** The engine can restore a prior session and continue accumulating context without loss, regardless of the domain.

**Preconditions:** A session exists with 4 conversation turns from Flow 1.

### Step 2.1 — Retrieve Existing Session

```
GET /api/engine/session/{session_id}
```

**Acceptance Criteria:**
- [ ] Returns 200 status
- [ ] Session reflects all prior turns
- [ ] Accumulated context shows extracted intent relevant to the domain
- [ ] `workflow_id` matches the original workflow

---

### Step 2.2 — Continue Conversation with Contextual Reference

The user references something from their prior session.

**Ecommerce variant:**
```json
{ "query": "Do you have that jacket in other colors?" }
```

**Project Management variant:**
```json
{ "query": "Add a subtask to that API integration task" }
```

**Bookkeeping variant:**
```json
{ "query": "Which vendor is that expense from?" }
```

**Acceptance Criteria:**
- [ ] Engine resolves "that" / "it" references using prior conversation context
- [ ] Response is contextually accurate to the prior drill-down
- [ ] `conversation_turn` increments correctly from the prior session count

---

### Step 2.3 — Pivot Within Same Domain

The user changes direction but stays in the same workflow.

**Ecommerce variant:**
```json
{ "query": "Actually, show me boots instead" }
```

**Project Management variant:**
```json
{ "query": "Switch to the backend refactor project" }
```

**Bookkeeping variant:**
```json
{ "query": "Now show me revenue instead of expenses" }
```

**Acceptance Criteria:**
- [ ] Output reflects the new topic entirely
- [ ] Previous filters are cleared (user didn't re-specify them)
- [ ] Session is not destroyed — history is maintained for "go back" queries
- [ ] `conversation_turn` increments correctly

---

## Flow 3: Domain Flexibility — Same Engine, Different Schemas

**What this proves:** The engine is truly agnostic. The same API, same logic, same code path produces fundamentally different outputs based solely on the workflow schema.

### Step 3.1 — Identical Query Pattern, Three Different Schemas

Send semantically equivalent queries to each schema and verify the outputs diverge appropriately.

**Query pattern:** "Show me the most important items"

**Ecommerce:**
```json
{
  "workflow_id": "ecommerce-v1",
  "session_id": "sess_flex_ecom",
  "query": "Show me the most popular items"
}
```

**Project Management:**
```json
{
  "workflow_id": "project-mgmt-v1",
  "session_id": "sess_flex_pm",
  "query": "Show me the most important items"
}
```

**Bookkeeping:**
```json
{
  "workflow_id": "bookkeeping-v1",
  "session_id": "sess_flex_bk",
  "query": "Show me the most significant items"
}
```

**Acceptance Criteria:**
- [ ] Ecommerce: Output shows products sorted/filtered by popularity (ratings, sales)
- [ ] Project Management: Output shows tasks sorted/filtered by priority
- [ ] Bookkeeping: Output shows transactions sorted/filtered by amount
- [ ] Each output uses domain-appropriate component patterns
- [ ] Each output uses its own schema's branding (different colors, fonts)
- [ ] The engine code path is identical — only the schema input differs

---

### Step 3.2 — Refinement Pattern Across Domains

Following from Step 3.1, send a generic refinement to each session.

**Query for all three:** `"Narrow it down to the top 5"`

**Acceptance Criteria:**
- [ ] All three sessions correctly interpret "it" as their respective Turn 1 results
- [ ] All three return exactly 5 items
- [ ] Context is domain-appropriate (5 products vs 5 tasks vs 5 transactions)
- [ ] No cross-domain contamination

---

### Step 3.3 — Schema Isolation Verification

```
GET /api/engine/session/sess_flex_ecom
GET /api/engine/session/sess_flex_pm
GET /api/engine/session/sess_flex_bk
```

**Acceptance Criteria:**
- [ ] Each session is bound to its own `workflow_id`
- [ ] Accumulated contexts are completely independent
- [ ] No data from one domain appears in another session's context

---

## Flow 4: Schema-Driven Branding Fidelity

**What this proves:** The engine faithfully applies branding defined in the workflow schema. The same query produces visually distinct output depending on the schema's branding configuration.

### Step 4.1 — Color Palette Application

Send the same query to two schemas with different branding:

**Schema A** — primary: `#3B82F6` (blue), heading font: `Inter`
**Schema B** — primary: `#DC2626` (red), heading font: `Playfair Display`

```json
{ "query": "Show me an overview" }
```

**Acceptance Criteria:**
- [ ] Schema A output uses blue-toned Tailwind classes or CSS variables
- [ ] Schema B output uses red-toned Tailwind classes or CSS variables
- [ ] Typography classes differ between the two outputs
- [ ] Border radius values match each schema's definition

---

### Step 4.2 — Branding Consistency Across Turns

Run 3 sequential queries in the same session.

**Acceptance Criteria:**
- [ ] All 3 responses use the same color palette from the schema
- [ ] Typography remains consistent
- [ ] Branding does not "drift" as the conversation progresses and prompts grow longer

---

## Flow 5: Edge Cases & Error Handling

### 5.1 — Invalid Workflow ID

```json
POST /api/engine/generate
{
  "workflow_id": "nonexistent-schema",
  "session_id": "sess_err_001",
  "query": "Show me stuff"
}
```

**Acceptance Criteria:**
- [ ] Returns 404 status
- [ ] Error message clearly states the workflow was not found
- [ ] No session is created

---

### 5.2 — Missing Required Fields

```json
POST /api/engine/generate
{
  "workflow_id": "ecommerce-v1"
}
```

**Acceptance Criteria:**
- [ ] Returns 400 status
- [ ] Error message identifies the missing fields (`session_id`, `query`)

---

### 5.3 — Empty Query String

```json
POST /api/engine/generate
{
  "workflow_id": "ecommerce-v1",
  "session_id": "sess_err_002",
  "query": ""
}
```

**Acceptance Criteria:**
- [ ] Returns 400 status
- [ ] Error message indicates query cannot be empty

---

### 5.4 — Session Not Found

```
GET /api/engine/session/sess_does_not_exist
```

**Acceptance Criteria:**
- [ ] Returns 404 status
- [ ] Error message indicates session was not found

---

### 5.5 — Session Cleanup

```
DELETE /api/engine/session/{session_id}
```

**Acceptance Criteria:**
- [ ] Returns 200 status with confirmation
- [ ] Subsequent GET for the same session returns 404
- [ ] A new POST with the same session_id starts fresh (Turn 1)

---

### 5.6 — Very Long Query

```json
{
  "query": "[2000+ character string]"
}
```

**Acceptance Criteria:**
- [ ] Engine either truncates gracefully or returns 400 with a max length error
- [ ] No unhandled exceptions

---

### 5.7 — Rapid Sequential Requests (Same Session)

Send 3 requests in quick succession to the same session.

**Acceptance Criteria:**
- [ ] Requests are processed sequentially (no race conditions on session state)
- [ ] Conversation turns increment correctly (no skips or duplicates)
- [ ] No corrupted session state

---

### 5.8 — Ambiguous / Off-Domain Query

Send a query that doesn't match the workflow's domain:

```json
{
  "workflow_id": "bookkeeping-v1",
  "session_id": "sess_err_004",
  "query": "Show me the best hiking trails nearby"
}
```

**Acceptance Criteria:**
- [ ] Engine does not crash
- [ ] Response either gracefully redirects ("I can help with bookkeeping queries — try asking about expenses or invoices") or generates a best-effort response within the domain
- [ ] Session state is not corrupted

---

## Testing Checklist Summary

| Category | Flow | What It Proves | Scenarios | Priority |
|---|---|---|---|---|
| Core Engine | Flow 1: First-Time User | Multi-turn context works across any domain | 5 steps × 3 schemas = 15 | **P0** |
| Session Persistence | Flow 2: Returning User | Context survives across requests | 3 steps × 3 schemas = 9 | **P0** |
| Domain Agnosticism | Flow 3: Same Engine, Different Schemas | Schema is the only variable | 3 steps | **P0** |
| Brand Fidelity | Flow 4: Branding | Schema branding is respected | 2 scenarios | **P1** |
| Robustness | Flow 5: Edge Cases | Engine handles bad input gracefully | 8 scenarios | **P1** |

### P0 — Demo Blockers
These must pass for the hackathon demo:
- A new session with any loaded schema returns valid, domain-appropriate HTML
- Multi-turn context accumulation works (at least 3 turns)
- The same engine produces different output for different schemas
- Sessions are retrievable and isolated

### P1 — Proof of Concept Validators
These prove the engine's quality:
- Branding from the schema is consistently applied
- Error responses are clean and informative
- Off-domain and malformed queries are handled gracefully

---

## Appendix: Domain-Agnostic Testing Pattern

For any new schema added to the engine, run this standard 4-query sequence to validate it works:

| Turn | Query Pattern | What It Tests |
|---|---|---|
| 1 | "Show me [broad category]" | Initial generation, schema data model |
| 2 | "Filter to [specific criteria]" | Context accumulation, data filtering |
| 3 | "Show this as a [different view]" | Component type switching |
| 4 | "Tell me more about [specific item]" | Reference resolution, detail generation |

If all 4 turns produce domain-relevant, branded, contextually-aware HTML, the schema is validated.
