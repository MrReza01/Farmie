export const state = {
  currentView: 'dashboard',
  isModalOpen: false,

  searchQuery: '',
  searchLocation: '',
  report: {},
  savedCrops: [],
  soilThreads: [],
  cropThreads: [],
  scanHistory: [],
  marketListings: [
    {
      id: 'seed-1',
      cropName: 'Maize',
      quantity: 50,
      unit: 'bags',
      price: 15000,
      location: 'Moniya, Oyo State',
      availability: 'now',
      availableDate: null,
      discount: 10,
      description:
        'Freshly harvested maize, excellent quality. Ready for pickup at the farm gate.',
      imageUrl: null,
      discountedPrice: 13500, // Pre-calculated
      createdAt: new Date(Date.now() - 100000).toISOString(),
    },
    {
      id: 'seed-2',
      cropName: 'Cassava Tubers',
      quantity: 10,
      unit: 'tonnes',
      price: 8000,
      location: 'Iseyin, Oyo State',
      availability: 'soon',
      availableDate: '2026-05-01',
      discount: null,
      description: 'High-yield cassava variety, perfect for garri processing.',
      imageUrl: null,
      discountedPrice: null,
      createdAt: new Date(Date.now() - 200000).toISOString(),
    },
  ],
};

const deleteItemById = function (collection, id, persist) {
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) return false;

  collection.splice(index, 1);
  if (persist) persist();
  return true;
};

const persistCrops = function () {
  localStorage.setItem('farmieCrops', JSON.stringify(state.savedCrops));
};

const persistSoilThreads = function () {
  localStorage.setItem('farmieSoilThreads', JSON.stringify(state.soilThreads));
};

/**
 * @description Persists the current scan history to local storage.
 * @returns {void}
 */
export const persistScanHistory = function () {
  localStorage.setItem('farmieScanHistory', JSON.stringify(state.scanHistory));
};

const generateId = function (prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
};

export const EXPIRY_DURATION = 5 * 24 * 60 * 60 * 1000;
export const WARNING_THRESHOLD = 24 * 60 * 60 * 1000;

/**
 * @description Fetches weather data for a specified location from the secure backend function.
 * @param {string} location - The name of the city or region.
 * @returns {Promise<Object>} The raw weather data object.
 * @throws {Error} If network connection is lost or the location is not found.
 */
export const getWeatherData = async function (location) {
  try {
    if (!navigator.onLine) throw new Error(`No internet connection!`);

    const res = await fetch('/.netlify/functions/getWeather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });

    const data = await res.json();

    if (res.status === 404) throw new Error(data.error);
    if (!res.ok) throw new Error('Problem getting the weather report');

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error(
        'Connection too weak. Please check your internet and try again.',
        { cause: err }
      );
    }
    throw err;
  }
};

/**
 * @description Generates a 5-day planting plan by sending crop and weather data to the AI service.
 * @param {string} crop - The name of the crop.
 * @param {string} location - The farm location.
 * @param {Array} weatherData - An array of formatted daily weather objects.
 * @returns {Promise<Array>} An array of daily advice objects from the AI.
 * @throws {Error} If the AI response is malformed or the crop is invalid.
 */
