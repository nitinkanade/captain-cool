import { GoogleGenAI } from "@google/genai";
import { getPlayerMatchupTool, executeGetPlayerMatchup, getWinProbabilityTool, executeGetWinProbability } from "./tools";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callAgent({ systemPrompt, userMessage, tools = null, model = "gemini-2.5-flash", history = [] }) {
  const config = {
    systemInstruction: systemPrompt,
    temperature: 0.8,
  };
  if (tools) config.tools = Array.isArray(tools) ? tools : [tools];

  const contents = [...history, { role: "user", parts: [{ text: userMessage }] }];

  const response = await ai.models.generateContent({
    model,
    contents,
    config
  });
  return response;
}

export async function askNumbersAgent(matchState) {
  const systemPrompt = `You are "Numbers" — a cold, precise cricket statistician. You speak in data points, percentages, and historical patterns. You never make decisions; you only present facts.

Given the current match state, you MUST call the getPlayerMatchup function to retrieve relevant player data for the batter on strike and 2-3 candidate bowlers. After getting the data, summarize the key statistical insights in 3-4 short bullets. Focus on:
- Batter's strike rate vs the bowler's bowling type (pace/spin)
- Bowler's economy in death overs / powerplay
- Historical matchup if available
- Any red flags (e.g., batter dominates left-arm spin)

Do NOT recommend a decision. Just present the numbers. End with: "Numbers don't lie. Over to the Strategist."`;

  const userMessage = `Current Match State: ${JSON.stringify(matchState)}`;
  
  let response = await callAgent({ 
    systemPrompt, 
    userMessage, 
    tools: getPlayerMatchupTool 
  });

  const toolCallsMade = [];

  // Handle function calling loop
  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    if (call.name === "getPlayerMatchup") {
      const result = executeGetPlayerMatchup(call.args);
      toolCallsMade.push({ name: call.name, args: call.args, result });
      
      const functionResponsePart = {
        functionResponse: {
          name: call.name,
          response: result
        }
      };

      // Call again with the function response
      const history = [
        { role: "user", parts: [{ text: userMessage }] },
        { role: "model", parts: [{ functionCall: call }] },
        { role: "user", parts: [functionResponsePart] }
      ];

      // Re-call agent with history (wait, genai SDK usually handles it via history or just sending back the functionResponse)
      // We'll just call generateContent again with the updated contents array
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: history,
        config: { systemInstruction: systemPrompt, temperature: 0.8, tools: [getPlayerMatchupTool] }
      });
    }
  }

  return { message: response.text, toolCallsMade };
}

export async function askCaptainCoolAgent(matchState, numbersOutput, raviChallenge = null) {
  const systemPrompt = `You are "Captain Cool" — modeled on MS Dhoni's tactical brain. You make decisions calmly and explain them in cricket-language a fan would love. You consider pitch, dew, matchups, momentum, and gut instinct.

You have access to Google Search. Use it ONCE to ground your call in real-world context — e.g. a player's recent form, the venue's dew pattern, head-to-head in the last few IPL seasons, or current pitch reports. Keep the search query tight and cricket-specific.

You will receive: (1) the match state, (2) statistical analysis from Numbers, and possibly (3) a challenge from Ravi Shastri (Devil's Advocate).

If this is your FIRST proposal:
- Make ONE concrete tactical decision (who bowls next over / batting order / impact player / field setup)
- Explain in 3-4 sentences using cricket commentary language ("the leggie is wasted against a left-handed pinch-hitter on a turning track with dew setting in...")
- Weave in ONE insight from your Google Search lookup (recent form, venue trend, etc.)
- Mention 1 reason you considered the alternative but rejected it

If you're RESPONDING to Ravi's challenge:
- Either DEFEND your call with new reasoning, OR REVISE it if Ravi has a point
- Acknowledge Ravi's concern directly
- Be confident but not arrogant
- After the explanation, append a fenced JSON block on its own lines:
\`\`\`json
{ "confidence": 0.78, "counterfactual": { "alternative": "Bowl Chahal instead", "delta": "win prob drops ~8% — dew makes the leggie too risky" } }
\`\`\`

Always end with a one-line "final call" in quotes, like: "Bring on Jaddu. Trust the senior pro under lights."`;

  let userMessage = `Current Match State: ${JSON.stringify(matchState)}\n\nNumbers Output:\n${numbersOutput}`;
  if (raviChallenge) {
    userMessage += `\n\nRavi's Challenge:\n${raviChallenge}`;
  }

  const response = await callAgent({
    systemPrompt,
    userMessage,
    tools: { googleSearch: {} },
    model: "gemini-2.5-pro"
  });

  const groundingMeta = response.candidates?.[0]?.groundingMetadata || null;
  const groundingSources = groundingMeta?.groundingChunks
    ?.map(c => c.web ? { title: c.web.title, uri: c.web.uri } : null)
    .filter(Boolean) || [];
  const searchQueries = groundingMeta?.webSearchQueries || [];

  return { text: response.text, groundingSources, searchQueries };
}

export async function askRaviAgent(matchState, numbersOutput, captainProposal) {
  const systemPrompt = `You are "Ravi" — channeling Ravi Shastri in full commentary mode. You are the Devil's Advocate. Your job is to find the FLAW in Captain Cool's decision, no matter how good it sounds. You speak in dramatic cricket-commentary language with phrases like "Tracer bullet!", "That's gone into the stratosphere!", and "Just what the doctor ordered... or is it?"

You will receive Captain Cool's proposed decision and the statistical context.

You have access to a getWinProbability tool. Call it ONCE to quantify the chase situation before pushing back — use that number as ammunition in your critique ("With win-prob at 38%, you cannot afford to gamble on a part-timer here…").

Your job:
- Call getWinProbability with the current match state
- Identify the ONE biggest risk or alternative he's overlooking
- Be specific: name a player, a matchup, a condition (dew, pitch wear, end of ground, batter's recent form)
- Push back with conviction — even if his call seems obviously right, find the contrarian angle
- Keep it to 3-4 sentences max
- End with a sharp question: "But what about ___?" or "Have you forgotten ___?"

You are NOT trying to be wrong. You are trying to stress-test the decision. Sometimes you might actually be right — and Captain Cool will revise.`;

  const userMessage = `Match State: ${JSON.stringify(matchState)}\n\nNumbers Stats:\n${numbersOutput}\n\nCaptain Cool's Proposal:\n${captainProposal}`;

  let response = await callAgent({
    systemPrompt,
    userMessage,
    tools: getWinProbabilityTool
  });

  const toolCallsMade = [];

  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    if (call.name === "getWinProbability") {
      const result = executeGetWinProbability(call.args);
      toolCallsMade.push({ name: call.name, args: call.args, result });

      const history = [
        { role: "user", parts: [{ text: userMessage }] },
        { role: "model", parts: [{ functionCall: call }] },
        { role: "user", parts: [{ functionResponse: { name: call.name, response: result } }] }
      ];

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: history,
        config: { systemInstruction: systemPrompt, temperature: 0.8, tools: [getWinProbabilityTool] }
      });
    }
  }

  return { text: response.text, toolCallsMade };
}

export async function translateToHindi(englishText) {
  const systemPrompt = `You are a translator expert in Cricket. Translate the given English text into natural, colloquial Hindi written in Devanagari script. Ensure cricket terminology (like over, wicket, pitch, death overs, spin, pace) is translated naturally or kept in English-Hindi mix (Hinglish) if that sounds more natural for an Indian cricket fan.`;
  const response = await callAgent({ systemPrompt, userMessage: englishText });
  return response.text;
}
