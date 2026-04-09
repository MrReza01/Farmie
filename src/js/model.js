import {
  OPENWEATHER_API_KEY,
  GEMINI_API_KEY,
  GROQ_API_KEY,
  HUGGINGFACE_API_KEY,
} from './config.js';

export const state = {
  currentView: 'dashboard',
  isModalOpen: false,

  searchQuery: '',
  searchLocation: '',
  report: {},
  savedCrops: [],
};

// Add to the top of model.js
export const DEV_MODE = true; // Change to false for Production (5 days)
export const EXPIRY_DURATION = DEV_MODE
  ? 3 * 60 * 1000
  : 5 * 24 * 60 * 60 * 1000;

// Add this below EXPIRY_DURATION
export const WARNING_THRESHOLD = DEV_MODE ? 1 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 minute for Dev, 24 hours for Prod

const getWeatherData = async function (location) {
  try {
    if (!navigator.onLine) {
      throw new Error(`No internet connection!`);
    }
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (!geoRes.ok) throw new Error(`Problem finding your location`);

    const geoData = await geoRes.json();

    if (geoData.length === 0) {
      throw new Error(
        `Could not find your location ${location}. Please check the spelling`
      );
    }

    const { lat, lon } = geoData[0];

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!weatherRes.ok) throw new Error(`Problem getting the weather report`);

    const weatherData = await weatherRes.json();

    return weatherData;
  } catch (err) {
    if (err.message === `Failed to fetch`) {
      throw err;
    }
    throw err;
  }
};

const processDailyWeather = function (weatherData) {
  const groupedData = {};

  weatherData.list.forEach((entry) => {
    const date = new Date(entry.dt * 1000).toDateString();

    if (!groupedData[date]) groupedData[date] = [];
    groupedData[date].push(entry);
  });

  const dates = Object.keys(groupedData).slice(0, 5);

  return dates.map((date) => {
    const dayEntries = groupedData[date];

    // highest and lowest temperatures
    const maxTemp = Math.max(...dayEntries.map((e) => e.main.temp_max));
    const minTemp = Math.min(...dayEntries.map((e) => e.main.temp_min));

    const dayEntry =
      dayEntries.find(
        (e) =>
          new Date(e.dt * 1000).getHours() >= 12 &&
          new Date(e.dt * 1000).getHours() <= 15
      ) || dayEntries[Math.floor(dayEntries.length / 2)];

    const nightEntry =
      dayEntries.find(
        (e) =>
          new Date(e.dt * 1000).getHours() >= 0 &&
          new Date(e.dt * 1000).getHours() <= 3
      ) || dayEntries[0];

    // CHANCES OF RAIN FALLING
    const maxPop = Math.max(...dayEntries.map((e) => e.pop || 0));
    const rainChance = Math.round(maxPop * 100);

    // Humidity Value
    const avgHumidity = Math.round(
      dayEntries.reduce((sum, e) => sum + e.main.humidity, 0) /
        dayEntries.length
    );

    // Sunlight chnaces
    const avgClouds =
      dayEntries.reduce((sum, e) => sum + e.clouds.all, 0) / dayEntries.length;
    let sunlight = 'Full Sun';
    if (avgClouds > 30 && avgClouds <= 70) sunlight = 'Partial Sun';
    if (avgClouds > 70) sunlight = 'Cloudy';

    const description = dayEntry.weather[0].description;

    // Creating the string for date
    const dateObj = new Date(date);
    const dayName = new Intl.DateTimeFormat(`en-US`, {
      weekday: `long`,
    }).format(dateObj);
    const formattedDate = new Intl.DateTimeFormat(`en-US`, {
      month: `short`,
      day: `numeric`,
    }).format(dateObj);

    return {
      date: formattedDate,
      dayName: dayName,
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      dayTemp: Math.round(dayEntry.main.temp),
      nightTemp: Math.round(nightEntry.main.temp),
      humidity: `${avgHumidity}%`,
      rainChance: `${rainChance}%`,
      sunlight: sunlight,
      description: description,
    };
  });
};

