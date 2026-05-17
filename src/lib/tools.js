import { playerStats } from "./playerStats";

export const getWinProbabilityTool = {
  functionDeclarations: [{
    name: "getWinProbability",
    description: "Estimates the batting team's win probability in a T20 chase based on current score, wickets, balls remaining, and target. Use this to stress-test the captain's call with a quantitative counterfactual.",
    parameters: {
      type: "object",
      properties: {
        currentScore: { type: "number", description: "Batting team's current runs" },
        wicketsLost: { type: "number", description: "Wickets fallen (0-10)" },
        ballsRemaining: { type: "number", description: "Balls left in the innings" },
        target: { type: "number", description: "Target the batting team is chasing" },
        pitchFactor: {
          type: "string",
          enum: ["batting-friendly", "neutral", "bowling-friendly"],
          description: "How the pitch is playing"
        }
      },
      required: ["currentScore", "wicketsLost", "ballsRemaining", "target"]
    }
  }]
};

export function executeGetWinProbability({ currentScore, wicketsLost, ballsRemaining, target, pitchFactor = "neutral" }) {
  const runsNeeded = target - currentScore;
  if (runsNeeded <= 0) return { winProbability: 1, summary: "Already won." };
  if (ballsRemaining <= 0) return { winProbability: 0, summary: "Innings over, target not chased." };
  if (wicketsLost >= 10) return { winProbability: 0, summary: "All out." };

  const rrr = (runsNeeded * 6) / ballsRemaining;
  const wicketsInHand = 10 - wicketsLost;

  // Heuristic: par RRR ~9 with 6+ wkts in hand on neutral pitch.
  // Penalize per-run-above-par-RRR and per-wicket-below-6.
  const pitchAdj = pitchFactor === "batting-friendly" ? +0.8 : pitchFactor === "bowling-friendly" ? -0.8 : 0;
  const wicketPenalty = Math.max(0, 6 - wicketsInHand) * 0.07;
  const rrrPenalty = Math.max(0, (rrr - 9 - pitchAdj)) * 0.06;
  let prob = 0.55 - wicketPenalty - rrrPenalty + (wicketsInHand >= 7 ? 0.1 : 0);
  prob = Math.max(0.02, Math.min(0.97, prob));

  return {
    winProbability: Number(prob.toFixed(2)),
    requiredRunRate: Number(rrr.toFixed(2)),
    wicketsInHand,
    summary: `Need ${runsNeeded} off ${ballsRemaining} balls @ RRR ${rrr.toFixed(2)} with ${wicketsInHand} wkts in hand. Pitch: ${pitchFactor}.`
  };
}

export const getPlayerMatchupTool = {
  functionDeclarations: [{
    name: "getPlayerMatchup",
    description: "Retrieves matchup statistics for a batter against specific bowling types, and bowler stats in specific phases. Use this whenever match decisions involve specific players.",
    parameters: {
      type: "object",
      properties: {
        batterName: { type: "string", description: "Name of the batter on strike" },
        bowlerNames: { 
          type: "array", 
          items: { type: "string" },
          description: "List of candidate bowler names to evaluate"
        },
        phase: { 
          type: "string", 
          enum: ["powerplay", "middle", "death"],
          description: "Current phase of the innings"
        }
      },
      required: ["batterName", "bowlerNames"]
    }
  }]
};

export function executeGetPlayerMatchup({ batterName, bowlerNames, phase }) {
  const batter = playerStats.batters[batterName] || null;
  const bowlers = bowlerNames.map(name => {
    return { name, stats: playerStats.bowlers[name] || null };
  });

  return {
    batter: batter ? { name: batterName, ...batter } : null,
    bowlers,
    phaseContext: phase || "unknown"
  };
}
