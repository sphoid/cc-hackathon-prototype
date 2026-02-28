# PRD: Dynamic UI Workflow Engine

## 1. Overview & Objectives

The Dynamic UI Workflow Engine is an API-first system that interprets user queries within the context of a defined workflow schema and generates UI components (raw HTML/shadcn) on the fly using Claude as the intelligence layer. The engine maintains conversation state, allowing users to iteratively refine the generated interface through follow-up queries.

**Primary Objective:** Build a proof-of-concept engine at a hackathon that demonstrates dynamic, schema-driven UI generation powered by an LLM.

**Core Value Proposition:** Instead of pre-building every possible page or view, the engine composes UI in real-time based on what the user needs — adapting to any domain (ecommerce, project management, bookkeeping) through swappable workflow schemas.

---

## 2. Project Scope & Scale

| Attribute | Value |
|---|---|
| Project type | Hackathon proof of concept |
| Expected users | Developers / demo audience (< 50) |
| Data sensitivity | None (mock data only) |
| Security requirements | Minimal — API key management only |
| Deployment target | Local development / demo environment |

---

## 3. Target Audience

- **Primary:** Developers and technical stakeholders evaluating the engine concept
- **Secondary (future):** Brands and businesses wanting dynamic, conversational web experiences

---

## 4. Core Architecture

### 4.1 System Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   API Client  │────▶│  Workflow Engine  │────▶│   Claude AI   │
│  (REST call)  │◀────│  (Next.js API)   │◀────│  (Anthropic)  │
└──────────────┘     └──────────────────┘     └──────────────┘
                              │
                     ┌────────┴────────┐
                     │                 │
              ┌──────▼──────┐  ┌───────▼───────┐
              │  Workflow    │  │ Conversation  │
              │  Schema      │  │ State Store   │
              │  Registry    │  │ (in-memory)   │
              └─────────────┘  └───────────────┘
```

### 4.2 Request / Response Lifecycle

1. Client sends a request with: `workflow_id`, `session_id`, `user_query`
2. Engine loads the workflow schema from the registry
3. Engine retrieves conversation history for the session
4. Engine constructs a prompt combining: schema definition (branding, components, data model) + conversation history + user query
5. Claude generates the appropriate UI as raw HTML with shadcn component markup
6. Engine returns the generated HTML + updated session metadata
7. Client renders the HTML

---

## 5. Workflow Protocol Specification

The workflow protocol is the schema definition language that tells the engine *what domain it's operating in* and *how to generate UI* for that domain.

### 5.1 Schema Structure

```json
{
  "workflow_id": "ecommerce-v1",
  "name": "E-Commerce Experience",
  "version": "1.0.0",

  "branding": {
    "name": "Brand Name",
    "logo_url": "https://example.com/logo.svg",
    "typography": {
      "heading_font": "Inter",
      "body_font": "Inter",
      "mono_font": "JetBrains Mono"
    },
    "color_palette": {
      "primary": "#3B82F6",
      "secondary": "#10B981",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "surface": "#F8FAFC",
      "text_primary": "#0F172A",
      "text_secondary": "#64748B",
      "destructive": "#EF4444"
    },
    "border_radius": "0.5rem"
  },

  "data_sources": {
    "products": {
      "type": "mock",
      "schema": {
        "id": "string",
        "name": "string",
        "price": "number",
        "category": "string",
        "image_url": "string",
        "description": "string",
        "rating": "number"
      }
    }
  },

  "ui_directives": {
    "component_library": "shadcn",
    "output_format": "html",
    "responsive": true,
    "dark_mode": false
  },

  "prompt_context": "You are a UI generation engine for an e-commerce platform. Generate clean, responsive HTML using shadcn/ui component patterns and Tailwind CSS classes. The user is browsing products and will ask questions to refine what they see. Always generate complete, renderable HTML sections."
}
```

### 5.2 Example Workflow Schemas

**Ecommerce:** Defines product data models, shopping-oriented component patterns (product grids, filters, detail views, comparison tables, cart summaries)

**Project Management:** Defines task/project data models, productivity-oriented components (kanban boards, task lists, timelines, status dashboards)

**Bookkeeping:** Defines financial data models, accounting-oriented components (ledger tables, invoice views, charts, summary cards)

### 5.3 Schema Registry

For the POC, schemas are stored as JSON files in the project directory. The engine loads them by `workflow_id`.

```
/schemas
  ├── ecommerce-v1.json
  ├── project-mgmt-v1.json
  └── bookkeeping-v1.json
