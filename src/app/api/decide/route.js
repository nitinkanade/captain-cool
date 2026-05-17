import { askNumbersAgent, askCaptainCoolAgent, askRaviAgent } from "@/lib/agents";

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
    debate.push({
      agent: "captain",
      emoji: "🧢",
      message: finalDecision,
      isFinal: true,
      name: "Captain Cool"
    });

    // Extract the one-line final call for the voice output if possible (it's in quotes usually)
    const finalCallMatch = finalDecision.match(/"([^"]+)"$/);
    const finalCallText = finalCallMatch ? finalCallMatch[1] : finalDecision.split('\n').pop();

    return Response.json({
      debate,
      finalDecision: finalCallText
    });
  } catch (error) {
    console.error("Error in decide route:", error);
    return Response.json({ error: "Failed to generate debate" }, { status: 500 });
  }
}