export const generateAIPlan = async function (crop, location, weatherData) {
  try {
    const res = await fetch('/.netlify/functions/generateAIPlan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, location, weatherData }),
    });

    if (!res.ok)
      throw new Error(`Could not generate a plan. Please try again.`);

    const rawText = await res.text();
    let planArray;

    try {
      const start = rawText.indexOf('[');
      const end = rawText.lastIndexOf(']') + 1;
      if (start === -1 || end === 0) throw new Error('No JSON array found');
      planArray = JSON.parse(rawText.substring(start, end));
    } catch (parseErr) {
      throw new Error('The AI provided an unreadable plan. Please try again.', {
        cause: parseErr,
      });
    }

    const requiredKeys = ['status', 'advice', 'verdict'];
    const isPlanComplete =
      Array.isArray(planArray) &&
      planArray.length >= 5 &&
      planArray.every((dayPlan) =>
        requiredKeys.every(
          (key) => Object.hasOwn(dayPlan, key) && dayPlan[key] !== null
        )
      );

    if (!isPlanComplete) {
      throw new Error('Plan generation was incomplete. Please try again.');
    }

    if (planArray[0] && planArray[0].error === 'invalid_crop') {
      throw new Error(
        `${crop} is not a valid crop. Please check your spelling.`
      );
    }

    return planArray;
  } catch (err) {
    const userFriendlyMessage =
      err.message.includes("reading 'advice'") ||
      err.message.includes('undefined')
        ? 'Something went wrong while analyzing the data. Please try again.'
        : err.message;
    throw new Error(userFriendlyMessage, { cause: err });
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

    const maxPop = Math.max(...dayEntries.map((e) => e.pop || 0));
    const rainChance = Math.round(maxPop * 100);

    const avgHumidity = Math.round(
      dayEntries.reduce((sum, e) => sum + e.main.humidity, 0) /
        dayEntries.length
    );

    const avgClouds =
      dayEntries.reduce((sum, e) => sum + e.clouds.all, 0) / dayEntries.length;
    let sunlight = 'Full Sun';
    if (avgClouds > 30 && avgClouds <= 70) sunlight = 'Partial Sun';
    if (avgClouds > 70) sunlight = 'Cloudy';

    const description = dayEntry.weather[0].description;

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

/**
 * @description Orchestrates the retrieval of weather data and AI planting advice to build a crop report.
 * @param {string} cropName - The name of the crop.
 * @param {string} location - The farm location.
 * @returns {Promise<void>}
 */
export const loadCropReport = async function (cropName, location) {
  const sanitizedCrop = cropName.toLowerCase().trim();
  const sanitizedLocation = location.trim();

  state.searchQuery = sanitizedCrop;
  state.searchLocation = sanitizedLocation;

  const realWeather = await getWeatherData(sanitizedLocation);
  const formattedWeatherArray = processDailyWeather(realWeather);

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

const getCropImage = async function (cropName) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cropName)}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    return data.thumbnail ? data.thumbnail.source : null;
  } catch {
    return null;
  }
};

/**
 * @description Creates a new crop thread object, calculates the best planting days, and saves it to the dashboard.
 * @returns {Promise<Object>} The newly created crop thread object.
 */
export const addCropToDashboard = async function () {
  const imageUrl = await getCropImage(state.report.crop);

  const now = new Date();
  const expiryDate = new Date(now.getTime() + EXPIRY_DURATION);

  const verdict = state.report.status || 'success';
  let bestDaysArray;
  let daysString;
  if (verdict === 'warning' || verdict === 'danger') {
    bestDaysArray = [];
    daysString = `Looking at the 5-day forecast, there is no single best day for planting this crop at the moment. I'll keep monitoring the weather for you.`;
  } else {
    const goodDays = state.report.dailyData.filter(
      (day) => day.status === 'success'
    );
    bestDaysArray = goodDays.map((day) => day.date);

    if (bestDaysArray.length === 0) {
      daysString = `Looking at the 5-day forecast,there is no single best day to plant this crop at the moment. I'll keep monitoring to find the absolute perfect day.`;
    } else if (bestDaysArray.length === 1) {
      daysString = `Based on the forecast, the absolute best day to plant this crop is ${bestDaysArray[0]}.`;
    } else {
      const lastDay = bestDaysArray.pop();
      daysString = `Based on the forecast, the best days to plant are ${bestDaysArray.join(', ')} and ${lastDay}.`;
      bestDaysArray.push(lastDay);
    }
  }

  const welcomeText = `Awesome! I've set up your tracking for ${state.report.crop} in ${state.report.location}. ${daysString}`;

  const newCropThread = {
    id: Date.now().toString(),
    crop: state.report.crop.trim().toLowerCase(),
    location: state.report.location,
    dailyData: state.report.dailyData,
    status: 'planning', // App Lifecycle State
    imageUrl: imageUrl,
    soilShortcutDismissed: false,
    chatHistory: [
      {
        role: 'assistant',
        content: welcomeText,
        timestamp: now.toISOString(),
      },
    ],
    title: `${state.report.crop} in ${state.report.location}`,
    coordinates: { lat: null, lon: null },
    createdAt: now.toISOString(),
    expiresAt: expiryDate.toISOString(),
    plantedAt: null,
    harvestAt: null,
    weatherData: { fetchedAt: null, days: [] },
    bestDays: bestDaysArray, // Injects the dynamically calculated array
    plantedOnRecommendedDay: null,
    linkedSoilThreadId: null,
    soilResultsSentToAI: false,
    expiryWarningAt: null,
    expiryWarningSent: false,
  };

  state.savedCrops.unshift(newCropThread);
  persistCrops();

  return newCropThread;
};