```

---

## 6. API Design

### 6.1 Generate UI

**POST** `/api/engine/generate`

**Request Body:**
```json
{
  "workflow_id": "ecommerce-v1",
  "session_id": "sess_abc123",
  "query": "I'm interested in jackets under $100"
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "html": "<div class='grid grid-cols-3 gap-4'>...</div>",
  "metadata": {
    "components_used": ["product-grid", "filter-badge"],
    "query_interpretation": "User wants jacket products filtered by price < $100",
    "conversation_turn": 3
  }
}
```

### 6.2 List Workflows

**GET** `/api/engine/workflows`

Returns available workflow schemas.

### 6.3 Session Management

**GET** `/api/engine/session/:session_id`

Returns conversation history and current state for a session.

**DELETE** `/api/engine/session/:session_id`

Clears a session.

---

## 7. Conversation State Management

The engine maintains conversation context in-memory using a session store (Map or similar structure).

### 7.1 Session Object

```typescript
interface Session {
  id: string;
  workflow_id: string;
  created_at: Date;
  last_active: Date;
  conversation: ConversationMessage[];
  context: Record<string, any>; // Accumulated user intent/filters
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
```

### 7.2 Context Accumulation

Each turn, the engine passes the full conversation history to Claude so follow-up queries build on prior context. Example:

- Turn 1: "I'm interested in jackets" → Product grid of jackets
- Turn 2: "Only under $100" → Filtered grid with price filter applied
- Turn 3: "Compare the top 3" → Comparison table component

The accumulated context object tracks extracted intent (e.g., `{ category: "jackets", max_price: 100, action: "compare", count: 3 }`).

---

## 8. Claude Integration

### 8.1 Prompt Construction

The engine builds a system prompt from the workflow schema and appends the conversation history as messages:

```typescript
const systemPrompt = `
${schema.prompt_context}

BRANDING:
- Colors: ${JSON.stringify(schema.branding.color_palette)}
- Typography: ${JSON.stringify(schema.branding.typography)}
- Border radius: ${schema.branding.border_radius}

AVAILABLE DATA SCHEMA:
${JSON.stringify(schema.data_sources, null, 2)}

UI DIRECTIVES:
- Use shadcn/ui component patterns with Tailwind CSS classes
- Output raw, renderable HTML
- Apply the branding colors and typography via Tailwind classes and inline CSS variables
- Generate mock data that fits the data schema
- Respond ONLY with the HTML. No explanations, no markdown fences.
`;
```

### 8.2 Model Configuration

| Parameter | Value |
|---|---|
| Model | `claude-sonnet-4-5-20250929` |
| Max tokens | 4096 |
| Temperature | 0.3 (lower for consistent, structured output) |
| Streaming | Optional for POC, recommended for future |

**Why Sonnet over Opus for POC:** Faster response times, lower cost, and sufficient quality for structured HTML generation. Opus can be swapped in later for more complex reasoning tasks.

---

## 9. Technical Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 22.x LTS | Server runtime |
| Framework | Next.js 16.1.6 (App Router) | API routes, project structure |
| Language | TypeScript 5.x | Type safety |
| AI SDK | @anthropic-ai/sdk 0.78.0 | Direct Claude API integration |
| UI Components | shadcn/ui (CLI 3.0+) | Component pattern reference |
| Styling | Tailwind CSS 4.2.1 | Utility-first CSS in generated output |
| State | In-memory Map | Session/conversation storage |
| Data | JSON mock files | Demo product/task/financial data |

---

## 10. Dependencies and Versions

Last updated: February 28, 2026

### Core Dependencies

| Package | Version | Purpose |
|---|---|---|
| next | 16.1.6 | Framework (App Router, API routes) |
| react | 19.x | UI library (bundled with Next.js 16 App Router) |
| react-dom | 19.x | React DOM renderer |
| typescript | ~5.7.x | Type checking |
| @anthropic-ai/sdk | 0.78.0 | Claude API client |
| tailwindcss | 4.2.1 | CSS utility framework |
| @tailwindcss/vite | 4.2.1 | Tailwind Vite plugin (Next.js 16 default bundler is Turbopack, use @tailwindcss/postcss if needed) |

### Development Dependencies

| Package | Version | Purpose |
|---|---|---|
| @types/node | ~22.x | Node.js type definitions |
| @types/react | ~19.x | React type definitions |
| eslint | ~9.x | Linting |
| eslint-config-next | ~16.x | Next.js ESLint config |

### Optional / Future

| Package | Version | Purpose |
|---|---|---|
| ai | ~4.x | Vercel AI SDK (if you want streaming helpers later) |
| @ai-sdk/anthropic | 3.0.48 | Vercel AI SDK Anthropic provider |
| zod | ~3.24.x | Schema validation for workflow protocols |
| uuid | ~11.x | Session ID generation |

### Compatibility Notes

- Next.js 16.x requires Node.js 20.9+ (recommend 22.x LTS)
- Next.js 16 App Router bundles React 19 canary — declare react/react-dom in package.json for tooling compatibility
- Tailwind CSS v4 uses CSS-first configuration via `@theme` directives — no `tailwind.config.js` needed
- shadcn/ui now uses unified `radix-ui` package instead of individual `@radix-ui/react-*` packages
- Turbopack is the default bundler in Next.js 16 — use `@tailwindcss/postcss` if you need PostCSS compatibility

---

## 11. Conceptual Data Model

### Mock Data Files

```
/data
  ├── ecommerce/
  │   ├── products.json      # 20-30 mock products
  │   └── categories.json    # Product categories
  ├── project-mgmt/
  │   ├── tasks.json          # Mock tasks
  │   └── projects.json       # Mock projects
  └── bookkeeping/
      ├── transactions.json   # Mock transactions
      └── accounts.json       # Mock accounts
```

Each mock data file conforms to the `data_sources` schema defined in the workflow.

---

## 12. Project Structure

```
/
├── app/
│   └── api/
│       └── engine/
│           ├── generate/
│           │   └── route.ts        # POST - main generation endpoint
│           ├── workflows/
│           │   └── route.ts        # GET - list workflows
│           └── session/
│               └── [id]/
│                   └── route.ts    # GET/DELETE - session management
├── lib/
│   ├── engine/
│   │   ├── prompt-builder.ts       # Constructs system prompts from schemas
│   │   ├── session-store.ts        # In-memory session management
│   │   ├── schema-loader.ts        # Loads workflow schemas
│   │   └── claude-client.ts        # Anthropic SDK wrapper
│   ├── types/
│   │   ├── workflow.ts             # Workflow schema types
│   │   ├── session.ts              # Session types
│   │   └── api.ts                  # Request/response types
│   └── mock-data/
│       └── loader.ts               # Mock data loading utilities
├── schemas/
│   ├── ecommerce-v1.json
│   ├── project-mgmt-v1.json
│   └── bookkeeping-v1.json
├── data/
│   ├── ecommerce/
│   ├── project-mgmt/
│   └── bookkeeping/
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 13. UI Design Principles

Even though the POC is API-only, the *generated* HTML should follow these principles:

- **Responsive by default:** Use Tailwind's responsive prefixes (sm, md, lg)
- **Brand-consistent:** Apply the schema's color palette and typography throughout
- **Component-based patterns:** Use shadcn/ui structural patterns (Card, Table, Badge, Button, etc.) as HTML with Tailwind classes
- **Accessible:** Include semantic HTML, aria labels, and proper heading hierarchy
- **Self-contained:** Each response should be a complete, renderable HTML fragment — no external dependencies beyond Tailwind CSS

---

## 14. Security Considerations

Given this is a hackathon POC with no user data:

- Store the Anthropic API key in `.env.local` (never commit)
- Add `.env.local` to `.gitignore`
- Basic input validation on API request bodies (check for required fields, reasonable string lengths)
- No authentication required for POC

---

## 15. Development Phases

### Phase 1: Foundation (Hours 1-3)
- Scaffold Next.js 16 project with TypeScript and Tailwind
- Define TypeScript interfaces for workflow schemas, sessions, and API contracts
- Build the schema loader and session store
- Create the ecommerce workflow schema with mock data

### Phase 2: Engine Core (Hours 3-6)
- Implement the prompt builder that converts schemas to system prompts
- Integrate Claude via @anthropic-ai/sdk
- Build the `/api/engine/generate` endpoint
- Implement conversation state management (context accumulation across turns)

### Phase 3: Refinement (Hours 6-8)
- Add a second workflow schema (project management) to prove domain flexibility
- Test multi-turn conversations and context persistence
- Add the `/api/engine/workflows` and `/api/engine/session` endpoints
- Edge case handling and error responses

### Phase 4: Demo Prep (Hours 8-10)
- Create a simple test harness (curl scripts or a minimal HTML page with fetch calls)
- Prepare demo scenarios showing multi-turn, multi-domain capabilities
- Document the API for demo audience

---

## 16. Acceptance Criteria

### Generate Endpoint
- Accepts a workflow_id, session_id, and user query
- Returns valid, renderable HTML using shadcn/Tailwind patterns
- Applies branding from the workflow schema (colors, fonts, border-radius)
- Incorporates mock data appropriate to the query
- Maintains conversation context across sequential requests with the same session_id

### Workflow Protocol
- Schemas are valid JSON conforming to the defined structure
- Engine correctly loads schemas by workflow_id
- Different schemas produce visually distinct outputs (different branding, different component types)

### Session Management
- Follow-up queries refine previous output (e.g., "only under $100" narrows a product grid)
- Sessions are isolated — different session_ids produce independent conversations
- Session state can be retrieved and cleared via API

---

## 17. Potential Challenges & Mitigations

| Challenge | Mitigation |
|---|---|
| Claude generating inconsistent HTML structure | Use detailed system prompts with explicit output format instructions and few-shot examples in the prompt |
| Response latency (1-3s per generation) | Accept for POC; future: streaming responses via SSE |
| Token limits on large conversations | Implement a sliding window or summary of older turns for long sessions |
| Mock data not matching generated UI expectations | Include the full mock dataset in the prompt so Claude can reference real values |
| Brand styling not being applied consistently | Include explicit Tailwind class mappings in the system prompt (e.g., "primary color maps to `bg-blue-500`") |

---

## 18. Future Expansion

These are out of scope for the hackathon but represent the product roadmap:

- **Streaming responses** via Server-Sent Events for real-time UI rendering
- **Real data source integration** replacing mock data with actual APIs/databases
- **Component registry** with pre-built, validated shadcn components that Claude can select from (instead of ad-hoc generation)
- **Visual preview layer** — a frontend that renders the generated HTML in real time
- **Multi-step workflows** with DAG-based orchestration (step A feeds into step B)
- **Schema marketplace** where brands can publish and share workflow schemas
- **Caching layer** for common query patterns to reduce API calls
- **A/B testing** of generated layouts
- **Analytics** on which components and layouts users engage with most
