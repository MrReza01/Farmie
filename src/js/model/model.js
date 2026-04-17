export const state = {
  currentView: 'dashboard',
  isModalOpen: false,

  searchQuery: '',
  searchLocation: '',
  report: {},
  savedCrops: [],

  // SOIL SECTION
  soilThreads: [],
  cropThreads: [],

  // scan section
  scanHistory: [],

  // MARKET SECTION

  // Seeded with the two placeholder listings from Stage M5
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
      createdAt: new Date(Date.now() - 100000).toISOString(), // Slightly older timestamp
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
      createdAt: new Date(Date.now() - 200000).toISOString(), // Even older timestamp
    },
  ],
};

/**
 * Generic Deletion Utility
 * @param {Array} collection - The state array to remove from (e.g., state.savedCrops)
 * @param {string} id - The ID of the item to delete
 * @param {Function} persist - The specific save function to call after deletion
 * @returns {boolean} - True if deleted, false if not found
 */
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

export const persistScanHistory = function () {
  localStorage.setItem('farmieScanHistory', JSON.stringify(state.scanHistory));
};

const generateId = function (prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
};

// export const DEV_MODE = false; // Change to false for Production (5 days)
// export const EXPIRY_DURATION = DEV_MODE
//   ? 3 * 60 * 1000
//   : 5 * 24 * 60 * 60 * 1000;

// export const WARNING_THRESHOLD = DEV_MODE ? 1 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 minute for Dev, 24 hours for Prod

export const EXPIRY_DURATION = 5 * 24 * 60 * 60 * 1000;

// Add this below EXPIRY_DURATION
export const WARNING_THRESHOLD = 24 * 60 * 60 * 1000; // 1 minute for Dev, 24 hours for Prod

// Inside your model.js / cropModel.js

export const getWeatherData = async function (location) {
  try {
    if (!navigator.onLine) throw new Error(`No internet connection!`);

    // Fetch from your secure backend
    const res = await fetch('/.netlify/functions/getWeather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });

    const data = await res.json();

    // Catch the custom 404 error we threw from the backend for bad spelling
    if (res.status === 404) throw new Error(data.error);
    if (!res.ok) throw new Error('Problem getting the weather report');

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error(
        'Connection too weak. Please check your internet and try again.'
      );
    }
    throw err;
  }
};

