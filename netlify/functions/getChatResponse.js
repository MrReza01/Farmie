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
    // 2. Extract the context and message sent from the frontend
    const { systemContext, userMessage } = JSON.parse(event.body);
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
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) throw new Error('Network error connecting to Groq');

    const data = await response.json();
    const aiText = data.choices[0].message.content;

    // 4. Return the text directly to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: aiText }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
