exports.handler = async function (event) {
  // 1. Handle CORS Preflight
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

  // Only allow POST
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    // 2. Extract the prompts sent from the frontend
    const { systemPrompt, userPrompt } = JSON.parse(event.body);
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // 3. Make the secure server-to-server call to Groq
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0,
          // Forcing JSON format securely on the backend
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${errorText}`);
    }

    const data = await response.json();
    let aiText = data.choices[0].message.content;

    // Safety fallback: Strip markdown just in case Llama disobeys
    aiText = aiText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // 4. Send the clean JSON string back to the frontend
    return {
      statusCode: 200,
      body: aiText,
    };
  } catch (err) {
    rror('Soil Processing Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
