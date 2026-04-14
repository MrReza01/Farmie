class DiagnosisView {
  _parentElement = document.querySelector('.view-scan');

  // Variables to hold the current scan data for saving to history later
  currentDiagnosisData = null;
  currentImageData = null;
  currentCropName = '';

  render() {
    // Only inject the HTML if it doesn't already exist
    if (!document.getElementById('diagnosis-screen')) {
      const markup = this._generateMarkup();
      this._parentElement.insertAdjacentHTML('beforeend', markup);

      // Wire the back button immediately after injecting
      this._parentElement
        .querySelector('.btn-close-diagnosis')
        .addEventListener('click', () => {
          this.hideDiagnosis();
        });
    }
  }

  showDiagnosis() {
    // 1. Grab elements right now
    const headerEl = document.querySelector('.header');
    const navEl = document.querySelector('.bottom-nav');

    // 2. Hide them
    if (headerEl) headerEl.classList.add('u-hidden');
    if (navEl) navEl.classList.add('u-hidden');

    // 3. Slide the screen up
    const overlay = this._parentElement.querySelector('.diagnosis-overlay');
    if (overlay) {
      setTimeout(() => overlay.classList.add('diagnosis-overlay--active'), 10);
    }
  }

  hideDiagnosis() {
    // 1. Grab main layout elements
    const headerEl = document.querySelector('.header');
    const navEl = document.querySelector('.bottom-nav');

    // 2. Restore main layout
    if (headerEl) headerEl.classList.remove('u-hidden');
    if (navEl) navEl.classList.remove('u-hidden');

    // 3. Slide the diagnosis screen down
    const overlay = this._parentElement.querySelector('.diagnosis-overlay');
    if (overlay) overlay.classList.remove('diagnosis-overlay--active');

    // --- NEW: Also hide the history screen if it's open! ---
    const historyOverlay =
      this._parentElement.querySelector('.history-overlay');
    if (historyOverlay)
      historyOverlay.classList.remove('history-overlay--active');
  }

  // --- NEW: DYNAMIC RENDERING ---
  renderDiagnosis(diagnosisData, imageData, cropName, isHistorical = false) {
    // 1. Store data for S9 (Save to History)
    this.currentDiagnosisData = diagnosisData;
    this.currentImageData = imageData;
    this.currentCropName = cropName;

    // 2. Ensure HTML is in the DOM
    this.render();

    // 3. Grab the DOM elements
    const imgEl = document.getElementById('diag-img');
    const nameEl = document.getElementById('diag-name');
    const severityEl = document.getElementById('diag-severity');
    const riskDotEl = document.getElementById('diag-risk-dot');
    const riskTextEl = document.getElementById('diag-risk-text');
    const descEl = document.getElementById('diag-desc');
    const organicListEl = document.querySelector(
      '.treatment-accordion:nth-of-type(1) .treatment-accordion__content'
    );
    const conventionalListEl = document.querySelector(
      '.treatment-accordion:nth-of-type(2) .treatment-accordion__content'
    );
    const lowConfidenceEl = document.getElementById('diag-low-confidence');

    // 4. Populate Image & Text
    imgEl.src = imageData;

    nameEl.textContent = diagnosisData.diseaseName;
    descEl.textContent = diagnosisData.explanation;

    // 5. Update Severity Badge dynamically
    severityEl.className = `badge badge--${diagnosisData.severity.toLowerCase()}`;
    severityEl.textContent =
      diagnosisData.severity.charAt(0).toUpperCase() +
      diagnosisData.severity.slice(1);

    // 6. Update Spread Risk dynamically
    riskDotEl.className = `risk-dot risk--${diagnosisData.spreadRisk.toLowerCase()}`;
    riskTextEl.textContent =
      diagnosisData.spreadRisk.charAt(0).toUpperCase() +
      diagnosisData.spreadRisk.slice(1) +
      ' Risk';

    // 7. Render Treatment Lists dynamically
    const renderList = (steps) =>
      `<ol>${steps.map((step) => `<li>${step}</li>`).join('')}</ol>`;
    organicListEl.innerHTML = renderList(diagnosisData.treatments.organic);
    conventionalListEl.innerHTML = renderList(
      diagnosisData.treatments.conventional
    );

    // 8. Handle Low Confidence Fallback
    if (diagnosisData.confidenceScore < 60) {
      lowConfidenceEl.classList.remove('u-hidden');
      descEl.classList.add('u-hidden');
      document.getElementById('diag-treatments').classList.add('u-hidden');
    } else {
      lowConfidenceEl.classList.add('u-hidden');
      descEl.classList.remove('u-hidden');
      document.getElementById('diag-treatments').classList.remove('u-hidden');
    }

    // reset the save button state in case this is a new scan
    // --- UPDATED: Save Button State Logic ---
    const saveBtn = document.getElementById('btn-save-diagnosis');
    if (saveBtn) {
      if (isHistorical) {
        // If loaded from history, it's already saved!
        saveBtn.textContent = 'Saved to History';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.6';
        saveBtn.style.cursor = 'not-allowed';
      } else {
        // Fresh scan, allow saving
        saveBtn.textContent = 'Save to History';
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
      }
    }

    // 9. Slide the screen up!
    this.showDiagnosis();
  }

  _generateMarkup() {
    // We remove the hardcoded text and keep the structure.
    // renderDiagnosis() will fill it instantly before it slides up.
    return `
      <div class="diagnosis-overlay" id="diagnosis-screen">
        <header class="diagnosis-header">
          <button class="btn-icon btn-close-diagnosis" type="button" aria-label="Back to Scan">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h2 class="diagnosis-header__title">Diagnosis</h2>
          <div style="width: 24px;"></div>
        </header>

        <div class="diagnosis-body">
          <div class="diagnosis-content">
            <img src="" alt="Plant Image" class="diagnosis-img" id="diag-img">

            <div class="diagnosis-title-row">
              <h3 class="diagnosis-disease" id="diag-name">Loading...</h3>
              <span class="badge" id="diag-severity"></span>
            </div>

            <div class="spread-risk" id="diag-risk-container">
              <span class="risk-dot" id="diag-risk-dot"></span>
              <span class="risk-text" id="diag-risk-text"></span>
            </div>

            <p class="diagnosis-desc" id="diag-desc"></p>

            <div class="treatment-section" id="diag-treatments">
              <details class="treatment-accordion">
                <summary class="treatment-accordion__title">Organic Treatment</summary>
                <div class="treatment-accordion__content"></div>
              </details>

              <details class="treatment-accordion">
                <summary class="treatment-accordion__title">Conventional Treatment</summary>
                <div class="treatment-accordion__content"></div>
              </details>
            </div>

            <div class="low-confidence u-hidden" id="diag-low-confidence">
              <i class="fa-solid fa-circle-exclamation low-confidence__icon"></i>
              <h4>Analysis Unclear</h4>
              <p>The image quality or angle makes it difficult to provide a confident diagnosis. Please try scanning again with a closer, well-lit photo of the affected area.</p>
            </div>

            <button class="btn-primary btn-save-history" id="btn-save-diagnosis" type="button">
              Save to History
            </button>
          </div>
        </div>
      </div>
    `;
  }

  addHandlerSaveHistory(handler) {
    // We use event delegation because the button might not exist in the DOM right away
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-save-diagnosis');
      if (!btn) return;

      if (btn.disabled) return; // Prevent double saves

      // Call the controller, passing all stored data
      handler(
        this.currentImageData,
        this.currentCropName,
        this.currentDiagnosisData
      );

      // UI Feedback: Change button state
      btn.textContent = 'Saved to History';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
    });
  }
}

export default new DiagnosisView();