export const generateAIPlan = async function (crop, location, weatherData) {
  try {
    // Fetch from your secure backend
    const res = await fetch('/.netlify/functions/generateAIPlan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, location, weatherData }),
    });

    if (!res.ok)
      throw new Error(`Could not generate a plan. Please try again.`);

    // The backend already stripped markdown, so we just parse it!
    const rawText = await res.text();
    let planArray;

    try {
      const start = rawText.indexOf('[');
      const end = rawText.lastIndexOf(']') + 1;
      if (start === -1 || end === 0) throw new Error('No JSON array found');
      planArray = JSON.parse(rawText.substring(start, end));
    } catch (parseErr) {
      console.error('Raw AI Output:', rawText);
      throw new Error('The AI provided an unreadable plan. Please try again.');
    }

    // Health Checks
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
      console.error('Incomplete Plan Structure:', planArray);
      throw new Error('Plan generation was incomplete. Please try again.');
    }

    if (planArray[0] && planArray[0].error === 'invalid_crop') {
      throw new Error(
        `${crop} is not a valid crop. Please check your spelling.`
      );
    }

    return planArray;
  } catch (err) {
    console.error('Final Catch Block:', err);
    const userFriendlyMessage =
      err.message.includes("reading 'advice'") ||
      err.message.includes('undefined')
        ? 'Something went wrong while analyzing the data. Please try again.'
        : err.message;
    throw new Error(userFriendlyMessage);
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
  // 1. Fetch the crop image
  const imageUrl = await getCropImage(state.report.crop);

  // 2. Setup precise timestamps using your Dev Mode variable
  const now = new Date();
  const expiryDate = new Date(now.getTime() + EXPIRY_DURATION);

  // 3. Calculate Best Days based on AI Status
  const verdict = state.report.status || 'success';
  let bestDaysArray = [];
  let daysString = '';

  if (verdict === 'warning' || verdict === 'danger') {
    // Bad weather scenario
    bestDaysArray = [];
    daysString = `Looking at the 5-day forecast, there is no single best day for planting this crop at the moment. I'll keep monitoring the weather for you.`;
  } else {
    // 1. THE BULLETPROOF FILTER: Keep only the days that are marked as a 'success'
    const goodDays = state.report.dailyData.filter(
      (day) => day.status === 'success'
    );

    // 2. Extract just the date string (e.g., "Apr 10") from those successful days
    bestDaysArray = goodDays.map((day) => day.date);

    // 3. Format the grammar based on how many successful days actually exist
    if (bestDaysArray.length === 0) {
      // It's possible the overall verdict was good, but no individual day was a perfect 'success'
      daysString = `Looking at the 5-day forecast,there is no single best day to plant this crop at the moment. I'll keep monitoring to find the absolute perfect day.`;
    } else if (bestDaysArray.length === 1) {
      daysString = `Based on the forecast, the absolute best day to plant this crop is ${bestDaysArray[0]}.`;
    } else {
      const lastDay = bestDaysArray.pop();
      daysString = `Based on the forecast, the best days to plant are ${bestDaysArray.join(', ')} and ${lastDay}.`;
      bestDaysArray.push(lastDay); // Put the last day back so we don't lose the data
    }
  }

  // 4. Construct the dynamic welcome message
  const welcomeText = `Awesome! I've set up your tracking for ${state.report.crop} in ${state.report.location}. ${daysString}`;

  // 5. Construct the ultimate Crop Thread Object (The Blueprint)
  const newCropThread = {
    // --- Existing App Data ---
    id: Date.now().toString(),
    crop: state.report.crop.trim().toLowerCase(), // Sanitized
    location: state.report.location,
    dailyData: state.report.dailyData,
    status: 'planning', // App Lifecycle State
    imageUrl: imageUrl,

    // --- Stage B3 Data: Chat & Interactions ---
    soilShortcutDismissed: false,
    chatHistory: [
      {
        role: 'assistant',
        content: welcomeText,
        timestamp: now.toISOString(),
      },
    ],

    // --- Stage A3 Data: Core Logic & Expiry ---
    title: `${state.report.crop} in ${state.report.location}`,
    coordinates: { lat: null, lon: null }, // Ready for Geocoding API later
    createdAt: now.toISOString(),
    expiresAt: expiryDate.toISOString(),
    plantedAt: null,
    harvestAt: null,
    weatherData: { fetchedAt: null, days: [] },
    bestDays: bestDaysArray, // Injects our dynamically calculated array
    plantedOnRecommendedDay: null,
    linkedSoilThreadId: null,
    soilResultsSentToAI: false,
    expiryWarningAt: null,
    expiryWarningSent: false,
  };

  // 6. Save using your existing logic
  state.savedCrops.unshift(newCropThread);
  persistCrops();

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

export const dismissSoilShortcut = function (id) {
  // 1. Find the specific crop in the array
  const crop = state.savedCrops.find((c) => c.id === id);

  if (crop) {
    // 2. Flip the flag
    crop.soilShortcutDismissed = true;

    // 3. Save the change to LocalStorage
    persistCrops();

    // 4. Return the updated crop so the Controller can give it back to the View
    return crop;
  }
};

export const addUserMessageToThread = function (id, messageText) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  // 1. Add the user's message to the array
  crop.chatHistory.push({
    role: 'user', // Flags it for the white right-aligned CSS bubble!
    content: messageText,
    timestamp: new Date().toISOString(),
  });

  // 2. THE RULE: Automatically dismiss the soil shortcut forever!
  crop.soilShortcutDismissed = true;

  // 3. Save to LocalStorage
  persistCrops();

  return crop;
};

