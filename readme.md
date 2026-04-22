# 🌿 Farmie AI — Your Pocket Agronomist

Farmie AI is a precision agriculture web application designed to empower smallholder farmers with data-driven insights. By combining real-time weather data, advanced soil science, AI-powered crop planning, and computer vision, Farmie helps farmers optimise planting schedules, diagnose crop diseases, manage soil health, and connect with local buyers — all from their mobile device.

---

## 🚀 Key Features

### 📅 AI Planting Plans

- Fetches 5-day weather forecasts via the OpenWeather API using a two-step geocoding flow
- AI analyses weather conditions and generates planting verdicts — Optimal, Warning, or Not Recommended — for each day
- Automatically identifies the best days to plant within the 5-day window
- Results presented as a scrollable day-by-day report with colour-coded badges

### 💬 Smart Crop Chat (WhatsApp-Style)

- Each crop plan creates a persistent chat thread with an AI farming advisor
- Context-aware responses based on the crop, location, and weather data
- Proactive AI messages triggered by app events — planting confirmations, expiry warnings, soil results, harvest reminders
- Confirm Planting flow with automatic harvest date calculation
- Crop threads auto-expire after 5 days if planting is not confirmed
- Per-thread calendar tracking farm activities, soil tests, and harvest milestones

### 🧪 Soil Analysis & Health

Four testing methods with AI-generated amendment recommendations:

- **Lab Report** — Input professional chemical analysis data including pH, NPK, Calcium, Magnesium, Sulphur, EC, and soil texture
- **Basic Test Kit** — Colour-strip based nutrient input
- **DIY Tests** — Five guided physical tests: Vinegar/Baking Soda pH test, Jar Texture test, Earthworm Count, Drainage/Percolation test, and Squeeze test
- **Questionnaire** — Observational estimates for farmers with no equipment
- Soil results automatically sent to the linked crop chat for AI interpretation
- Soil test history with pH trend tracking over time

### 🔍 Plant Disease Diagnosis (AI Vision)

- Upload a photo of an affected plant for instant AI-powered diagnosis
- Identifies diseases, pests, and nutrient deficiencies using Groq Vision (Llama-4-Scout)
- Returns disease name, severity rating, spread risk, plain English explanation, and step-by-step treatment plans
- Organic and Conventional treatment options presented as an accordion
- Full diagnosis history saved locally for future reference

### 🛒 Agricultural Marketplace

- **Farmer View** — Create crop listings with automatic discount calculation and Wikipedia-enriched crop imagery
- **Buyer View** — Searchable 2x2 grid marketplace for buyers to browse available and upcoming produce
- Toggle switch switches between Farmer and Buyer perspectives
- Listings persist in the browser for demo purposes

---

## 🛠️ Tech Stack

Layer  
 Frontend ========= Vanilla JavaScript (ES6+), HTML5, CSS3

Architecture ========= Model-View-Controller (MVC) with ES6 Modules

Bundler ======== Parcel

Backend ============= Netlify Serverless Functions

AI — Chat & Soil =========== Groq API (Llama 3.1)

AI — Vision/Scan =========== Groq API (Llama-4-Scout)

Weather ========== OpenWeather API (Geocoding + Forecast)

Crop Images ============ Wikipedia REST API

Image Compression ========== browser-image-compression

Persistence ================= Browser LocalStorage

| Deployment ================= Netlify

## 🏗️ Architecture Overview

Farmie AI follows a strict **MVC (Model-View-Controller)** pattern with ES6 modules:

**Model (`src/js/model/`)**
Manages all application state, data logic, LocalStorage operations, and API communications. Split into dedicated modules:

- `scanModel.js` — Scan history management
- `model.js` — Central re-export hub

**View (`src/js/views/`)**
Handles all DOM manipulation, event listening, and UI rendering. Each section has its own dedicated View file.

**Controller (`src/js/controller.js`)**
Orchestrates the application — receives events from Views, calls Model functions, and instructs Views to re-render.

**Netlify Functions (`netlify/functions/`)**
Serverless Node.js functions that act as a secure proxy between the frontend and third-party APIs. API keys never touch the browser.

## 💻 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Netlify account
- API keys for Groq and OpenWeather

### Installation

1. Clone the repository and install dependencies:

git clone https://github.com/your-username/Farmie.git

npm install

2. Install the Netlify CLI:

npm install netlify-cli -g

3. Create a .env file in the root directory:

GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

4. Run the project locally:
   netlify dev

The app will be available at `http://localhost:8888`

All third-party API keys are stored as Netlify environment variables and never exposed in client-side code. The browser communicates only with Netlify serverless functions which act as a secure proxy to Groq and OpenWeather.
