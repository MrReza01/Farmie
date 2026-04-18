import { state, persistScanHistory } from './model.js';

/**
 * @description Creates a new scan record, adds it to the state, and persists it to local storage.
 * @param {string} imageData - Base64 string of the uploaded photo.
 * @param {string} cropName - Optional user-provided name.
 * @param {Object} diagnosisData - The full AI response object.
 * @returns {Object} The newly created scan record.
 */
export const saveScanRecord = function (imageData, cropName, diagnosisData) {
  const scanRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    imageData: imageData,
    cropName: cropName || 'Unknown Plant',
    diagnosis: diagnosisData,
  };

  state.scanHistory.unshift(scanRecord);
  persistScanHistory();
  return scanRecord;
};

/**
 * @description Returns the entire scan history array.
 * @returns {Array} The scan history array.
 */
export const loadScanHistory = function () {
  return state.scanHistory;
};

/**
 * @description Sends the image to the backend for AI analysis and returns a structured JSON diagnosis.
 * @param {string} imageData - Base64 image data.
 * @param {string} cropName - Name of the crop.
 * @returns {Promise<Object>} The AI diagnosis data.
 */
export const analyzePlantImage = async function (imageData, cropName) {
  const response = await fetch('/.netlify/functions/scanPlant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData, cropName }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local Server Error: ${errorText}`);
  }

  const diagnosisData = await response.json();
  return diagnosisData;
};

/**
 * @description Retrieves a single scan record from history by its ID.
 * @param {string} id - The unique ID of the scan.
 * @returns {Object|undefined} The found scan record.
 */
export const getScanById = function (id) {
  const history = loadScanHistory();
  return history.find((scan) => scan.id == id);
};

/**
 * @description Persists market listings to local storage.
 * @returns {void}
 */
export const saveListings = function () {
  localStorage.setItem('farmieMarket', JSON.stringify(state.marketListings));
};

/**
 * @description Loads market listings from local storage and returns them sorted by newest first.
 * @returns {Array} The sorted market listings.
 */
export const loadListings = function () {
  const storage = localStorage.getItem('farmieMarket');
  if (storage) {
    state.marketListings = JSON.parse(storage);
  }

  return state.marketListings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * @description Creates, calculates discounts for, and saves a new market listing.
 * @param {Object} listingData - Raw listing data from the form.
 * @returns {Object} The created listing object.
 */
export const addListing = function (listingData) {
  let calculatedDiscountedPrice = null;
  const priceNum = Number(listingData.price);
  const discountNum = Number(listingData.discount);

  if (discountNum && discountNum > 0) {
    const discountAmount = priceNum * (discountNum / 100);
    calculatedDiscountedPrice = priceNum - discountAmount;
  }

  const newListing = {
    // Generates a unique ID using crypto if available, otherwise falls back to timestamp
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
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
    imageUrl: null,
    discountedPrice: calculatedDiscountedPrice,
    createdAt: new Date().toISOString(),
  };

  state.marketListings.push(newListing);
  saveListings();

  return newListing;
};

/**
 * @description Retrieves a single market listing by ID.
 * @param {string} id - The ID of the listing.
 * @returns {Object|undefined} The found listing.
 */
export const getListingById = function (id) {
  return state.marketListings.find((listing) => listing.id === id);
};

/**
 * @description Updates the image URL for a specific market listing and persists the change.
 * @param {string} id - The ID of the listing.
 * @param {string} imageUrl - The new image URL.
 * @returns {void}
 */
export const updateListingImage = function (id, imageUrl) {
  const listing = state.marketListings.find((l) => l.id === id);
  if (listing) {
    listing.imageUrl = imageUrl;
    saveListings();
  }
};
