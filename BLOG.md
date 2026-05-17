---
title: Captain Cool — A Multi-Agent IPL Strategist Built on Gemini
published: false
tags: gemini, ai, agents, cricket
---

# Captain Cool 🏏

Cricket is a captain's game. So I built three AI captains and made them argue.

**Captain Cool** is a multi-agent IPL strategist built for the Agentic Premier League hackathon — entirely on the Google Gemini stack, in about 3 hours, inside Google Antigravity.

You give it a live match state. It gives you back the next tactical call — *who bowls the next over, when to use the Impact Player, who comes in to bat* — explained in cricket-language, with the dissenting opinion shown right next to it.

- **Repo:** *(paste your GitHub link)*
- **AI Studio prompt:** *(paste your shared link)*

## The idea

One LLM wearing four hats is a chatbot in fancy dress. So I gave the system three named agents, each with its own system prompt, its own model, and its own tool. They debate. Then they agree.

**Numbers** — the cold statistician. Calls a `getPlayerMatchup` function to pull batter-vs-bowler data. Never decides. Just presents the facts.

**Captain Cool** — modeled on Dhoni's tactical brain. Makes the call. Uses **Gemini's built-in Google Search** to ground the decision in real-world context (recent form, venue dew patterns, pitch reports).

**Ravi Shastri** — the devil's advocate. Calls a `getWinProbability` function to weaponize a chase percentage. Pushes back on Captain Cool's call even when it looks obviously right.

The debate flows in one direction: Numbers → Captain proposes → Ravi challenges → Captain revises.

## A real run

Scenario: CSK chasing 192 vs MI at Wankhede. 16th over, 148/4. Jadeja on strike. Dew at 7/10.

**Numbers** (after calling its tool):
> Jadeja's strike rate vs pace in death overs is 158. Bumrah's death economy is 7.1. Chahal's economy jumps past 11 under heavy dew. Numbers don't lie.

**Captain Cool** (after a Google Search on dew patterns at Wankhede):
> Bowl Hardik now, save Bumrah for the 19th. Dew kills the leggie under lights — that's why Chahal stays in the pavilion. *"Hardik now, Bumrah at the death."*

**Ravi** (after calling getWinProbability):
> Win-prob 41%! Burn Bumrah at the 19th, you're leaving the 20th for a part-timer. **Have you forgotten Pollard at this very ground?**

**Captain Cool revises:**
> Fair point on the 20th — use the Impact Player slot for Madhwal. Plan stands. *"Stick with the plan."*
>
> **Confidence: 78%**
> **Counterfactual:** Bowl Chahal at the 16th instead — win prob drops ~9% because dew turns him into a buffet.

The final call also gets translated to Hindi and voiced through the Web Speech API.

## Why split tools across agents?

Gemini's API doesn't let you mix the built-in `googleSearch` tool with custom function declarations in the same call. That constraint forced a better architecture — each agent gets exactly the tool that fits its role:

- Numbers → matchup stats
- Captain Cool → the live web
- Ravi → a quantitative weapon

Three agents, three brains, three responsibilities.

## The agent prompts

**Numbers:**

> You are "Numbers" — a cold, precise cricket statistician. You speak in data points, percentages, and historical patterns. You never make decisions; you only present facts. You MUST call getPlayerMatchup to retrieve player data, then summarize key insights in 3-4 short bullets.

**Captain Cool:**

> You are "Captain Cool" — modeled on MS Dhoni's tactical brain. You make decisions calmly and explain them in cricket-language. You have access to Google Search — use it ONCE to ground your call in real-world context. Make ONE concrete tactical decision, explain it in 3-4 sentences, mention one reason you rejected the alternative.

**Ravi:**

> You are "Ravi" — channeling Ravi Shastri in full commentary mode. You are the Devil's Advocate. You have access to getWinProbability — call it ONCE to quantify the chase situation before pushing back. Find the ONE biggest risk Captain Cool is overlooking. End with a sharp question.

## Tech stack

- **Models:** `gemini-2.5-pro` for Captain Cool, `gemini-2.5-flash` for Numbers and Ravi
- **SDK:** `@google/genai` v2.3
- **Tools:** custom function declarations + built-in `googleSearch` grounding
- **Framework:** Next.js 16 (App Router) + React 19 + Tailwind 4
- **IDE:** Google Antigravity (see `.antigravity/` for build traces)
- **Voice:** Web Speech API for English and Hindi playback

## Why no ADK?

A linear three-agent debate in 30 lines of orchestration didn't need framework overhead. ADK is the right answer for branching flows, persistent memory, or more than five agents. For this, manual wiring stays readable.

## Run it

```bash
git clone <repo>
cd captain-cool
npm install
echo "GEMINI_API_KEY=your_key" > .env.local
npm run dev
```

Open `http://localhost:3000`, hit **Load Demo Scenario**, click **Ask the Captain**, and watch three Gemini agents argue.

## Final word

A single LLM in four hats is a chatbot. Three agents with three different prompts, three different tools, and the freedom to disagree — *that's* agentic. The debate isn't decoration. It's where the cricket happens.

Built on Gemini.
