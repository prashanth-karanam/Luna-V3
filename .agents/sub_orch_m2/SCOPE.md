# Scope: Milestone 2 (API Routing Engine)

## Architecture
- **Module**: `core/llm_router.js` (or similar depending on existing structure).
- **Responsibilities**:
  - Provide a unified generation method `generate(prompt, options)`.
  - Provide an asynchronous streaming method `generateStream(prompt, options)`.
  - Handle fallback logic automatically (e.g., if primary provider is Ollama and it fails, fallback to Gemini, then OpenAI, then Groq).
- **Providers**:
  - Ollama (Local)
  - Gemini
  - OpenAI
  - Groq

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Routing Engine Implementation | Build API routing logic, implement fallback mechanisms and streaming for all 4 providers. Add unit/automated tests. | none | PLANNED |

## Interface Contracts
### `routing` ↔ `core`
- Fallback configuration interface (setting priorities and API keys).
- Asynchronous streaming generation interface (firing `token` events).
