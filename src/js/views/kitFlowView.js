class KitFlowView {
  _parentElement = document.querySelector('.view-soil');

  render() {
    // 1. Inject the markup
    const markup = this._generateMarkup();
    this._parentElement.insertAdjacentHTML('beforeend', markup);

    // 2. Attach the disabled button listener immediately after rendering
    this._attachValidation();
  }

  // Listens for the Back button
  addHandlerClose(handler) {
    this._parentElement.addEventListener('click', function (e) {
      // Look specifically for the close button inside THIS flow
      const btnClose = e.target.closest('#flow-basic-kit .btn-close-flow');
      if (!btnClose) return;
      handler();
    });
  }

  // Extracts data and sends to Controller
  addHandlerSubmit(handler) {
    this._parentElement.addEventListener('submit', function (e) {
      const form = e.target.closest('.soil-kit-form');
      if (!form) return;

      e.preventDefault();

      const formData = {
        ph: parseFloat(form.querySelector('#kit-ph').value),
        n: form.querySelector('#kit-n').value,
        p: form.querySelector('#kit-p').value,
        k: form.querySelector('#kit-k').value,
        source: 'basic-kit', // Important for the AI prompt later!
      };

      handler(formData);
    });
  }

  // The disabled button logic requested in your blueprint
  _attachValidation() {
    const phInput = document.getElementById('kit-ph');
    const submitBtn = document.querySelector(
      '#flow-basic-kit .btn-submit-flow'
    );

    if (!phInput || !submitBtn) return;

    // Listen for typing in the pH field
    phInput.addEventListener('input', function () {
      // Must not be empty, must be >= 0, and must be <= 14
      if (phInput.value !== '' && phInput.value >= 0 && phInput.value <= 14) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    });
  }

  remove() {
    const flowContainer = document.getElementById('flow-basic-kit');
    if (flowContainer) flowContainer.remove();
  }

  _generateMarkup() {
    return `
      <div class="soil-input-flow" id="flow-basic-kit">
        
        <div class="soil-input-flow__header">
          <button type="button" class="btn-close-flow"><i class="fas fa-arrow-left"></i> Back</button>
          <h2 class="soil-input-flow__title">Basic Test Kit</h2>
        </div>

        <form class="soil-kit-form">
          <p class="soil-form-instructions" style="border-left-color: #52B788;">
            Enter the pH value shown on your test strip. Match your NPK colour indicators to the closest option in each dropdown.
          </p>

          <div class="form-group">
            <label for="kit-ph" class="form-label">pH Level <span class="required-star">*</span></label>
            <input type="number" id="kit-ph" class="form-input" step="0.1" min="0" max="14" placeholder="e.g. 6.5" required>
          </div>

          <div class="form-group">
            <label for="kit-n" class="form-label">Nitrogen (N)</label>
            <select id="kit-n" class="form-select">
              <option value="">Select colour match (optional)</option>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="kit-p" class="form-label">Phosphorus (P)</label>
            <select id="kit-p" class="form-select">
              <option value="">Select colour match (optional)</option>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="kit-k" class="form-label">Potassium (K)</label>
            <select id="kit-k" class="form-select">
              <option value="">Select colour match (optional)</option>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <button type="submit" class="btn-submit-flow" style="background-color: #52B788;" disabled>Get Recommendations</button>
        </form>
      </div>
    `;
  }
}

export default new KitFlowView();