/**
 * @description Checks and removes all unplanted crop threads that have surpassed their expiry duration.
 * @returns {boolean} True if any threads were deleted, false otherwise.
 */
export const checkExpiredThreads = function () {
  const now = new Date();
  const initialLength = state.savedCrops.length;

  state.savedCrops = state.savedCrops.filter((crop) => {
    const expiryDate = new Date(crop.expiresAt);
    const isExpired = now >= expiryDate;

    if (isExpired && crop.plantedAt === null) {
      `🗑️ Auto-deleted expired crop: ${crop.title}`;
      return false;
    }
    return true;
  });

  if (state.savedCrops.length !== initialLength) {
    persistCrops();
    return true;
  }
  return false;
};

/**
 * @description Sets the soil test shortcut as dismissed for a specific crop thread.
 * @param {string} id - The ID of the crop thread.
 * @returns {Object|undefined} The updated crop thread object if found.
 */
export const dismissSoilShortcut = function (id) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (crop) {
    crop.soilShortcutDismissed = true;
    persistCrops();
    return crop;
  }
};

/**
 * @description Adds a user's message to a crop thread's chat history and dismisses the soil shortcut.
 * @param {string} id - The ID of the crop thread.
 * @param {string} messageText - The text content of the user's message.
 * @returns {Object|undefined} The updated crop thread object.
 */
export const addUserMessageToThread = function (id, messageText) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  crop.chatHistory.push({
    role: 'user',
    content: messageText,
    timestamp: new Date().toISOString(),
  });

  crop.soilShortcutDismissed = true;
  persistCrops();
  return crop;
};

/**
 * @description Fetches an AI response for a specific chat message within a crop thread's context.
 * @param {string} id - The ID of the crop thread.
 * @param {string} userMessage - The text content provided by the user.
 * @returns {Promise<string>} The AI's response text.
 */
export const getAIResponse = async function (id, userMessage) {
  const cropThread = state.savedCrops.find((c) => c.id === id);
  if (!cropThread) return;

  const plantedStatus = cropThread.plantedAt
    ? `Planted on: ${new Date(cropThread.plantedAt).toLocaleDateString()}`
    : `Status: Not planted yet.`;

  const systemContext = `You are Farmie, an expert agricultural AI assistant.
  Answer concisely and practically.

  CURRENT CONTEXT:
  Crop: ${cropThread.crop}
  Location: ${cropThread.location}
  ${plantedStatus}
  Weather Verdict: ${state.report?.status || 'unknown'}
  `;

  try {
    const response = await fetch('/.netlify/functions/getChatResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ systemContext, userMessage }),
    });

    if (!response.ok)
      throw new Error('Network error connecting to local server');

    const data = await response.json();
    return data.reply;
  } catch {
    return "Sorry, I'm having a bit of trouble connecting to my agricultural database right now. Please try again in a second!";
  }
};

/**
 * @description Scans AI text for agricultural activities and associated timeframes to suggest calendar entries.
 * @param {string} aiText - The text content to analyze.
 * @returns {Object|null} An object with activity and time, or null if no match is found.
 */
export const detectCalendarActivity = function (aiText) {
  const text = aiText.toLowerCase();
  const keywords = [
    'fertiliser',
    'fertilizer',
    'irrigation',
    'water',
    'pruning',
    'pest',
    'harvest',
  ];

  const timeRegex =
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|in \d+ days|next week|day \d+)/;

  const foundActivity = keywords.find((word) => text.includes(word));
  const foundTimeMatch = text.match(timeRegex);

  if (foundActivity && foundTimeMatch) {
    return {
      activity: foundActivity,
      time: foundTimeMatch[0],
    };
  }
  return null;
};

