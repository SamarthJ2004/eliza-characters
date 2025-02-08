// battleEvaluation.js
import { loadCharacters, generateModelResponse } from "./config.js";

function constructJudgingPrompt(battleData, elizaCharacter) {
  const rounds = battleData.messages;
  const contestants = [...new Set(rounds.map((r) => r.character))];
  const [contestant1, contestant2] = contestants;

  return `
You are ${
    elizaCharacter.name
  }, the Technical Roast Battle Analyst. Evaluate this battle using the following structured format.

BATTLE INFORMATION:
Topic: ${battleData.topic}
Contestants: ${contestants.join(" vs ")}
Rounds: ${rounds.length}

BATTLE TRANSCRIPT:
${rounds
  .map(
    (msg, index) =>
      `Round ${Math.floor(index / 2) + 1}: ${msg.character}: ${msg.content}`
  )
  .join("\n\n")}

Evaluate this battle using this EXACT format - don't deviate from it:

=== TECHNICAL ANALYSIS ===
[Brief overall battle assessment, 2-3 sentences maximum]

=== CONTESTANT SCORECARDS ===

${contestant1} SCORECARD:
• Character Authenticity: [1-10]/10
[One sentence justification]
• Roast Quality: [1-10]/10
[One sentence justification]
• Battle Flow: [1-10]/10
[One sentence justification]
Total Score: [Sum]/30

${contestant2} SCORECARD:
• Character Authenticity: [1-10]/10
[One sentence justification]
• Roast Quality: [1-10]/10
[One sentence justification]
• Battle Flow: [1-10]/10
[One sentence justification]
Total Score: [Sum]/30

=== BATTLE HIGHLIGHTS ===
${contestant1}'s Best Burn: "[Quote the best roast]"
${contestant2}'s Best Burn: "[Quote the best roast]"
Best Callback: "[Quote the best callback]"

=== WINNER DECLARATION ===
Winner: [Contestant Name]
Victory Margin: [Point difference]
Winning Factor: [One sentence explaining the decisive factor]

=== FINAL REMARKS ===
${contestant1}: [One sentence specific feedback]
${contestant2}: [One sentence specific feedback]

Remember:
1. Use numerical scores (1-10)
2. Calculate totals accurately
3. MUST declare explicit winner based on highest total score
4. Keep justifications concise
5. Stay in Eliza's technical analyst persona`;
}

async function parseEvaluation(evaluation) {
  try {
    // Extract scores
    const authenticityScores = evaluation
      .match(/Character Authenticity: (\d+)\/10/g)
      .map((match) => parseInt(match.match(/\d+/)[0]));
    const roastScores = evaluation
      .match(/Roast Quality: (\d+)\/10/g)
      .map((match) => parseInt(match.match(/\d+/)[0]));
    const flowScores = evaluation
      .match(/Battle Flow: (\d+)\/10/g)
      .map((match) => parseInt(match.match(/\d+/)[0]));

    // Extract winner
    const winnerMatch = evaluation.match(/Winner: ([^\n]+)/);
    const winner = winnerMatch ? winnerMatch[1].trim() : null;

    // Extract margin
    const marginMatch = evaluation.match(/Victory Margin: ([^\n]+)/);
    const margin = marginMatch ? marginMatch[1].trim() : null;

    return {
      scores: {
        contestant1: {
          authenticity: authenticityScores[0],
          roastQuality: roastScores[0],
          battleFlow: flowScores[0],
          total: authenticityScores[0] + roastScores[0] + flowScores[0],
        },
        contestant2: {
          authenticity: authenticityScores[1],
          roastQuality: roastScores[1],
          battleFlow: flowScores[1],
          total: authenticityScores[1] + roastScores[1] + flowScores[1],
        },
      },
      winner: winner,
      margin: margin,
      rawEvaluation: evaluation,
    };
  } catch (error) {
    console.error("Error parsing evaluation:", error);
    return null;
  }
}

async function evaluateBattle(debateId, memoryCache) {
  try {
    const debateData = await memoryCache.get(`debate:${debateId}`);
    if (!debateData) {
      throw new Error("Battle not found");
    }

    const battle = JSON.parse(debateData);
    const elizaCharacter = await loadCharacters("eliza.character.json");
    const evaluationPrompt = constructJudgingPrompt(battle, elizaCharacter[0]);
    const evaluation = await generateModelResponse(
      evaluationPrompt,
      elizaCharacter[0]
    );

    // Parse the evaluation
    const parsedEvaluation = await parseEvaluation(evaluation);

    // Store both raw and parsed evaluation
    battle.evaluation = evaluation;
    battle.parsedEvaluation = parsedEvaluation;
    battle.status = "completed";
    battle.winner = parsedEvaluation.winner;

    await memoryCache.set(`debate:${debateId}`, JSON.stringify(battle));

    return evaluation;
  } catch (error) {
    console.error("Error evaluating battle:", error);
    throw error;
  }
}

export { evaluateBattle };
