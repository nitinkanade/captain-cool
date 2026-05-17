# Captain Cool 🏏 - AI Cricket Brain Trust

Captain Cool is a multi-agent AI system powered by Google Gemini that acts as a virtual IPL cricket captain. It debates match states using three distinct AI agents and provides tactical decisions.

## Agents

1. **Numbers (Stats Analyst):** A data-driven agent that fetches real player stats via Gemini Function Calling.
2. **Captain Cool (Strategist):** Modeled on MS Dhoni, makes the call based on stats and match state.
3. **Ravi Shastri (Devil's Advocate):** Finds the flaw in Captain Cool's reasoning, challenging the decision.

## Setup Instructions

1. Clone the repository and run \`npm install\`.
2. Get a Google Gemini API Key.
3. Create a \`.env.local\` file in the root directory and add:
   \`\`\`
   GEMINI_API_KEY=your_key_here
   \`\`\`
4. Run \`npm run dev\` and open \`http://localhost:3000\`.

## Demo Scenario

Click the **Load Demo Scenario** button in the app to pre-fill the form with a high-stakes match situation.

**Scenario:**
- 2nd innings, Over 16, Ball 0
- CSK chasing 192 vs MI
- Score: 148/4
- Need 44 off 24
- Batter on strike: Ravindra Jadeja
- Bowlers remaining: Bumrah (1), Hardik (2), Chahal (2)
- Pitch: two-paced, Dew: 7/10
- Venue: Wankhede
- Impact Player: Available (Mustafizur)

Click **Ask the Captain 🧠** and watch the agents debate!

## Screenshot
![Screenshot of Captain Cool AI](public/screenshot.png)
