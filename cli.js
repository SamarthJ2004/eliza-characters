// cli.js
import readline from "readline";
import { parseArguments, initializeSettings } from "./config.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SERVER_URL = "http://localhost:3000";

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function startDebate(characterFiles, topic) {
  try {
    // Check server status
    const isServerRunning = await checkServer();
    if (!isServerRunning) {
      throw new Error(
        "Server is not running. Please start the server first with: npm start"
      );
    }

    console.log("Initializing debate...");
    const response = await fetch(`${SERVER_URL}/debates/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterFiles, topic }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initialize debate");
    }

    const { debateId, characters } = await response.json();
    console.log("Debate initialized with ID:", debateId);
    console.log("Characters:", characters.map((c) => c.name).join(", "));

    return { debateId, characters };
  } catch (error) {
    if (error.cause?.code === "UND_ERR_SOCKET") {
      console.error(
        "Error: Could not connect to server. Please make sure the server is running (npm start)"
      );
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

async function getResponse(debateId, character) {
  try {
    console.log(`Getting response from ${character.name}...`);
    console.log("Sending character data:", {
      name: character.name,
      filePath: character.id, // This is actually the filePath from the server
    });
    const response = await fetch(`${SERVER_URL}/debates/${debateId}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: character.id,
        text: "",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get response");
    }

    const data = await response.json();
    console.log(`${character.name}: ${data.response}`);
    return data;
  } catch (error) {
    console.error("Error getting response:", error.message);
    return null;
  }
}

async function main() {
  initializeSettings();

  const args = parseArguments();

  if (!args.characters) {
    console.error("Please provide character files using --characters");
    process.exit(1);
  }

  rl.question("Enter debate topic: ", async (topic) => {
    const { debateId, characters } = await startDebate(args.characters, topic);
    let currentCharacterIndex = 0;

    async function nextResponse() {
      const character = characters[currentCharacterIndex];
      console.log("char: ",character.id);
      const response = await getResponse(debateId, character);

      if (!response) {
        console.log("Ending debate due to error");
        rl.close();
        process.exit(1);
      }

      currentCharacterIndex = (currentCharacterIndex + 1) % characters.length;

      rl.question(
        'Press Enter for next response or type "exit" to end: ',
        (answer) => {
          if (answer.toLowerCase() === "exit") {
            rl.close();
            process.exit(0);
          } else {
            nextResponse();
          }
        }
      );
    }

    nextResponse();
  });
}

main().catch(console.error);