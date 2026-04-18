# 🌿 Farmie - Your Pocket Agronomist

Farmie is a world-class agricultural AI assistant designed to empower farmers with data-driven insights. By combining real-time weather data, advanced soil science, and AI-powered computer vision, Farmie helps farmers optimize planting schedules, diagnose crop diseases, and connect with local markets.

## 🚀 Key Features

### 📅 AI Planting Plans

- **Weather-Driven Insights:** Fetches 5-day forecasts via OpenWeather API.
- **AI Verdicts:** Utilizes Llama-based AI models to analyze weather conditions and provide "Success," "Warning," or "Danger" verdicts for planting.
- **Smart Scheduling:** Automatically suggests the best days to plant within a 5-day window.

### 💬 Smart Agricultural Chat

- **Context-Aware Advice:** Chat with "Farmie" for specific crop care tips.
- **Proactive Reminders:** The AI detects mentions of activities (e.g., "irrigation tomorrow") and prompts users to add them to a **Saved Schedule**.
- **Lifecycle Tracking:** Transition crops from "Planning" to "Planted" to "Harvesting" with dynamic AI-calculated harvest dates.

### 🧪 Soil Analysis & Health

Comprehensive soil management through four distinct testing methods:

- **Lab Report:** Input professional chemical analysis data.
- **Basic Test Kit:** Color-strip based nutrient tracking.
- **DIY Tests:** Guided manual tests (Jar Test, Vinegar/Baking Soda pH test).
- **Questionnaire:** Observational estimates for equipment-free analysis.
- **AI Amendments:** Receive specific organic and conventional amendment recommendations tailored to your soil type.

### 🔍 Plant Diagnosis (AI Vision)

- **Disease Identification:** Upload photos of plants to identify pests, diseases, or nutrient deficiencies using Groq Vision models.
- **Treatment Protocols:** Receive step-by-step organic and conventional treatment steps.
- **Scan History:** Maintain a local database of previous diagnoses to track farm health over time.

### 🛒 Agricultural Marketplace

- **Farmer View:** Easily list produce with automatic discount calculation and Wikipedia-enriched imagery.
- **Buyer View:** Searchable local marketplace for buyers to find fresh produce and contact farmers directly.

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Architecture:** Model-View-Controller (MVC).
- **Backend:** Netlify Functions (Serverless Node.js) for secure API handling.
- **AI Integration:** Groq API (Llama 3.1 & Llama-4-Scout).
- **External APIs:** OpenWeather (Weather data), Wikipedia (Dynamic crop imagery).
- **Persistence:** Browser LocalStorage for offline-first dashboard capabilities.

## 🏗️ Architecture Overview

The project follows a strict **MVC (Model-View-Controller)** pattern:

1.  **Model (`model.js`, `scanModel.js`):** Manages the application state, data logic, and all API communications.
2.  **View (`views/`):** Handles DOM manipulation, event listening, and UI rendering. Each component (Chat, Soil, Market, etc.) has its own dedicated View class.
3.  **Controller (`controller.js`):** The "brain" of the app that handles user input from the Views and updates the Model, and vice versa.

## 💻 Getting Started

### Prerequisites

- A Netlify account (for serverless functions).
- API Keys for:
  - Groq
  - OpenWeather

  ```

  ```

2.  Install the Netlify CLI:
    ```bash
    npm install netlify-cli -g
    ```
3.  Create a `.env` file in the root directory:
    ```env
    GROQ_API_KEY=your_groq_key
    OPENWEATHER_API_KEY=your_weather_key
    ```
4.  Run the project locally:
    ```bash
    netlify dev
    ```

## 📂 File Structure

```text
src/
├── js/
│   ├── model/         # Data handling & API logic
│   ├── views/         # UI Components & Event Listeners
│   └── controller.js  # App orchestration
├── css/               # Modular stylesheets
└── netlify/
    └── functions/     # Serverless AI & Weather bridge
```

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

_Built to grow the future, one crop at a time._

```


```
