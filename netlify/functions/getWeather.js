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
    const { location } = JSON.parse(event.body);
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    // 1. Geo Fetch
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    if (!geoRes.ok) throw new Error('Problem finding your location');
    const geoData = await geoRes.json();

    if (geoData.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Could not find your location ${location}. Please check the spelling`,
        }),
      };
    }

    const { lat, lon } = geoData[0];

    // 2. Weather Fetch
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    if (!weatherRes.ok) throw new Error('Problem getting the weather report');
    const weatherData = await weatherRes.json();

    return { statusCode: 200, body: JSON.stringify(weatherData) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
