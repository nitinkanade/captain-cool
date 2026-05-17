# Antigravity Session Notes — Captain Cool

3-hour vibe-coding session for APL Hackathon. Built on the Gemini stack inside Google Antigravity.

## Build phases

1. **Scaffold** (≈30 min) — Next.js 16 app, env wiring for `GEMINI_API_KEY`, agent skeleton in `src/lib/agents.js`.
2. **Three agents** (≈45 min) — Numbers (stats), Captain Cool (Dhoni-brain), Ravi (devil's advocate). Each gets its own system prompt and role.
3. **Tool use** (≈30 min) — `getPlayerMatchup` (Numbers), `googleSearch` grounding (Captain Cool), `getWinProbability` (Ravi). All three agents wield a tool.
4. **Multi-turn debate loop** (≈20 min) — Numbers → Captain proposes → Ravi challenges → Captain revises. Each turn visible in the UI.
5. **UI polish** (≈30 min) — chat-bubble debate stream, grounding-source chips, Hindi translation toggle, voice playback via Web Speech.
6. **Audit & docs** (≈25 min) — all problem-spec input fields wired, dev.to blog draft, AI Studio prompt link.

## Decisions captured

- **Why `gemini-2.5-pro` for Captain Cool, `2.5-flash` for the others?** Captain is the decision-maker and needs deeper reasoning + Google Search grounding; Numbers and Ravi are tighter-scope and benefit from flash's speed.
- **Why can't Captain Cool have function-declarations AND googleSearch?** Gemini API restriction — built-in tools (`googleSearch`, `urlContext`, `codeExecution`) can't be mixed with custom `functionDeclarations` in the same call. Solution: split tools across agents.
- **Why a manual orchestration loop instead of ADK?** Three agents in a linear debate didn't need ADK overhead; the orchestration in `src/app/api/decide/route.js` is 30 LOC and easier to trace.

## Trace artifacts

See `.antigravity/agent-traces/` for sample debate traces captured during build.
