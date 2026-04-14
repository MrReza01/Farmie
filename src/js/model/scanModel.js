import { state, persistScanHistory } from './model.js';
import { GROQ_API_KEY } from '../config.js';

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
// export const getScanById = function (id) {
//   return state.scanHistory.find((scan) => scan.id === id);
// };

/**
 * Sends the image to Groq's Vision Model and returns a structured JSON diagnosis
 */

export const analyzePlantImage = async function (imageData, cropName) {
  try {
    const promptText = `
      You are an expert agricultural plant pathologist. Analyze this image of a plant ${cropName ? `(Reported as: ${cropName})` : ''}.
      Identify any diseases, pests, or deficiencies. 
      You MUST respond ONLY with a valid JSON object. Do not include markdown formatting, backticks, or extra conversational text.
      Use exactly this schema:
      {
        "diseaseName": "Name of disease/pest or 'Healthy'",
        "severity": "mild", "moderate", "severe", or "none",
        "spreadRisk": "isolated", "moderate", "contagious", or "none",
        "explanation": "2-3 plain English sentences explaining the visual symptoms.",
        "treatments": {
          "organic": ["Step 1", "Step 2"],
          "conventional": ["Step 1", "Step 2"]
        },
        "confidenceScore": 85
      }
    `;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                { type: 'image_url', image_url: { url: imageData } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1024, // Added safety constraint
        }),
      }
    );

    // 1. Bulletproof Error Reading
    if (!response.ok) {
      // Use .text() instead of .json() so it never crashes on unexpected HTML/Text
      const errorText = await response.text();
      console.error('--- GROQ API RAW ERROR ---', errorText);
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const rawData = await response.json();
    let aiContent = rawData.choices[0].message.content.trim();

    // 2. Markdown Cleanup
    if (aiContent.startsWith('```json')) {
      aiContent = aiContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (aiContent.startsWith('```')) {
      aiContent = aiContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const diagnosisData = JSON.parse(aiContent);
    return diagnosisData;
  } catch (err) {
    throw err; // Pass up to controller
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