// --- STAGE B4: AI CHAT LOGIC ---

export const getAIResponse = async function (id, userMessage) {
  const cropThread = state.savedCrops.find((c) => c.id === id);
  if (!cropThread) return;

  // 1. SMART STATE INJECTION (Keep exactly as it was!)
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
    // 2. THE SECURE BACKEND CALL
    const response = await fetch('/.netlify/functions/getChatResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Pass both the context and the user message to the server
      body: JSON.stringify({ systemContext, userMessage }),
    });

    if (!response.ok)
      throw new Error('Network error connecting to local server');

    // 3. Parse the exact reply from our backend
    const data = await response.json();
    return data.reply;
  } catch (err) {
    console.error('Server/API Error:', err);
    // Keep your excellent user-friendly fallback message
    return "Sorry, I'm having a bit of trouble connecting to my agricultural database right now. Please try again in a second!";
  }
};

// --- UPGRADED SCANNER ---
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

  // This regex looks for common timeframes. You can expand this later!
  const timeRegex =
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|in \d+ days|next week|day \d+)/;

  const foundActivity = keywords.find((word) => text.includes(word));
  const foundTimeMatch = text.match(timeRegex);

  // THE NEW RULE: We ONLY trigger if we find an activity AND a timeframe!
  if (foundActivity && foundTimeMatch) {
    return {
      activity: foundActivity,
      time: foundTimeMatch[0], // e.g., 'tomorrow'
    };
  }
  return null;
};

// --- UPGRADED MESSAGE SAVER ---
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
    // We now save BOTH the activity and the time (or null if the scanner rejected it)
    proposedActivity: detected ? detected.activity : null,
    proposedTime: detected ? detected.time : null,
    activityPromptAnswered: false,
  });

  persistCrops();
  return crop;
};

// --- UPGRADED CALENDAR RESOLVER ---
// Note: We added the 'time' parameter here!
export const resolveCalendarPrompt = function (
  id,
  timestamp,
  activity,
  time,
  isAccepted
) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  // Failsafe: Create the events array if it doesn't exist yet for older crops
  if (!crop.calendarEvents) crop.calendarEvents = [];

  const targetMessage = crop.chatHistory.find(
    (msg) => msg.timestamp === timestamp
  );
  if (targetMessage) targetMessage.activityPromptAnswered = true;

  if (isAccepted) {
    // 1. Save it to our brand new calendar array!
    crop.calendarEvents.push({
      activity: activity,
      time: time,
      addedAt: new Date().toISOString(),
    });

    // 2. Drop the receipt with the timeframe
    crop.chatHistory.push({
      role: 'proactive',
      content: `Farmie added a reminder for ${activity} (${time}) to your calendar.`,
      timestamp: new Date().toISOString(),
    });
  }

  persistCrops();
  return crop;
};

// --- STAGE B5: CONFIRM PLANTING & DYNAMIC AI HARVEST CALCULATION ---

export const confirmPlanting = function (id) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  const now = new Date();

  // 1. Instantly lock in the dates and status
  crop.plantedAt = now.toISOString();
  crop.status = 'planted';
  crop.expiresAt = null; // Stops the 5-day deletion timer forever

  // 2. Check if they planted on a recommended day
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

// --- NEW API CALL SPECIFICALLY FOR HARVEST CALCULATION ---