const generateAIPlan = async function (crop, location, weatherData) {
  try {
    const weatherString = weatherData
      .map(
        (day) =>
          `${day.date} :${day.maxTemp}°C / ${day.minTemp}°C, ${day.rainChance} rain, ${day.sunlight}`
      )
      .join(' | ');

    // const prompt = `You are an expert agronomist advising a farmer who wants to plant "${crop}" in ${location}.
    // CRITICAL CONTEXT: The farmer HAS NOT PLANTED YET. They are using this forecast to decide EXACTLY WHICH DAY to put their seeds or seedlings into the ground.

    // FIRST RULE: Verify if "${crop}" is a real, cultivatable agricultural plant.
    // If it is NOT a real plant, return exactly: [{"error": "invalid_crop"}]

    // If it IS a real plant, analyze this 5-day weather forecast: ${weatherString}.
    // Provide a 5-day pre-planting evaluation.
    // You MUST return ONLY a valid JSON array containing exactly 5 objects.
    // Each object must have exactly THREE properties:
    // 1. "advice": 2 to 3 sentences explaining exactly what will happen to the seeds/seedlings if they are planted on this specific day. Explain WHY the weather makes it good or bad, and what specific environmental risks to watch out for. DO NOT give maintenance advice for already-growing plants.
    // 2. "verdict": A strict 2 to 4 word planting directive (e.g., "Very good to plant", "Plant with caution", "Do not plant").
    // 3. "status": You must choose exactly one of these words based on the planting viability: "success" (great conditions for planting), "warning" (acceptable but risky/sub-optimal), or "danger" (terrible conditions, do not plant).

    // Do NOT include markdown formatting, backticks, or the word 'json'. Just return the raw JSON array.`;

    // const res = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}
    //   `,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       contents: [{ parts: [{ text: prompt }] }],
    //     }),
    //   }
    // );

    // if (!res.ok)
    //   throw new Error(`Could not generate a plan. Please try again.`);

    // const aiData = await res.json();

    // const rawText = aiData.candidates[0].content.parts[0].text;
    // const planArray = JSON.parse(rawText.trim());

    // if (planArray[0] && planArray[0].error === `invalid_crop`) {
    //   throw new Error(`${crop} is not valid crop. Please check your spelling.`);
    // }

    // return planArray;

    const res = await fetch(
      `/groq-api/openai/v1/chat/completions`, // Bypassing CORS via your Parcel proxy
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`, // Groq requires the key here
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0, // Keeps the AI strict and robotic so it doesn't break your JSON
          messages: [
            {
              role: 'system',
              content: `You are an expert agronomist advising a farmer. The farmer HAS NOT PLANTED YET. They are using this forecast to decide EXACTLY WHICH DAY to put their seeds or seedlings into the ground.
            
            FIRST RULE: Verify if the user's crop is a real, cultivatable agricultural plant. Assume any real regional crop is valid. If it is NOT a real plant (complete gibberish), return exactly: [{"error": "invalid_crop"}]
            
            You MUST return ONLY a raw, valid JSON array containing exactly 5 objects. Do NOT include markdown formatting, backticks, or the word 'json'. 
            
            Each object must have exactly THREE properties: 
            1. "advice": 2 to 3 sentences explaining exactly what will happen to the seeds/seedlings if they are planted on this specific day. Explain WHY the weather makes it good or bad, and what specific environmental risks to watch out for. DO NOT give maintenance advice for already-growing plants.
            2. "verdict": A strict 2 to 4 word planting directive (e.g., "Very good to plant", "Plant with caution", "Do not plant").
            3. "status": You MUST choose exactly one of these words based on the planting viability: "success" (great conditions), "warning" (acceptable but risky), or "danger" (terrible conditions).`,
            },
            {
              role: 'user',
              // We pass your specific variables right here at the end
              content: `Crop: "${crop}"\nLocation: ${location}\nForecast: ${weatherString}\n\nAnalyze this 5-day weather forecast and provide the 5-day pre-planting evaluation.`,
            },
          ],
        }),
      }
    );

    if (!res.ok)
      throw new Error(`Could not generate a plan. Please try again.`);

    const aiData = await res.json();

    // Groq stores the generated text in a different location than Gemini did
    const rawText = aiData.choices[0].message.content;
    const planArray = JSON.parse(rawText.trim());

    if (planArray[0] && planArray[0].error === `invalid_crop`) {
      throw new Error(
        `${crop} is not a valid crop. Please check your spelling.`
      );
    }

    return planArray;
  } catch (err) {
    console.error(`AI error:`, err);

    if (err.message.includes('valid crop')) {
      throw err;
    } else {
      throw err;
    }
  }
};

export const loadCropReport = async function (cropName, location) {
  const sanitizedCrop = cropName.toLowerCase().trim();
  const sanitizedLocation = location.trim();

  state.searchQuery = sanitizedCrop;
  state.searchLocation = sanitizedLocation;

  const realWeather = await getWeatherData(sanitizedLocation);
  const formattedWeatherArray = processDailyWeather(realWeather);

  // Sending the the weather report to ai
  const aiPlanArray = await generateAIPlan(
    sanitizedCrop,
    sanitizedLocation,
    formattedWeatherArray
  );

  const finalDailyData = formattedWeatherArray.map((day, index) => {
    return {
      ...day,
      advice: aiPlanArray[index].advice,
      verdict: aiPlanArray[index].verdict,
      status: aiPlanArray[index].status,
    };
  });

  state.report = {
    crop: sanitizedCrop,
    location: sanitizedLocation,
    dailyData: finalDailyData,
  };
};

const persistCrops = function () {
  localStorage.setItem('farmieCrops', JSON.stringify(state.savedCrops));
};

const getCropImage = async function (cropName) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cropName)}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    return data.thumbnail ? data.thumbnail.source : null;
  } catch (err) {
    return null;
  }
};

export const addCropToDashboard = async function () {
  // 1. Keep your existing Wikipedia image fetch
  const imageUrl = await getCropImage(state.report.crop);

  // 2. Setup precise timestamps for Stage A3
  const now = new Date();
  const expiryDate = new Date(now.getTime() + EXPIRY_DURATION);

  // 3. Construct the ultimate Crop Thread Object (Merging your old data with new fields)
  const newCropThread = {
    // --- Existing App Data ---
    id: Date.now().toString(),
    crop: state.report.crop.trim().toLowerCase(), // Sanitized
    location: state.report.location,
    dailyData: state.report.dailyData,
    status: 'planning', // Kept your existing status name
    imageUrl: imageUrl,
    chatHistory: [], // Kept your naming (instead of 'messages')

    // --- New Stage A3 Data ---
    title: `${state.report.crop} in ${state.report.location}`,
    coordinates: { lat: null, lon: null }, // Ready for Geocoding

    // Timestamps
    createdAt: now.toISOString(),
    expiresAt: expiryDate.toISOString(),
    plantedAt: null,
    harvestAt: null,

    // Weather & Analytics
    weatherData: { fetchedAt: null, days: [] },
    bestDays: [],
    plantedOnRecommendedDay: null,

    // Soil Integration
    linkedSoilThreadId: null,
    soilResultsSentToAI: false,

    // Expiry Logic Variables
    expiryWarningAt: null,
    expiryWarningSent: false,
  };

  // 4. Save using your existing logic
  state.savedCrops.unshift(newCropThread);
  persistCrops(); // Using your exact persist function

  return newCropThread;
};

export const checkExpiredThreads = function () {
  const now = new Date();
  const initialLength = state.savedCrops.length;

  // Rebuild the array, keeping ONLY crops that haven't expired OR have been planted
  state.savedCrops = state.savedCrops.filter((crop) => {
    const expiryDate = new Date(crop.expiresAt);
    const isExpired = now >= expiryDate;

    // If it is expired AND the user hasn't planted it yet, delete it!
    if (isExpired && crop.plantedAt === null) {
      console.log(`🗑️ Auto-deleted expired crop: ${crop.title}`);
      return false; // Returning false removes it from the array entirely
    }

    return true; // Keep everything else
  });

  // If the array shrank, it means crops were deleted. Save the new array to LocalStorage!
  if (state.savedCrops.length !== initialLength) {
    persistCrops();
    return true; // Returns true so the controller knows a deletion occurred
  }

  return false;
};

export const loadSavedCrops = function () {
  const storage = localStorage.getItem('farmieCrops');
  if (storage) {
    state.savedCrops = JSON.parse(storage);
  }
};
loadSavedCrops();
