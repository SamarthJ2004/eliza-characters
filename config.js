import { ModelProviderName, settings } from "@elizaos/core";
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getTokenForProvider(provider) {
  // First check for Autonome's API key
  if (process.env.API_KEY) {
    return process.env.API_KEY;  // This is what Autonome will provide
  }

  // Fallback to other sources
  switch (provider) {
    case 'groq':
      return process.env.GROQ_API_KEY;
    
    case 'llama_local':
      return 'local';
    
    default:
      return null;
  }
}

export function loadEnvironment() {
  // Load from .env file
  dotenv.config();

  // Set embedding settings
  process.env.USE_OPENAI_EMBEDDING_TYPE =
    process.env.USE_OPENAI_EMBEDDING_TYPE || "local";
  process.env.USE_OLLAMA_EMBEDDING_TYPE =
    process.env.USE_OLLAMA_EMBEDDING_TYPE || "local";
  process.env.OLLAMA_EMBEDDING_MODEL =
    process.env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large";

  // Log settings
  console.log("Environment Settings:");
  console.log(
    "  USE_OPENAI_EMBEDDING_TYPE:",
    process.env.USE_OPENAI_EMBEDDING_TYPE
  );
  console.log(
    "  USE_OLLAMA_EMBEDDING_TYPE:",
    process.env.USE_OLLAMA_EMBEDDING_TYPE
  );
  console.log("  OLLAMA_EMBEDDING_MODEL:", process.env.OLLAMA_EMBEDDING_MODEL);
}

export function initializeSettings() {
  loadEnvironment();

  // Set up default settings
  settings.SERVER_PORT = process.env.SERVER_PORT || "3000";
  settings.GROQ_API_KEY = process.env.GROQ_API_KEY;
  settings.USE_OPENAI_EMBEDDING_TYPE = process.env.USE_OPENAI_EMBEDDING_TYPE;
  settings.USE_OLLAMA_EMBEDDING_TYPE = process.env.USE_OLLAMA_EMBEDDING_TYPE;
  settings.OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL;

  console.log("Starting application...");
  console.log("GROQ_API_KEY is", process.env.GROQ_API_KEY ? "set" : "not set");
  console.log("GROQ_API_KEY length:", process.env.GROQ_API_KEY?.length);
}

export function parseArguments() {
  try {
    return yargs(process.argv.slice(2))
      .option("character", {
        type: "string",
        description: "Path to the character JSON file",
      })
      .option("characters", {
        type: "string",
        description: "Comma separated list of paths to character JSON files",
      })
      .parseSync();
  } catch (error) {
    console.error("Error parsing arguments:", error);
    return {};
  }
}

// Utility functions for character management
export function validateCharacterPath(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Character file not found: ${filePath}`);
  }
  if (!filePath.endsWith(".json")) {
    throw new Error(`Character file must be JSON: ${filePath}`);
  }
}

export function loadCharacterSync(filePath) {
  validateCharacterPath(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const character = JSON.parse(content);
  // validateCharacterConfig(character);
  return character;
}

export async function loadCharacters(charactersArg) {
  let characterPaths = charactersArg?.split(",").map((filePath) => {
    if (path.basename(filePath) === filePath) {
      filePath = path.join(__dirname, "characters", filePath);
    }
    return path.resolve(process.cwd(), filePath.trim());
  });

  const loadedCharacters = [];

  if (characterPaths?.length > 0) {
    for (const characterPath of characterPaths) {
      try {
        const content = fs.readFileSync(characterPath, "utf8");
        const character = JSON.parse(content);
        loadedCharacters.push(character);
      } catch (e) {
        console.error(`Error loading character from ${characterPath}: ${e}`);
        process.exit(1);
      }
    }
  }

  return loadedCharacters;
}

// export function getTokenForProvider(provider, character) {
//   dotenv.config();
//   switch (provider) {
//     case ModelProviderName.OPENAI:
//       return (
//         character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY
//       );

//     case ModelProviderName.LLAMACLOUD:
//       return (
//         character.settings?.secrets?.LLAMACLOUD_API_KEY ||
//         settings.LLAMACLOUD_API_KEY ||
//         character.settings?.secrets?.TOGETHER_API_KEY ||
//         settings.TOGETHER_API_KEY ||
//         character.settings?.secrets?.XAI_API_KEY ||
//         settings.XAI_API_KEY ||
//         character.settings?.secrets?.OPENAI_API_KEY ||
//         settings.OPENAI_API_KEY
//       );

//     case ModelProviderName.ANTHROPIC:
//       return (
//         character.settings?.secrets?.ANTHROPIC_API_KEY ||
//         character.settings?.secrets?.CLAUDE_API_KEY ||
//         settings.ANTHROPIC_API_KEY ||
//         settings.CLAUDE_API_KEY
//       );

//     case ModelProviderName.REDPILL:
//       return (
//         character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY
//       );

//     case ModelProviderName.OPENROUTER:
//       return (
//         character.settings?.secrets?.OPENROUTER || settings.OPENROUTER_API_KEY
//       );

//     case ModelProviderName.GROQ:
//       return process.env.GROQ_API_KEY || settings.GROQ_API_KEY;

//     case ModelProviderName.HEURIST:
//       return (
//         character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY
//       );

//     case ModelProviderName.LLAMALOCAL:
//       return "local"; // No token needed for local Llama

//     default:
//       return null;
//   }
// }

export async function generateModelResponse(prompt, character) {
  const token = getTokenForProvider(character.modelProvider);
  console.log("token: ", token);

  switch (character.modelProvider) {
    case ModelProviderName.GROQ:
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
            temperature: 0.8,
            max_tokens: 400,
          }),
        }
      );
      const data = await response.json();
      console.log("data:", data);
      return data.choices[0].message.content;

    // case ModelProviderName.LLAMA_LOCAL:
    //   const llamaResponse = await fetch("http://localhost:11434/api/generate", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       model: "llama2",
    //       prompt,
    //       stream: false,
    //     }),
    //   });
    //   const llamaData = await llamaResponse.json();
    //   return llamaData.response;

    // Add other model providers as needed
    default:
      throw new Error(`Unsupported model provider: ${character.modelProvider}`);
  }
}

// Export additional constants
export const DEFAULT_CHARACTER_PATH = path.join(__dirname, "characters");
export const SUPPORTED_PROVIDERS = Object.values(ModelProviderName);