/**
 * @description Adds an AI-generated message to a crop thread and scans for calendar-related suggestions.
 * @param {string} id - The ID of the crop thread.
 * @param {string} messageText - The text content of the AI's message.
 * @returns {Object|undefined} The updated crop thread object.
 */
export const addAIMessageToThread = function (id, messageText) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  let detected = null;
  if (crop.plantedAt) {
    detected = detectCalendarActivity(messageText);
  }

  crop.chatHistory.push({
    role: 'assistant',
    content: messageText,
    timestamp: new Date().toISOString(),
    proposedActivity: detected ? detected.activity : null,
    proposedTime: detected ? detected.time : null,
    activityPromptAnswered: false,
  });

  persistCrops();
  return crop;
};

/**
 * @description Resolves a pending calendar suggestion for a crop thread, either adding the event or skipping it.
 * @param {string} id - The ID of the crop thread.
 * @param {string} timestamp - The unique timestamp of the message containing the prompt.
 * @param {string} activity - The agricultural activity name.
 * @param {string} time - The timeframe for the activity.
 * @param {boolean} isAccepted - Whether the user accepted the suggestion.
 * @returns {Object|undefined} The updated crop thread object.
 */
export const resolveCalendarPrompt = function (
  id,
  timestamp,
  activity,
  time,
  isAccepted
) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  if (!crop.calendarEvents) crop.calendarEvents = [];

  const targetMessage = crop.chatHistory.find(
    (msg) => msg.timestamp === timestamp
  );
  if (targetMessage) targetMessage.activityPromptAnswered = true;

  if (isAccepted) {
    crop.calendarEvents.push({
      activity: activity,
      time: time,
      addedAt: new Date().toISOString(),
    });

    crop.chatHistory.push({
      role: 'proactive',
      content: `Farmie added a reminder for ${activity} (${time}) to your calendar.`,
      timestamp: new Date().toISOString(),
    });
  }

  persistCrops();
  return crop;
};

/**
 * @description Confirms that a crop has been planted, locking in the date and ending the expiration timer.
 * @param {string} id - The ID of the crop thread.
 * @returns {Object|undefined} The updated crop thread object.
 */
export const confirmPlanting = function (id) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  const now = new Date();
  crop.plantedAt = now.toISOString();
  crop.status = 'planted';
  crop.expiresAt = null;

  const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const isGoodDay =
    crop.bestDays &&
    crop.bestDays.some(
      (day) => day.includes(todayName) || day.includes('today')
    );
  crop.plantedOnRecommendedDay = isGoodDay;

  persistCrops();
  return crop;
};

/**
 * @description Requests harvest prediction data and congratulatory advice from the AI based on the planting date.
 * @param {string} id - The ID of the crop thread.
 * @returns {Promise<Object>} The updated crop thread object with harvest details.
 */
export const getHarvestDataFromAI = async function (id) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  const plantedDate = new Date(crop.plantedAt).toLocaleDateString();
  const systemPrompt = `You are Farmie, an expert agricultural AI.
  CRITICAL: You must respond in pure JSON format only.
  JSON Format required: { "daysToHarvest": number, "message": "string" }`;

  const userPrompt = `The user just planted ${crop.crop} in ${crop.location} today (${plantedDate}).
  Did they plant on a recommended weather day? ${crop.plantedOnRecommendedDay ? 'Yes' : 'No'}.

  TASK:
  1. Determine the average number of days it takes to harvest ${crop.crop}.
  2. Write a congratulatory message. Include the estimated harvest timeframe in the text.
  3. If they planted on a BAD day (Recommended day: No), include extra care tips to help the crop survive the current weather.`;

  try {
    const response = await fetch('/.netlify/functions/getHarvestData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok) {
      throw new Error(`Local Server Error: ${response.status}`);
    }

    const aiData = await response.json();
    const harvestDate = new Date(
      new Date(crop.plantedAt).getTime() +
        aiData.daysToHarvest * 24 * 60 * 60 * 1000
    );
    crop.harvestAt = harvestDate.toISOString();

    if (!crop.calendarEvents) crop.calendarEvents = [];
    crop.calendarEvents.push({
      activity: `Planted ${crop.crop}`,
      time: plantedDate,
      addedAt: new Date().toISOString(),
    });
    crop.calendarEvents.push({
      activity: `Expected Harvest`,
      time: harvestDate.toLocaleDateString(),
      addedAt: new Date().toISOString(),
    });

    crop.chatHistory.push({
      role: 'assistant',
      content: aiData.message,
      timestamp: new Date().toISOString(),
    });

    persistCrops();
    return crop;
  } catch {
    crop.chatHistory.push({
      role: 'assistant',
      content:
        "Congratulations on planting! I'm having a little trouble connecting to my database to calculate the exact harvest date right now, but I have marked it as planted.",
      timestamp: new Date().toISOString(),
    });
    persistCrops();
    return crop;
  }
};

