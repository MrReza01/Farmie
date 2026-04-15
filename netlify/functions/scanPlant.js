exports.handler = async function (event, context) {
  // 1. Security check: Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Parse the payload sent from your frontend
    const { imageData, cropName } = JSON.parse(event.body);

    // 3. Securely pull the API key from the local environment
    const API_KEY = process.env.GROQ_API_KEY;

    const promptText = `
      You are an expert agricultural plant pathologist. Analyze this image of a plant ${cropName ? `(Reported as: ${cropName})` : ''}.
      Identify the specific plant species, and any diseases, pests, or deficiencies. 
      You MUST respond ONLY with a valid JSON object. Do not include markdown formatting, backticks, or extra conversational text.
      Use exactly this schema:
      {
        "plantName": "Common name of the identified plant (e.g., 'Tomato', 'Cassava', 'Maize')",
        "diseaseName": "Name of disease/pest or 'Healthy'",
        "severity": "mild", "moderate", "severe", or "none",
        "spreadRisk": "isolated", "moderate", "contagious", or "none",
        "explanation": "2-3 plain English sentences explaining the visual symptoms.",
        "treatments": {
          "organic": ["Step 1", "Step 2"],
          "conventional": ["Step 1", "Step 2"]
        },
        "confidenceScore": 85
      }
    `;

    // 4. Server-to-Server fetch (The browser never sees this!)
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                { type: 'image_url', image_url: { url: imageData } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: `Server Error: ${errorText}`,
      };
    }

    const rawData = await response.json();
    let aiContent = rawData.choices[0].message.content.trim();

    // Markdown cleanup (just in case Groq wraps the JSON)
    if (aiContent.startsWith('```json'))
      aiContent = aiContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (aiContent.startsWith('```'))
      aiContent = aiContent.replace(/^```\n?/, '').replace(/\n?```$/, '');

    // 5. Return the clean JSON back to the frontend
    return {
      statusCode: 200,
      body: aiContent,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
