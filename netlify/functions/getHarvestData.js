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

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    // 2. Grab the specific prompts sent from your frontend
    const { systemPrompt, userPrompt } = JSON.parse(event.body);
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // 3. Secure fetch to Groq
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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          // Forcing JSON format here on the backend!
          response_format: { type: 'json_object' },
        }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Groq Network Error: ${response.status} - ${errorDetails}`
      );
    }

    const data = await response.json();

    // 4. Send the JSON string payload directly back to the frontend
    return {
      statusCode: 200,
      body: data.choices[0].message.content,
    };
  } catch (err) {
    rror('Backend Harvest Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