/**
 * @description Deletes a crop thread and unlinks any associated soil threads.
 * @param {string} id - The unique ID of the crop thread to delete.
 * @returns {boolean} True if deletion was successful.
 */
export const deleteCropThread = function (id) {
  const cropToDelete = state.savedCrops.find((c) => c.id === id);
  if (!cropToDelete) return false;

  if (cropToDelete.linkedSoilThreadId && state.soilThreads) {
    const linkedSoil = state.soilThreads.find(
      (s) => s.id === cropToDelete.linkedSoilThreadId
    );
    if (linkedSoil) linkedSoil.linkedCropThreadId = null;
  }
  return deleteItemById(state.savedCrops, id, persistCrops);
};

/**
 * @description Moves a specific crop thread to the front of the dashboard list.
 * @param {string} id - The unique ID of the crop thread.
 * @returns {void}
 */
export const bumpCropToTop = function (id) {
  const index = state.savedCrops.findIndex((c) => c.id === id);

  if (index <= 0) return;

  const [bumpedCrop] = state.savedCrops.splice(index, 1);
  state.savedCrops.unshift(bumpedCrop);
  persistCrops();
};

/**
 * @description Loads existing soil threads from local storage into the application state.
 * @returns {void}
 */
export const loadSoilThreads = function () {
  const storage = localStorage.getItem('farmieSoilThreads');
  if (storage) {
    state.soilThreads = JSON.parse(storage);
  }
};

/**
 * @description Creates and persists a new soil test thread.
 * @param {string} method - The soil testing method used.
 * @param {string|null} [linkedCropThreadId=null] - Optional ID of an associated crop thread.
 * @param {string|null} [cropThreadTitle=null] - Optional title of an associated crop thread.
 * @returns {Object} The newly created soil thread object.
 */
export const saveSoilThread = function (
  method,
  linkedCropThreadId = null,
  cropThreadTitle = null
) {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  let title;
  if (linkedCropThreadId && cropThreadTitle) {
    title = cropThreadTitle; // Linked to crop
  } else {
    // Independent test: mapping raw method strings to nice display names
    const methodNames = {
      'lab-report': 'Lab Report',
      'basic-kit': 'Basic Test Kit',
      'diy-test': 'DIY Test',
      questionnaire: 'Questionnaire',
    };
    const niceMethodName = methodNames[method] || 'Soil Test';
    title = `${niceMethodName} — ${dateStr}`;
  }

  const newThread = {
    id: generateId('soil'),
    title: title,
    method: method,
    createdAt: new Date().toISOString(),
    linkedCropThreadId: linkedCropThreadId,
    status: 'pending',
    tests: [],
  };

  state.soilThreads.push(newThread);
  persistSoilThreads();
  return newThread;
};

/**
 * @description Updates an existing soil thread with new properties and persists the change.
 * @param {string} id - The ID of the soil thread to update.
 * @param {Object} updates - An object containing the property changes.
 * @returns {void}
 */
export const updateSoilThread = function (id, updates) {
  const threadIndex = state.soilThreads.findIndex((thread) => thread.id === id);
  if (threadIndex === -1) return;
  state.soilThreads[threadIndex] = {
    ...state.soilThreads[threadIndex],
    ...updates,
  };
  persistSoilThreads();
};

