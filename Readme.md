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


//req and req schema
# chat_request_schema.json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "description": "Topic for debate or additional context"
    },
    "userId": {
      "type": "string",
      "description": "User identifier"
    },
    "userName": {
      "type": "string",
      "description": "User's display name"
    },
    "characters": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 2,
      "maxItems": 2,
      "description": "Array of two character names to debate"
    },
    "context": {
      "type": "object",
      "properties": {
        "debateId": {
          "type": "string",
          "description": "Unique identifier for the debate session"
        },
        "lastCharacter": {
          "type": "string",
          "description": "Name of the character who spoke last"
        },
        "characters": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 2,
          "maxItems": 2,
          "description": "Array of participating characters"
        }
      }
    }
  },
  "required": ["text", "userId"]
}

# chat_response_schema.json
{
  "type": "object",
  "properties": {
    "messages": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "The character's response"
          },
          "type": {
            "type": "string",
            "enum": ["text"],
            "description": "Type of message (always 'text')"
          }
        },
        "required": ["text", "type"]
      },
      "minItems": 1,
      "maxItems": 1
    },
    "context": {
      "type": "object",
      "properties": {
        "debateId": {
          "type": "string",
          "description": "Unique identifier for the debate session"
        },
        "lastCharacter": {
          "type": "string",
          "description": "Name of the character who just spoke"
        },
        "characters": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 2,
          "maxItems": 2,
          "description": "Array of participating characters"
        }
      },
      "required": ["debateId", "lastCharacter", "characters"]
    }
  },
  "required": ["messages", "context"]
}