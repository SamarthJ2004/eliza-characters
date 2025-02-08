function analyzeResponse(response, character, opponent) {
  // Check style elements usage
  const styleCheck = validateCharacterStyle(response, character);

  // Check response structure
  const structureCheck = {
    hasOpening: checkOpening(response, character, opponent),
    hasMainRoast: checkMainRoast(response),
    hasSignatureStyle: checkSignatureStyle(response, character),
    isProperLength: checkLength(response),
  };

  // Get overall quality score
  const overallQuality =
    Object.values(structureCheck).every((v) => v) && styleCheck.isValid;

  return {
    styleCheck,
    structureCheck,
    overallQuality,
  };
}

// Helper functions
function validateCharacterStyle(response, character) {
  const styleElements = character.style?.all || [];
  const signature_elements =
    character.battleStyle?.signature_elements?.formatting || [];
  const allStyleElements = [...styleElements, ...signature_elements];

  const usedElements = allStyleElements.filter((element) => {
    const elementLower = element.toLowerCase();
    const responseLower = response.toLowerCase();
    return responseLower.includes(elementLower.replace(/[^\w\s]/g, ""));
  });

  return {
    isValid: usedElements.length > 0,
    usedElements,
  };
}

function checkOpening(response, character, opponent) {
  const firstLine = response.split("\n")[0] || "";

  // Check for character-specific openings
  if (character.name.toLowerCase() === "modi" && firstLine.includes("Mitron")) {
    return true;
  }
  if (
    character.name.toLowerCase() === "trump" &&
    (firstLine.includes("Listen") || firstLine.includes("Folks"))
  ) {
    return true;
  }

  // Check for opponent mention
  return firstLine.includes(opponent.name);
}

function checkMainRoast(response) {
  // Main roast should be substantial (at least 50 characters)
  const mainContent = response.split("\n").slice(1, -1).join("\n");
  return mainContent.length >= 50;
}

function checkSignatureStyle(response, character) {
  // Check for character-specific signature styles
  if (character.name.toLowerCase() === "modi") {
    return (
      response.includes("Modi ki Guarantee") ||
      response.includes("Mitron") ||
      (response.match(/[A-Z]{2,}/g) || []).length >= 2
    ); // CAPS usage
  }
  if (character.name.toLowerCase() === "trump") {
    return (
      (response.match(/[A-Z]{2,}/g) || []).length >= 3 || // Heavy CAPS usage
      response.includes("(") || // Parentheticals
      response.includes("MAGA")
    ); // Signature phrase
  }
  return false;
}

function checkLength(response) {
  // Check if response is within 4 lines
  const lines = response.split("\n").filter((line) => line.trim().length > 0);
  return lines.length <= 4;
}

// Export if in separate file
export { analyzeResponse };