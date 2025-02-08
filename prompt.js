export function constructBattlePrompt (character, opponent, topic, context, timeRemaining) {
  // Get battle persona and style elements
  const battlePersona = character.battlePersona || "Battle Challenger";
  const battleStyle = character.battleStyle || {};
  const signatureMoves = battleStyle.signature_elements || {};
  const timeLeft = Math.floor(timeRemaining / 1000); // Convert to seconds

  // Get response patterns
  const responsePatterns = character.responsePatterns || {};
  const standardResponses = responsePatterns.standard_topics || [];
  const comebacks = responsePatterns.signature_comebacks || {};

  const isEndGame = timeLeft <= 30;

  // Get core identity
  const identity =
    character.core_identity?.bio?.join("\n") || character.bio?.join("\n");

  // Format previous exchanges
  const previousExchanges = context
    .map((msg, index) => {
      const roundNum = Math.floor(index / 2) + 1;
      return `Round ${roundNum}: ${msg.character}: ${msg.content}`;
    })
    .join("\n\n");

  return `
# Character Roast Battle System
You are ${character.name} in a roast battle against ${opponent.name}.

## Your Battle Persona
${battlePersona}

## Your Core Identity and Achievements
${identity}

## Your Battle Style & Signature Moves
Formatting Rules:
${signatureMoves.formatting?.join("\n") || character.style.all.join("\n")}

Delivery Pattern:
${signatureMoves.delivery?.join("\n") || ""}

## Your Standard Roast Patterns
${standardResponses
  .map((response) => `- On ${response.topic}: ${response.roast}`)
  .join("\n")}

## Your Signature Comebacks
${Object.entries(comebacks)
  .map(([type, response]) => `- When attacked on ${type}: ${response}`)
  .join("\n")}

## Battle Context
Topic: ${topic}

Previous Exchanges:
${previousExchanges}

## Response Requirements:
1. Opening: Use your character-specific opening style
2. Main Roast: Deliver your core attack following your style elements
3. Callback: Reference a previous exchange if possible
4. Finish: End with your signature closer

## Style Requirements:
- Use your signature patterns (${character.name === 'Modi' ? 'Hindi-English mix, statistics' : 'CAPS, parentheses'})
- Stay completely in character
- Use your signature emphasis patterns
- Include your catchphrases and expressions
- Reference your achievements vs opponent's failures
- Use your character's typical formatting
- Include hashtags (#) relevant to your burns
- NO introductions or endings (no "Finally:", no "${character.name}:")
- Maximum 40 words
${isEndGame ? '- This is the FINAL PHASE - make it your most devastating roast yet!' : ''}

Previous Exchange:
${context.slice(-1)[0]?.content || 'No previous exchange'}

Generate your next roast maintaining complete character authenticity:`;
}

export function constructInitialMessage(debateId, characters, topic) {
  return {
    messages: [
      {
        text:
          `🔥 ROAST BATTLE INITIALIZED 🔥\n\n` +
          `Topic: ${topic}\n` +
          `Contestants: ${characters.join(" vs ")}\n` +
          `Duration: 3 minutes\n` +
          `Judge: Eliza\n\n` +
          `Battle Rules:\n` +
          `- Stay in character\n` +
          `- Keep responses under 4 lines\n` +
          `- Reference previous burns when possible\n` +
          `Let the roasting begin! 🎤\n\n` +
          `First up: ${characters[0]}!`,
        type: "text",
      },
    ],
    context: {
      debateId: debateId,
      lastCharacter: characters[1],
      characters: characters,
      timeRemaining: 3 * 60 * 1000, // 3 minutes in milliseconds
      status: "active",
    },
  };
}