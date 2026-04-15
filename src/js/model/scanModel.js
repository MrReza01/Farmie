import { state, persistScanHistory } from './model.js';
// import { GROQ_API_KEY } from '../config.js';

const GROQ_IMAGE_MODEL = `meta-llama/llama-4-scout-17b-16e-instruct`;

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
  try {
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
  } catch (err) {
    throw err;
  }
};

/**
 * Retrieves a single scan record from history by its ID
 */
export const getScanById = function (id) {
  const history = loadScanHistory();
  // Ensure we compare strings/numbers correctly by using == or converting types
  return history.find((scan) => scan.id == id);
};
