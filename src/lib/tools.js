import { playerStats } from "./playerStats";

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
