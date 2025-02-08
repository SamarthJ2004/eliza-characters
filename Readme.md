# =======================================

new api endpoint:

GET /health
just give the status

POST /message
for debate initialization and battle convertion

GET /battles/{debate_id}/evaluation
for the final evaluation

initialization body:
{
"text": "Tesla vs Whey Protein",
"characters": ["musk", "tate"],
"userId": "user"
}

response:
{
"messages": [
{
"text": "🔥 ROAST BATTLE INITIALIZED 🔥\n\nTopic: Tesla vs Whey Protein\nContestants: musk vs tate\nDuration: 3 minutes\nJudge: Eliza\n\nBattle Rules:\n- Stay in character\n- Keep responses under 4 lines\n- Reference previous burns when possible\nLet the roasting begin! 🎤\n\nFirst up: musk!",
"type": "text"
}
],
"context": {
"debateId": "1739023334234",
"lastCharacter": "tate",
"characters": [
"musk",
"tate"
],
"timeRemaining": 180000,
"status": "active"
}
}

battle chat request body
{
"text": "",
"userId": "user",
"context": {
"debateId": "1739023334234",
"lastCharacter": "musk",
"characters": ["musk", "tate"]
}
}

response for evalution:
{
"evaluation": "=== TECHNICAL ANALYSIS ===\nThis battle features two heavyweights delivering sharp roasts, but tate's energy and adherence to the topic give them a slight edge.\n\n=== CONTESTANT SCORECARDS ===\n\nmusk SCORECARD:\n• Character Authenticity: 8/10 - musk maintains a consistent character while incorporating Tesla's achievements.\n• Roast Quality: 7/10 - Solid roasts, but lacks the energy and impact of tate's.\n• Battle Flow: 7/10 - Good pacing and delivery, but occasionally trails tate's engagement.\nTotal Score: 22/30\n\ntate SCORECARD:\n• Character Authenticity: 9/10 - tate remains in character while delivering powerful roasts.\n• Roast Quality: 8/10 - Strong roasts with excellent energy and impact.\n• Battle Flow: 8/10 - Excellent pacing and delivery, keeping the energy high.\nTotal Score: 25/30\n\n=== BATTLE HIGHLIGHTS ===\nmusk's Best Burn: \"Our innovation in battery technology has powered Tesla to the top, leaving whey protein in the dust.\"\ntate's Best Burn: \"Peak physical condition > your weak body. First principles > your guessing game. Bugatti color, brotha?\"\nBest Callback: \"Interesting coming from someone who couldn't even sell a protein shake... Meanwhile, Tesla's market cap is GREATER than all legacy auto combined. Let that SINK in...\"\n\n=== WINNER DECLARATION ===\nWinner: tate\nVictory Margin: 3 points\nWinning Factor: Hig"
}

//cli
npm start
start a new terminal window
npm run debate -- --characters=eliza.character.json,trump.character.json

//docker commands
docker build -t image_name .
docker tag image_name username/agent_name:tag
docker push username/agent_name:tag

#chracter josn file

{
"name": "Character Name",
"battlePersona": "Battle Personality Type",
"style": {
"all": ["style elements"],
"chat": ["chat patterns"],
"post": ["post patterns"]
},
"battleStyle": {
"signature_elements": {
"formatting": ["style rules"],
"delivery": ["delivery patterns"]
}
}
}
