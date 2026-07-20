# Original User Request

## Initial Request — 2026-07-19T08:00:42Z

# Teamwork Project Prompt — Draft

Overhaul the Luna v2 AI assistant into a highly performant, agentic OS system (Luna v3) optimized for a 3B parameter local model. The system must support ultra-low latency token streaming, native system integrations (Selenium browser control, opening apps), and seamless API routing between local models and cloud providers (Gemini, OpenAI, Groq).

Working directory: C:\Users\PRASANTH\.gemini\antigravity\scratch\Luna\Luna-v2.15.05.26-main
Integrity mode: development

## Requirements

### R1. OS Control & Automation
Luna must be able to execute actionable tasks such as opening local applications and controlling an automated web browser (e.g., via Selenium) for complex workflows like social media messaging. The agent team has full freedom to architect the best solution for this.

### R2. Ultra-Low Latency & Streaming
The architecture must be optimized for a 3B parameter local model. Implement token-by-token streaming to eliminate perceived UI blocking and wait times.

### R3. API Routing Engine
Implement a robust API fallback and routing engine that can seamlessly parse and switch between Local API (Ollama), Gemini, OpenAI, and Groq based on the task or availability.

### R4. UI/UX Overhaul
Refactor the frontend to fix and polish "kiddish" design elements. The UI must support a toggleable full-screen "voice mode" that replaces the standard chat window.

### R5. Research Reference & Vision Alignment
The agent team must research the user's "Luna v3" GitHub repo to deeply understand the underlying motivation, motto, and core philosophy behind the project. The final implementation and architectural choices should align with this vision.

## Acceptance Criteria

### Automated Verification
- [ ] The agent team MUST write and provide automated programmatic tests (e.g., Python pytest, JS Jest, or standalone scripts) that verify the core logic.
- [ ] Automated tests must successfully execute a mock browser automation workflow.
- [ ] Automated tests must verify that the API routing engine correctly falls back to alternative providers when a mock primary provider fails.
- [ ] Test scripts must ensure the streaming UI and voice mode toggles function without throwing console errors.