export const getHarvestDataFromAI = async function (id) {
  const crop = state.savedCrops.find((c) => c.id === id);
  if (!crop) return;

  const plantedDate = new Date(crop.plantedAt).toLocaleDateString();

  // 1. Give the AI its rules (System)
  const systemPrompt = `You are Farmie, an expert agricultural AI.
  CRITICAL: You must respond in pure JSON format only.
  JSON Format required: { "daysToHarvest": number, "message": "string" }`;

  // 2. Give the AI the data (User)
  const userPrompt = `The user just planted ${crop.crop} in ${crop.location} today (${plantedDate}).
  Did they plant on a recommended weather day? ${crop.plantedOnRecommendedDay ? 'Yes' : 'No'}.

  TASK:
  1. Determine the average number of days it takes to harvest ${crop.crop}.
  2. Write a congratulatory message. Include the estimated harvest timeframe in the text.
  3. If they planted on a BAD day (Recommended day: No), include extra care tips to help the crop survive the current weather.`;

  try {
    // 3. Fetch from your NEW secure backend!
    const response = await fetch('/.netlify/functions/getHarvestData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Pass the prompts securely to the server
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok) {
      throw new Error(`Local Server Error: ${response.status}`);
    }

    // Since the backend sent back the perfectly formatted JSON string, we just parse it:
    const aiData = await response.json();

    // --- APPLY THE AI DATA TO OUR APP ---

    // 1. Calculate the Harvest Date
    const harvestDate = new Date(
      new Date(crop.plantedAt).getTime() +
        aiData.daysToHarvest * 24 * 60 * 60 * 1000
    );
    crop.harvestAt = harvestDate.toISOString();

    // 2. Build the Calendar Events
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

    // 3. Save the conversational message
    crop.chatHistory.push({
      role: 'assistant',
      content: aiData.message,
      timestamp: new Date().toISOString(),
    });

    persistCrops();
    return crop;
  } catch (err) {
    console.error('Harvest Calculation Error:', err);
    // Fallback if internet drops
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

// --- STAGE B7: DELETE CROP THREAD ---
export const deleteCropThread = function (id) {
  const cropToDelete = state.savedCrops.find((c) => c.id === id);
  if (!cropToDelete) return false;

  // 1. CROP-SPECIFIC LOGIC: Unlink Soil Threads
  if (cropToDelete.linkedSoilThreadId && state.soilThreads) {
    const linkedSoil = state.soilThreads.find(
      (s) => s.id === cropToDelete.linkedSoilThreadId
    );
    if (linkedSoil) linkedSoil.linkedCropThreadId = null;
    // Note: If you have a persistSoil() function, call it here
  }

  // 2. GENERIC LOGIC: Use the utility to erase the data
  return deleteItemById(state.savedCrops, id, persistCrops);
};

// --- BUMP THREAD TO TOP ---
export const bumpCropToTop = function (id) {
  // 1. Find where the crop currently sits
  const index = state.savedCrops.findIndex((c) => c.id === id);

  // 2. If it's already at the very top (index 0) or doesn't exist, do nothing!
  if (index <= 0) return;

  // 3. Pluck it out of the array
  const [bumpedCrop] = state.savedCrops.splice(index, 1);

  // 4. Shove it into the very front of the array
  state.savedCrops.unshift(bumpedCrop);

  // 5. Save the new order to Local Storage
  persistCrops();
};

// ===================================== SOIL SECTION==================================

// --- SOIL THREAD DATABASE METHODS ---

// 1. Load threads from LocalStorage on page load
export const loadSoilThreads = function () {
  const storage = localStorage.getItem('farmieSoilThreads');
  if (storage) {
    state.soilThreads = JSON.parse(storage);
  }
};

// 2. Create and save a brand new thread (Status: Pending)
export const saveSoilThread = function (
  method,
  linkedCropThreadId = null,
  cropThreadTitle = null
) {
  // Format today's date (e.g., "3 Apr 2026")
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Determine the Title based on linkage rules
  let title = '';
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

  // Build the Thread Object perfectly matching your blueprint
  const newThread = {
    id: generateId('soil'),
    title: title,
    method: method,
    createdAt: new Date().toISOString(),
    linkedCropThreadId: linkedCropThreadId,
    status: 'pending', // Always created as pending first
    tests: [], // Empty array ready for results later
  };

  // Push to state and save to LocalStorage
  state.soilThreads.push(newThread);
  persistSoilThreads();

  return newThread; // Return the object so the Controller can send it to the View
};

// 3. Update an existing thread (Used later when a test completes)
export const updateSoilThread = function (id, updates) {
  const threadIndex = state.soilThreads.findIndex((thread) => thread.id === id);
  if (threadIndex === -1) return;

  // Merge the new data (updates) into the existing thread
  state.soilThreads[threadIndex] = {
    ...state.soilThreads[threadIndex],
    ...updates,
  };
  persistSoilThreads();
};

// ==========================================
// MASTER SOIL AI FUNCTION (GROQ / LLAMA 3.1)
// ==========================================

export const processSoilTestResult = async function (threadId, formData) {
  try {
    // 1. Find the specific thread
    const thread = state.soilThreads.find((t) => t.id === threadId);
    if (!thread) throw new Error('Soil thread not found in database.');

    // 2. Check if there is a linked crop to contextualize the prompt
    let cropContext = '';
    if (thread.linkedCropThreadId) {
      // NOTE: Make sure state.cropThreads exists, or change to state.savedCrops depending on your setup!
      const linkedCrop =
        state.savedCrops?.find((c) => c.id === thread.linkedCropThreadId) ||
        state.cropThreads?.find((c) => c.id === thread.linkedCropThreadId);

      if (linkedCrop) {
        // Use linkedCrop.crop or linkedCrop.cropName depending on your data structure
        const cropName = linkedCrop.crop || linkedCrop.cropName;
        cropContext = `The farmer is specifically growing: ${cropName}. Tailor the summary and amendments to this specific crop's ideal pH and nutrient needs.`;
      }
    }

    // 3. Construct the System Prompt (Strict Rules)
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

    // 4. Construct the User Prompt (The Data)
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

    // 5. SECURE FETCH: Hit your new local Netlify Function
    const response = await fetch('/.netlify/functions/processSoilTest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send only the prompts to the backend
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok)
      throw new Error('Failed to connect to the secure server.');

    // 6. The backend already cleaned the text, so we just parse it directly
    const parsedResults = await response.json();

    // 7. Update the thread in our database
    thread.status = 'completed';
    thread.results = parsedResults;
    thread.formData = formData; // Save the raw inputs
    thread.updatedAt = new Date().toISOString();

    // 8. Save to Local Storage
    // Ensure persistSoilThreads() is available in this scope!
    persistSoilThreads();

    // Return the updated thread so the controller can render it
    return thread;
  } catch (err) {
    console.error('💥 Error processing soil test:', err);
    throw err; // Re-throw so the controller can show an error UI
  }
};

export const deleteSoilThread = function (id) {
  const soilToDelete = state.soilThreads.find((s) => s.id === id);
  if (!soilToDelete) return false;

  // 1. SOIL-SPECIFIC LOGIC: Unlink from Crop Threads
  if (soilToDelete.linkedCropThreadId && state.savedCrops) {
    const linkedCrop = state.savedCrops.find(
      (c) => c.id === soilToDelete.linkedCropThreadId
    );
    // If the crop still exists, remove the soil connection
    if (linkedCrop) linkedCrop.linkedSoilThreadId = null;
    persistCrops(); // Save the updated crop database
  }

  // 2. GENERIC LOGIC: Use the utility to erase the soil test
  return deleteItemById(state.soilThreads, id, persistSoilThreads);
};

export const loadSavedCrops = function () {
  const storage = localStorage.getItem('farmieCrops');
  if (storage) {
    state.savedCrops = JSON.parse(storage);
  }
};

export const loadScanHistoryStorage = function () {
  const storage = localStorage.getItem('farmieScanHistory');
  if (storage) {
    state.scanHistory = JSON.parse(storage);
  }
};

loadSavedCrops();
loadScanHistoryStorage();

// At the very bottom of src/js/model/model.js
export * from './scanModel.js';
