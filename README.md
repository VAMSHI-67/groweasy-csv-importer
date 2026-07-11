# GrowEasy Lead Importer 🚀

**AI-Powered CRM CSV Importer** — Upload any CSV export (Facebook Lead Ads, Google Ads, Excel exports, real-estate CRM exports, sales reports, manual spreadsheets) and automatically map it to the GrowEasy CRM schema using LLM-based semantic field extraction.

The core engineering challenge is **robust, general-purpose AI field-mapping** that works across wildly different, messy, ambiguous CSV structures without hardcoding column names.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│  1. UPLOAD ──→ 2. PREVIEW ──→ 3. CONFIRM ──→ 4. RESULTS       │
│  (Dropzone)    (TanStack)     (Loading)      (CRM Table)       │
│      │              │              │               │            │
│  PapaParse     Client-side    POST /api/      Render +          │
│  (client)      parse only    csv/extract      Export            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXPRESS BACKEND (apps/api)                     │
│                                                                 │
│  Route → Controller → Extraction Service                        │
│                          │                                      │
│                    ┌─────┴──────┐                               │
│                    │  Batching  │  (20 rows/batch)               │
│                    └─────┬──────┘                               │
│                    ┌─────┴──────┐                               │
│                    │ AI Provider│  (Gemini/Groq/OpenAI/Mock)    │
│                    └─────┬──────┘                               │
│                    ┌─────┴──────┐                               │
│                    │ Validation │  (Zod + business rules)       │
│                    └────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **Next.js 14 + TypeScript + Tailwind CSS** | App Router, modern React |
| CSV Parsing | **PapaParse** (client) | Streaming, battle-tested |
| Tables | **TanStack Table v8 + TanStack Virtual** | Virtualized for large CSVs |
| Upload | **react-dropzone** | Drag & drop support |
| Backend | **Express + TypeScript** | Clean route→controller→service |
| AI | **Gemini 2.0 Flash** (primary) | Free tier: 15 RPM, 1M tokens/day |
| Validation | **Zod** (shared schema) | Single source of truth |
| Testing | **Vitest** | Fast, modern test runner |

## Setup Instructions

### Prerequisites
- **Node.js 20+** ([download](https://nodejs.org/))
- **pnpm** (install: `npm install -g pnpm`)
- A free AI API key (see below)

### Getting a Free API Key

**Google Gemini (Recommended):**
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key — no credit card required

**Groq (Alternative):**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Go to API Keys → Create API Key
4. Copy the key — no credit card required

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/groweasy-csv-importer.git
cd groweasy-csv-importer

# Install dependencies
pnpm install

# Build shared schema package
pnpm build:shared

# Copy env and add your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY or GROQ_API_KEY

# Start both frontend and backend
pnpm dev
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:3001`.

### Docker Alternative

```bash
# Set your API key in .env first
docker compose up --build
```

## How AI Extraction Works

1. **Client-side parsing**: PapaParse parses the CSV in the browser for instant preview (no network call)
2. **Batch splitting**: Rows are split into batches of 20 (configurable) for optimal AI processing
3. **Bounded concurrency**: Batches are processed in parallel with `p-limit` (default: 3 concurrent) to respect rate limits
4. **Semantic mapping**: The AI system prompt encodes all CRM field rules, including:
   - Semantic column name matching (not exact string matching)
   - Status classification from free-text remarks
   - Multi-email/phone handling (first → field, rest → crm_note)
   - Skip rule: rows without email AND phone are excluded
   - Data source enum enforcement
5. **Deterministic validation**: Post-AI guardrails re-validate every record (enum coercion, date parsing, skip rule re-check, whitespace normalization)
6. **Retry**: Failed batches retry with exponential backoff (3 attempts)

## API Reference

### POST `/api/csv/extract`

**Request:**
```json
{
  "headers": ["Name", "Email", "Phone", "Status"],
  "rows": [
    { "Name": "John Doe", "Email": "john@example.com", "Phone": "+91 9876543210", "Status": "Interested" }
  ]
}
```

**Response:**
```json
{
  "imported": [
    {
      "created_at": null,
      "name": "John Doe",
      "email": "john@example.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": null,
      "city": null,
      "state": null,
      "country": null,
      "lead_owner": null,
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": null,
      "data_source": "",
      "possession_time": null,
      "description": null
    }
  ],
  "skipped": [],
  "total_input_rows": 1,
  "total_imported": 1,
  "total_skipped": 0
}
```

**Error Response:**
```json
{ "error": { "code": "AI_PROVIDER_TIMEOUT", "message": "AI provider timed out. Please retry." } }
```

| Status | Code | Meaning |
|--------|------|---------|
| 400 | INVALID_REQUEST | Bad request body |
| 413 | PAYLOAD_TOO_LARGE | Too many rows (max 5000) |
| 502 | AI_RATE_LIMITED | AI provider rate limit |
| 504 | AI_PROVIDER_TIMEOUT | AI provider timeout |

### GET `/api/health`

Returns server status and configured AI provider.

## Running Tests

```bash
# Run all backend tests (uses MockAIProvider, no API key needed)
pnpm test

# Run with live AI (requires API key in .env)
RUN_LIVE_AI_TESTS=1 pnpm test
```

## Known Limitations / Trade-offs

- **Batch size (20 rows)**: Balances accuracy vs. speed. Larger batches may cause context confusion; smaller batches increase API calls.
- **Free tier rate limits**: Gemini free tier allows 15 RPM / 1M tokens per day. Very large CSVs (1000+ rows) may take longer due to rate limiting.
- **No persistence**: Stateless by default — import results are not saved server-side. Export to CSV/JSON from the UI.
- **Mock provider for tests**: Tests use a heuristic-based MockAIProvider for offline reliability. Live AI tests are gated behind `RUN_LIVE_AI_TESTS=1`.
- **Date parsing**: Ambiguous date formats (e.g., "01/02/03") may be interpreted differently. The AI is instructed to prefer ISO 8601.

## Project Structure

```
groweasy-csv-importer/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # Pages and layout
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/    # State management
│   │   │   └── lib/      # Utilities
│   └── api/              # Express backend
│       ├── src/
│       │   ├── config/   # Environment config
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── routes/
│       │   └── services/
│       │       └── ai/   # Provider abstraction
│       └── tests/
│           └── fixtures/ # Sample CSVs
├── packages/
│   └── shared/           # Zod schema (single source of truth)
├── docker-compose.yml
└── README.md
```

## Live Demo & Repository

- **Live Demo**: [YOUR_DEPLOYED_URL]
- **GitHub**: [YOUR_GITHUB_URL]

## Position Applying For

[Software Developer Intern / Software Developer Full-Time]

---

Built with ❤️ using Next.js, Express, and Gemini AI.
