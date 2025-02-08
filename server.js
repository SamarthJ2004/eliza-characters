import express from "express";
import {
  loadCharacters,
  initializeSettings,
  generateModelResponse,
} from "./config.js";
import { CacheManager, DbCacheAdapter } from "@elizaos/core";
import { MemoryCache } from "./memoryCache.js";
import { evaluateBattle } from "./battleEvaluation.js";
import { constructBattlePrompt, constructInitialMessage } from "./prompt.js";
import { analyzeResponse } from "./analyza.js";

const app = express();
app.use(express.json());

// Initialize memory cache
const memoryCache = new MemoryCache();
const cache = new CacheManager(new DbCacheAdapter(memoryCache, "debate"));

const PORT = process.env.PORT || 3000;
const BATTLE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

// Track battle timers
const battleTimers = new Map();

function startBattleTimer(debateId) {
  const timer = setTimeout(async () => {
    try {
      // Get battle evaluation from Eliza
      const evaluation = await evaluateBattle(debateId, memoryCache);

      // Store evaluation result
      const debateData = await memoryCache.get(`debate:${debateId}`);
      if (debateData) {
        const debate = JSON.parse(debateData);
        debate.status = "completed";
        debate.evaluation = evaluation;
        await memoryCache.set(`debate:${debateId}`, JSON.stringify(debate));
      }

      // Cleanup timer
      battleTimers.delete(debateId);
    } catch (error) {
      console.error(`Error evaluating battle ${debateId}:`, error);
    }
  }, BATTLE_DURATION);

  battleTimers.set(debateId, timer);
}

// Main chat endpoint for Autonome
app.post("/message", async (req, res) => {
  try {
    const { text, userId, context, characters: initialCharacters } = req.body;
    let debateId = context?.debateId;
    let lastCharacter = context?.lastCharacter;
    let characters = context?.characters || initialCharacters;

    // Check if this is a new battle
    if (!debateId) {
      if (!characters || characters.length !== 2) {
        throw new Error("Need exactly two characters to start a roast battle");
      }

      const loadedCharacters = await loadCharacters(
        characters.map((c) => `${c}.character.json`).join(",") // Changed to .json
      );

      debateId = Date.now().toString();
      const debateData = {
        characters: loadedCharacters.map((c) => c.name),
        topic: text,
        messages: [],
        startTime: Date.now(),
        status: "active",
      };

      await memoryCache.set(`debate:${debateId}`, JSON.stringify(debateData));
      lastCharacter = loadedCharacters[1].name.toLowerCase();

      // Start battle timer
      startBattleTimer(debateId);

      return res.json(constructInitialMessage(debateId, characters, text));
    }

    // Check if battle is still active
    const debateData = await memoryCache.get(`debate:${debateId}`);
    if (!debateData) {
      throw new Error("Battle not found");
    }

    const debate = JSON.parse(debateData);
    if (debate.status === "completed") {
      return res.json({
        messages: [
          {
            text:
              "Battle has ended! Here's Eliza's evaluation:\n\n" +
              debate.evaluation,
            type: "text",
          },
        ],
      });
    }

    // Process the roast exchange
    const nextCharacter =
      lastCharacter === characters[0] ? characters[1] : characters[0];
    const opponent =
      lastCharacter === characters[0] ? characters[0] : characters[1];

    // Load both character files
    const [characterData, opponentData] = await Promise.all([
      loadCharacters(`${nextCharacter}.character.json`), // Changed to .json
      loadCharacters(`${opponent}.character.json`), // Changed to .json
    ]);

    const character = characterData[0];
    const opponentChar = opponentData[0];
    const timeRemaining = BATTLE_DURATION - (Date.now() - debate.startTime);

    const prompt = constructBattlePrompt(
      character,
      opponentChar,
      debate.topic,
      debate.messages,
      timeRemaining
    );

    const response = await generateModelResponse(prompt, character);

    // Analyze response quality
    const analysis = analyzeResponse(response, character, opponentChar);

    // Add message with analysis
    debate.messages.push({
      character: character.name,
      content: response,
      timestamp: Date.now(),
      analysis: analysis,
    });

    await memoryCache.set(`debate:${debateId}`, JSON.stringify(debate));

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
        characters: characters,
        timeRemaining: BATTLE_DURATION - (Date.now() - debate.startTime),
        analysis: analysis, // Include analysis in response
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

// Get battle evaluation endpoint
app.get("/battles/:debateId/evaluation", async (req, res) => {
  try {
    const { debateId } = req.params;
    const debateData = await memoryCache.get(`debate:${debateId}`);

    if (!debateData) {
      return res.status(404).json({ error: "Battle not found" });
    }

    const debate = JSON.parse(debateData);

    if (debate.status !== "completed") {
      return res.status(400).json({
        error: "Battle is still in progress",
        timeRemaining: BATTLE_DURATION - (Date.now() - debate.startTime),
      });
    }

    res.json({ evaluation: debate.evaluation });
  } catch (error) {
    console.error("Error getting evaluation:", error);
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