/**
 * @description Submits soil test data to the AI service for analysis and updates the corresponding soil thread with the results.
 * @param {string} threadId - The ID of the soil thread to update.
 * @param {Object} formData - The raw soil test data submitted by the user.
 * @returns {Promise<Object>} The updated soil thread object containing analysis results.
 * @throws {Error} If the soil thread is not found or the analysis fails.
 */
export const processSoilTestResult = async function (threadId, formData) {
  try {
    const thread = state.soilThreads.find((t) => t.id === threadId);
    if (!thread) throw new Error('Soil thread not found in database.');

    let cropContext = '';
    if (thread.linkedCropThreadId) {
      const linkedCrop =
        state.savedCrops?.find((c) => c.id === thread.linkedCropThreadId) ||
        state.cropThreads?.find((c) => c.id === thread.linkedCropThreadId);

      if (linkedCrop) {
        const cropName = linkedCrop.crop || linkedCrop.cropName;
        cropContext = `The farmer is specifically growing: ${cropName}. Tailor the summary and amendments to this specific crop's ideal pH and nutrient needs.`;
      }
    }

    const systemPrompt = `
      You are an expert agronomist advising a farmer. Analyze the provided soil test data.
      You MUST respond with strictly valid JSON matching this exact structure. Do not include markdown formatting or backticks.
      {
        "estimatedPh": "A number or short string, e.g., '6.5' or '6.0 - 7.0'",
        "summary": "A 2-3 sentence professional summary of the soil condition and what it means for crop growth.",
        "organicOption": {
          "title": "Short title for organic amendment",
          "description": "Specific organic amendment recommendation with estimated quantities per hectare."
        },
        "conventionalOption": {
          "title": "Short title for conventional amendment",
          "description": "Specific conventional synthetic fertilizer recommendation with NPK values and quantities per hectare."
        }
      }
    `;

    let sourceNote = '';
    if (formData.source === 'questionnaire')
      sourceNote =
        'Note: This data is based on visual observational estimates by a farmer with no equipment. Acknowledge this limitation gently in the summary.';
    if (formData.source === 'basic-kit')
      sourceNote =
        'Note: This data comes from a basic home color-strip kit, which lacks high precision.';

    const userPrompt = `
      Data Source: ${formData.source}
      Data Provided: ${JSON.stringify(formData)}
      ${cropContext}
      ${sourceNote}
    `;

    const response = await fetch('/.netlify/functions/processSoilTest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok)
      throw new Error('Failed to connect to the secure server.');

    const parsedResults = await response.json();
    thread.status = 'completed';
    thread.results = parsedResults;
    thread.formData = formData;
    thread.updatedAt = new Date().toISOString();

    persistSoilThreads();
    return thread;
  } catch (err) {
    throw err;
  }
};

/**
 * @description Deletes a soil thread and removes its reference from any linked crop thread.
 * @param {string} id - The ID of the soil thread to delete.
 * @returns {boolean} True if the deletion was successful.
 */
export const deleteSoilThread = function (id) {
  const soilToDelete = state.soilThreads.find((s) => s.id === id);
  if (!soilToDelete) return false;

  if (soilToDelete.linkedCropThreadId && state.savedCrops) {
    const linkedCrop = state.savedCrops.find(
      (c) => c.id === soilToDelete.linkedCropThreadId
    );
    if (linkedCrop) linkedCrop.linkedSoilThreadId = null;
    persistCrops();
  }
  return deleteItemById(state.soilThreads, id, persistSoilThreads);
};

/**
 * @description Loads saved crop data from local storage into the application state.
 * @returns {void}
 */
export const loadSavedCrops = function () {
  const storage = localStorage.getItem('farmieCrops');
  if (storage) {
    state.savedCrops = JSON.parse(storage);
  }
};

/**
 * @description Loads scan history from local storage into the application state.
 * @returns {void}
 */
export const loadScanHistoryStorage = function () {
  const storage = localStorage.getItem('farmieScanHistory');
  if (storage) {
    state.scanHistory = JSON.parse(storage);
  }
};

loadSavedCrops();
loadScanHistoryStorage();

export * from './scanModel.js';
