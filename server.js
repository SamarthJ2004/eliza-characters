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

// Initialize debate
app.post("/debates/initialize", async (req, res) => {
  try {
    const { characterFiles, topic } = req.body;
    console.log("Initializing debate with:", { characterFiles, topic });

    const characters = await loadCharacters(characterFiles);
    console.log("characters length:", characters.length);
    const debateId = Date.now().toString();

    // Store debate data
    const debateData = {
      characters: characters.map((c) => c.name),
      topic,
      messages: [],
    };

    await memoryCache.set(`debate:${debateId}`, JSON.stringify(debateData));

    console.log("Debate initialized:", debateId);
    res.json({
      debateId,
      characters: characters.map((c) => ({
        id: c.name,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("Error initializing debate:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get response in debate
app.post("/debates/:debateId/response", async (req, res) => {
  try {
    const { debateId } = req.params;
    const { characterId, text } = req.body;
    console.log("req body :", req.body);
    console.log("Getting response for:", { debateId, characterId });

    const debateData = await memoryCache.get(`debate:${debateId}`);
    if (!debateData) {
      return res.status(404).json({ error: "Debate not found" });
    }

    const debate = JSON.parse(debateData);
    const path = characterId.toLowerCase() + ".character.json";
    const characters = await loadCharacters(path);
    const character = characters[0];

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    const prompt = `
You are ${character.name}.
Topic: ${debate.topic}
Previous messages: ${debate.messages
      .map((m) => `${m.character}: ${m.content}`)
      .join("\n")}
Generate your response:`;

    const response = await generateModelResponse(prompt, character);

    debate.messages.push({
      character: character.name,
      content: response,
    });

    await memoryCache.set(`debate:${debateId}`, JSON.stringify(debate));

    res.json({
      success: true,
      response,
      character: character.name,
    });
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: error.message });
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
