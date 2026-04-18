import { state, persistScanHistory } from './model.js';

/**
 * Creates a new scan record, adds it to the state, and saves to LocalStorage
 * @param {String} imageData - Base64 string of the uploaded photo
 * @param {String} cropName - Optional user-provided name
 * @param {Object} diagnosisData - The full AI response object
 */
export const saveScanRecord = function (imageData, cropName, diagnosisData) {
  const scanRecord = {
    id: Date.now().toString(), // Unique ID based on timestamp
    date: new Date().toISOString(),
    imageData: imageData,
    cropName: cropName || 'Unknown Plant',
    diagnosis: diagnosisData,
  };

  // Add to the BEGINNING of the array so newest is always first
  state.scanHistory.unshift(scanRecord);

  // Save to LocalStorage
  persistScanHistory();

  return scanRecord; // Return it just in case the controller needs it
};

/**
 * Returns the entire scan history array
 * (Because we use unshift() in saveScanRecord, it is already sorted newest first)
 */
export const loadScanHistory = function () {
  return state.scanHistory;
};

/**
 * Retrieves a single scan record by its ID
 * @param {String} id - The unique ID of the scan
 */

/**
 * Sends the image to Groq's Vision Model and returns a structured JSON diagnosis
 */

export const analyzePlantImage = async function (imageData, cropName) {
  // We ping our own custom Node.js endpoint!
  const response = await fetch('/.netlify/functions/scanPlant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Pass the image and name into the event.body
    body: JSON.stringify({ imageData, cropName }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local Server Error: ${errorText}`);
  }

  // Parse the JSON string sent back from the Netlify Function
  const diagnosisData = await response.json();
  return diagnosisData;
};

/**
 * Retrieves a single scan record from history by its ID
 */
export const getScanById = function (id) {
  const history = loadScanHistory();
  // Ensure we compare strings/numbers correctly by using == or converting types
  return history.find((scan) => scan.id == id);
};

//  ================= MARKET SECTION ================================
// ==============================================
// STAGE M7: MARKET DATA MODEL
// ==============================================

// Step 4: Save to LocalStorage
export const saveListings = function () {
  localStorage.setItem('farmieMarket', JSON.stringify(state.marketListings));
};

// Step 5: Load from LocalStorage (Returns newest first)
export const loadListings = function () {
  const storage = localStorage.getItem('farmieMarket');
  if (storage) {
    state.marketListings = JSON.parse(storage);
  }

  // Return a copy of the array, sorted by newest timestamp first
  return state.marketListings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Step 6 & 3: Create, Calculate, Append, and Save
export const addListing = function (listingData) {
  // Calculate the discounted price mathematically here in the model
  let calculatedDiscountedPrice = null;
  const priceNum = Number(listingData.price);
  const discountNum = Number(listingData.discount);

  if (discountNum && discountNum > 0) {
    const discountAmount = priceNum * (discountNum / 100);
    calculatedDiscountedPrice = priceNum - discountAmount;
  }

  // Build the strict listing object structure
  const newListing = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), // Generates unique ID
    cropName: listingData.cropName,
    quantity: Number(listingData.quantity),
    unit: listingData.unit,
    price: priceNum,
    location: listingData.location,
    availability: listingData.availability, // 'now' or 'soon'
    availableDate:
      listingData.availability === 'soon' ? listingData.availableDate : null,
    discount: discountNum || null,
    description: listingData.description || null,
    imageUrl: null, // To be populated by Wikipedia fetch later
    discountedPrice: calculatedDiscountedPrice,
    createdAt: new Date().toISOString(),
  };

  // Append to state and save to LocalStorage
  state.marketListings.push(newListing);
  saveListings();

  return newListing; // Return it so the controller can pass it to the toast/view later if needed
};

// Step 7: Retrieve a single listing by ID (For the detail screen)
export const getListingById = function (id) {
  return state.marketListings.find((listing) => listing.id === id);
};

// STAGE M9: Update listing with Wikipedia Image
export const updateListingImage = function (id, imageUrl) {
  const listing = state.marketListings.find((l) => l.id === id);
  if (listing) {
    listing.imageUrl = imageUrl;
    saveListings(); // Persist the updated array to LocalStorage
  }
};
