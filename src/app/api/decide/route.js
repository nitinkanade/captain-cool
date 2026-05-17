import { askNumbersAgent, askCaptainCoolAgent, askRaviAgent, translateToHindi } from "@/lib/agents";

export async function POST(request) {
  try {
    const matchState = await request.json();

    const debate = [];

    // 1. Numbers Agent
    const numbersResponse = await askNumbersAgent(matchState);
    debate.push({
      agent: "numbers",
      emoji: "📊",
      message: numbersResponse.message,
      toolCallsMade: numbersResponse.toolCallsMade,
      name: "Numbers"
    });

    // 2. Captain Cool's first proposal (with Google Search grounding)
    const captainProposal = await askCaptainCoolAgent(matchState, numbersResponse.message);
    debate.push({
      agent: "captain",
      emoji: "🧢",
      message: captainProposal.text,
      isProposal: true,
      name: "Captain Cool",
      groundingSources: captainProposal.groundingSources,
      searchQueries: captainProposal.searchQueries
    });

    // 3. Ravi challenges the proposal (with win-probability tool)
    const raviChallenge = await askRaviAgent(matchState, numbersResponse.message, captainProposal.text);
    debate.push({
      agent: "ravi",
      emoji: "🎙️",
      message: raviChallenge.text,
      toolCallsMade: raviChallenge.toolCallsMade,
      name: "Ravi Shastri"
    });

    // 4. Captain Cool makes final decision (also grounded)
    const finalDecision = await askCaptainCoolAgent(matchState, numbersResponse.message, raviChallenge.text);
    const rawFinal = finalDecision.text;

    // Extract confidence + counterfactual JSON block (if present), strip from display text
    let confidence = null;
    let counterfactual = null;
    const jsonBlockMatch = rawFinal.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        confidence = parsed.confidence ?? null;
        counterfactual = parsed.counterfactual ?? null;
      } catch (e) {
        console.warn("Could not parse confidence JSON block:", e.message);
      }
    }
    const finalDecisionText = rawFinal.replace(/```json[\s\S]*?```/g, "").trim();

    // 5. Translate final decision to Hindi
    const finalDecisionHindi = await translateToHindi(finalDecisionText);

    debate.push({
      agent: "captain",
      emoji: "🧢",
      message: finalDecisionText,
      messageHindi: finalDecisionHindi,
      isFinal: true,
      name: "Captain Cool",
      groundingSources: finalDecision.groundingSources,
      searchQueries: finalDecision.searchQueries,
      confidence,
      counterfactual
    });

    // Extract the one-line final call for the voice output if possible (it's in quotes usually)
    const finalCallMatch = finalDecisionText.match(/"([^"]+)"$/);
    const finalCallText = finalCallMatch ? finalCallMatch[1] : finalDecisionText.split('\n').pop();

    const finalCallHindiMatch = finalDecisionHindi.match(/"([^"]+)"$/);
    const finalCallTextHindi = finalCallHindiMatch ? finalCallHindiMatch[1] : finalDecisionHindi.split('\n').pop();

    return Response.json({
      debate,
      finalDecision: finalCallText,
      finalDecisionHindi: finalCallTextHindi
    });
  } catch (error) {
    console.error("Error in decide route:", error);
    const errorMessage = error.message || String(error);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
