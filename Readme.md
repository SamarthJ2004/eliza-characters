//request format

{
    "text": "Topic of the debate",
    "userId": "user123",
    "characters": ["eliza", "trump"],  // Add characters array for initialization
    "context": null
}

{
    "text": "Optional additional context",
    "userId": "user123",
    "context": {
        "debateId": "1707312456789",
        "lastCharacter": "trump",
        "characters": ["eliza", "trump"]  // Keep track of characters in context
    }
}

//response format

{
    "messages": [
        {
            "text": "Character's response",
            "type": "text"
        }
    ],
    "context": {
        "debateId": "1707312456789",
        "lastCharacter": "eliza",
        "characters": ["eliza", "trump"]  // Return characters array in context
    }
}

//cli
npm start
start a  new terminal window
npm run debate -- --characters=eliza.character.json,trump.character.json

//docker commands
docker build -t image_name .
