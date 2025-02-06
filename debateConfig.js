import { loadCharacters, getTokenForProvider } from "./config.js";

export async function initializeDebateConfig(characterFiles, topic) {
  const characters = await loadCharacters(characterFiles);

  characters.forEach((character) => {
    const token = getTokenForProvider(character.modelProvider, character);

    if (!token) {
      throw new Error(
        `No API key found for ${character.name}'s model provider: ${character.modelProvider}`
      );
    }
  });

  return { characters, topic };
}

export async function generateResponse(prompt, character) {
  const token = getTokenForProvider(character.modelProvider, character);

  switch (character.modelProvider) {
    case "groq":
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        }
      );

      const data = await response.json();
      return data.choices[0].message.content;

    case "llama_local":
      const llamaResponse = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama2",
          prompt,
          stream: false,
        }),
      });

      const llamaData = await llamaResponse.json();
      return llamaData.response;

    default:
      throw new Error(`Unsupported model provider: ${character.modelProvider}`);
  }
}

export function constructDebatePrompt(character, topic, context) {
  return `
You are ${character.name}. 
${character.system}

Character Bio:
${character.bio.join("\n")}

Style Guidelines:
${character.style.all.join("\n")}
${character.style.chat.join("\n")}

Current Topic: ${topic}
Previous Context: ${context
    .map((msg) => `${msg.character}: ${msg.content}`)
    .join("\n")}

Generate a response in character:`;
}
