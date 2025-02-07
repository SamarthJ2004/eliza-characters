import express from "express";
import {
  loadCharacters,
  initializeSettings,
  generateModelResponse,
} from "./config.js";
import { CacheManager, DbCacheAdapter } from "@elizaos/core";
import { MemoryCache } from "./memoryCache.js";

const app = express();
app.use(express.json());

// Initialize memory cache
const memoryCache = new MemoryCache();
const cache = new CacheManager(new DbCacheAdapter(memoryCache, "debate"));

const PORT = process.env.PORT || 3000;

// Main chat endpoint for Autonome
app.post("/message", async (req, res) => {
  try {
    const { text, userId, context, characters: initialCharacters } = req.body;
    console.log("Received message:", {
      text,
      userId,
      context,
      initialCharacters,
    });

    let debateId = context?.debateId;
    let lastCharacter = context?.lastCharacter;
    let characters = context?.characters || initialCharacters;

    // Validate characters for new debate
    if (!debateId && (!characters || characters.length !== 2)) {
      throw new Error("Need exactly two characters to start a debate");
    }

    // If no debate exists, initialize one
    if (!debateId) {
      // Load the specified characters
      const loadedCharacters = await loadCharacters(
        characters.map((c) => `${c}.character.json`).join(",")
      );

      debateId = Date.now().toString();
      const debateData = {
        characters: loadedCharacters.map((c) => c.name),
        topic: text,
        messages: [],
      };

      await memoryCache.set(`debate:${debateId}`, JSON.stringify(debateData));
      lastCharacter = loadedCharacters[1].name.toLowerCase(); // Start with first character's response
    }

    // Get the next character (alternate between the two)
    const nextCharacter =
      lastCharacter === characters[0] ? characters[1] : characters[0];

    // Get response from the next character
    const debateData = await memoryCache.get(`debate:${debateId}`);
    if (!debateData) {
      throw new Error("Debate not found");
    }

    const debate = JSON.parse(debateData);
    const path = nextCharacter + ".character.json";
    const characterData = await loadCharacters(path);
    const character = characterData[0];

    const prompt = `
You are ${character.name}.
Topic: ${debate.topic}
Previous messages: ${debate.messages
      .map((m) => `${m.character}: ${m.content}`)
      .join("\n")}
You should be in roast mode trying to win the battle. Keep your language similar to what has been provided in your character sketch. Keep your responses short within 4 lines. Generate your response:`;

    const response = await generateModelResponse(prompt, character);

    debate.messages.push({
      character: character.name,
      content: response,
    });

    await memoryCache.set(`debate:${debateId}`, JSON.stringify(debate));

    // Return response in Autonome format
    res.json({
      messages: [
        {
          text: response,
          type: "text",
        },
      ],
      context: {
        debateId: debateId,
        lastCharacter: nextCharacter,
        characters: characters, // Include characters array in context
      },
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({
      messages: [
        {
          text: "Error: " + error.message,
          type: "text",
        },
      ],
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Initialize settings before starting server
initializeSettings();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
