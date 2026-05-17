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

    // 2. Captain Cool's first proposal
    const captainProposal = await askCaptainCoolAgent(matchState, numbersResponse.message);
    debate.push({
      agent: "captain",
      emoji: "🧢",
      message: captainProposal,
      isProposal: true,
      name: "Captain Cool"
    });

    // 3. Ravi challenges the proposal
    const raviChallenge = await askRaviAgent(matchState, numbersResponse.message, captainProposal);
    debate.push({
      agent: "ravi",
      emoji: "🎙️",
      message: raviChallenge,
      name: "Ravi Shastri"
    });

    // 4. Captain Cool makes final decision
    const finalDecision = await askCaptainCoolAgent(matchState, numbersResponse.message, raviChallenge);
    
    // 5. Translate final decision to Hindi
    const finalDecisionHindi = await translateToHindi(finalDecision);
    
    debate.push({
      agent: "captain",
      emoji: "🧢",
      message: finalDecision,
      messageHindi: finalDecisionHindi,
      isFinal: true,
      name: "Captain Cool"
    });

    // Extract the one-line final call for the voice output if possible (it's in quotes usually)
    const finalCallMatch = finalDecision.match(/"([^"]+)"$/);
    const finalCallText = finalCallMatch ? finalCallMatch[1] : finalDecision.split('\n').pop();
    
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
