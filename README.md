# Chatbot Multi-Turn Tester

A pragmatic PoC for **multi-turn red-team testing** of chatbots. It runs test suites (Jailbreak, Persuasion, Data Leak) **in parallel**, tracks progress, and produces a **findings report with transcripts**.

## ✨ What this does
- **Multi-turn orchestration** per test with timeouts
- **Concurrency** (≥3 in parallel) with a simple pool
- **Progress tracking** via polling (`/status/:scanId`)
- **Results report** with severity, short description, and expandable transcript
- **Adapter seam**: `mock` (default), `ollama`, `openai` (optional)

> **Note on URL**: the "Target URL" is **run metadata** (and can be added to the prompt context). The PoC does **not** automate web UIs. To test a vendor bot directly, add an API adapter or a browser-automation adapter (future work).

---

## 🏗️ Architecture (short)

Web (React/Vite) ──► API (Express/TS) ──► Orchestrator + Pool ──► Suites & Finding rules ──► Adapter (mock/ollama/openai)

- **Polling over WebSockets**: chosen for simplicity & reliability in a one-day PoC; 1s polling is sufficient for progress UI.
- **No DB**: state in memory + optional JSON dump to `api/samples/`. For production, add Postgres for persistence and Redis/BullMQ for queues.

---

## 📁 Project Layout

```
chatbot-multi‑turn-tester/
├── api/                    # Express/TS backend
│   ├── src/
│   │   ├── adapters/      # LLM adapters (mock, ollama, openai)
│   │   ├── core/          # Orchestrator, pool, test suites
│   │   ├── routes/        # API endpoints
│   │   ├── suites/        # Test suite definitions
│   │   └── utils/         # Finding rules, logger
│   ├── samples/           # JSON results dump
│   └── Dockerfile
├── web/                    # React/Vite frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   └── lib/           # API client, utils
│   └── Dockerfile
├── docker-compose.yml      # Full stack
└── docker-compose.dev.yml  # Dev setup
```

## 🛠️ Tech Stack

- **Backend**: Express.js + TypeScript, in-memory state
- **Frontend**: React 18 + Vite, Tailwind CSS, shadcn/ui
- **Testing**: Vitest, E2E with mock adapter
- **LLM**: Adapter pattern for mock/ollama/openai
- **Deployment**: Docker Compose, optional Ollama profile

---

## 🚀 Quick Start (Mock adapter – recommended)

> **No keys or Docker required:** The default `mock` adapter runs entirely local with no external dependencies.

### Prerequisites
- Node.js 20+ and npm
- Docker Desktop (optional, for Ollama)

### 1) Install
```bash
# API
cd api && npm install
# Web
cd ../web && npm install
```

### 2) Environment
Create `api/.env`:

```env
NODE_ENV=development
PORT=4000
ADAPTER=mock
# Optional defaults; the UI can override per scan:
CONCURRENCY=3
TEST_TIMEOUT_MS=30000
TURN_TIMEOUT_MS=10000
CORS_ORIGIN=http://localhost:5173
```

Create `web/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3) Run 
```bash
# One Terminal - from root
npm run dev

# Or:
# Terminal A
cd api && npm run dev
# Terminal B
cd web && npm run dev
```

### 3b) Docker Compose (optional)

Bring up the stack with Docker instead of running two terminals:

```bash
# Full stack (all services defined)
docker compose up -d

# API + Web
docker compose up -d api web

# (Optional) Ollama service (if you want to test the ollama adapter)
docker compose up -d ollama

# Tail logs (Ctrl+C to stop following)
docker compose logs -f api
docker compose logs -f web

# Stop & remove containers
docker compose down
```

Open http://localhost:5173. Enter a URL, pick a suite, Start Scan. Watch progress, then view results & transcripts.

---

## (Optional) Run with Ollama/OpenAI

Not required for the assignment. Use if you want to prove the adapter seam with a live model.

### Ollama (local)

```bash
docker run -d --name ollama -p 11434:11434 ollama/ollama
docker exec -it ollama ollama pull llama3.2:3b   # or llama3.1 if you prefer
```

`api/.env`:

```env
ADAPTER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
CONCURRENCY=2
TEST_TIMEOUT_MS=60000
TURN_TIMEOUT_MS=15000
```

Restart the API and run a scan. Expect slower/variable results; findings may be 0 (that's fine).

### OpenAI (optional)

```env
ADAPTER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
CONCURRENCY=2
```

---

## 📚 API

Base URL: `http://localhost:4000/api`

### Start scan

```http
POST /api/scan
Content-Type: application/json

{
  "url": "https://example.com",
  "suite": "jailbreak"
  // advanced fields are optional; provided by the form if present
  // e.g., "concurrency": 3, "testTimeoutMs": 30000, "turnTimeoutMs": 10000
}
```

> **Advanced settings**: The UI provides optional fields for `concurrency`, `testTimeoutMs`, and `turnTimeoutMs`. If omitted, the API falls back to environment defaults.

### Status

```http
GET /api/status/:scanId
```

```bash
curl http://localhost:4000/api/status/YOUR_SCAN_ID
```

### Results

```http
GET /api/results/:scanId
```

```bash
curl http://localhost:4000/api/results/YOUR_SCAN_ID
```

### Suites
- **jailbreak** — attempts to bypass guardrails
- **persuasion** — cajoling/social-engineering  
- **dataLeak** — attempts to exfiltrate secrets or hidden prompts

---

## 📸 Screenshots

- **Start New Scan**  
  ![Dashboard](docs/screenshots/dashboard.png)

- **Error state (network failure)**  
  ![Error: Failed to fetch](docs/screenshots/error-fetch.png)

- **Progress – running**  
  ![Progress running](docs/screenshots/progress-running.png)

- **Progress – completed**  
  ![Progress completed](docs/screenshots/progress-completed.png)

- **Results summary**  
  ![Results](docs/screenshots/results-summary.png)

- **Conversation transcript (finding detail)**  
  ![Transcript](docs/screenshots/transcript.png)

---

## 🧪 Tests

Unit: finding-rule utils, orchestrator basics

E2E (mock): start scan → poll status → fetch results

```bash
cd api && npm test
```

---

## ❓Why these choices

- **Polling vs WebSockets**: 1s polling is dead-simple, infra-agnostic, and good enough for progress; SSE/WS can be added later.
- **No DB**: keeps the PoC lean; results are in memory and also dumped to `api/samples/`. For production, add Postgres (history) and Redis/BullMQ (queues/scale).

---

## 🔧 Adapters

- **mock** (default): deterministic, fast, offline — perfect for demo/CI.
- **ollama**: local open-source models (optional).
- **openai**: hosted (optional).

Example sample: see `api/samples/example_results.json`.

---

## 🔧 Troubleshooting

- **Web → API calls:** Use either the Vite proxy (call `/api/*`) **or** set `VITE_API_BASE_URL=http://localhost:4000` and call absolute URLs — not both.
- **CORS**: If skipping proxy, configure `CORS_ORIGIN` in `api/.env`
- **Environment debug**: `cd api && node -e "require('dotenv').config(); console.log(process.env)"`
- **Windows**: Use `curl.exe` or Git Bash for curl commands
- **Live LLMs**: Findings may be 0 with real models (that's normal)

---

## 💡 Demo tips

- Start with mock adapter for consistent, fast results
- Use jailbreak suite for most dramatic findings
- Show progress polling in real-time
- Expand transcript dialogs to show conversation flow
- Mention the adapter seam for enterprise integration

---

## 📄 License

MIT 