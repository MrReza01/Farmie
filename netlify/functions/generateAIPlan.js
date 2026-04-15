exports.handler = async function (event) {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { crop, location, weatherData } = JSON.parse(event.body);
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // Map the weather data into a string right here on the server
    const weatherString = weatherData
      .map(
        (day) =>
          `${day.date} :${day.maxTemp}°C / ${day.minTemp}°C, ${day.rainChance} rain, ${day.sunlight}`
      )
      .join(' | ');

    const promptText = `You are an expert agronomist advising a farmer. The farmer HAS NOT PLANTED YET. They are using this forecast to decide EXACTLY WHICH DAY to put their seeds or seedlings into the ground.

    FIRST RULE: Verify if the user's crop is a real, cultivatable agricultural plant. Assume any real regional crop is valid. If it is NOT a real plant (complete gibberish), return exactly: [{"error": "invalid_crop"}]

    You MUST return ONLY a raw, valid JSON array containing exactly 5 objects. Do NOT include markdown formatting, backticks, or the word 'json'.

    Each object must have exactly THREE properties:
    1. "advice": 2 to 3 sentences explaining exactly what will happen to the seeds/seedlings if they are planted on this specific day. Explain WHY the weather makes it good or bad, and what specific environmental risks to watch out for. DO NOT give maintenance advice for already-growing plants.
    2. "verdict": A strict 2 to 4 word planting directive (e.g., "Very good to plant", "Plant with caution", "Do not plant").
    3. "status": You MUST choose exactly one of these words based on the planting viability: "success" (great conditions), "warning" (acceptable but risky), or "danger" (terrible conditions).`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0,
        messages: [
          { role: 'system', content: promptText },
          {
            role: 'user',
            content: `Crop: "${crop}"\nLocation: ${location}\nForecast: ${weatherString}\n\nAnalyze this 5-day weather forecast and provide the 5-day pre-planting evaluation.`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error('Could not generate a plan.');

    const aiData = await res.json();
    let rawText = aiData.choices[0].message.content;

    // Clean Markdown if it sneaks in
    if (rawText.startsWith('```json'))
      rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (rawText.startsWith('```'))
      rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');

    // Return the clean string directly to the frontend
    return { statusCode: 200, body: rawText };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
