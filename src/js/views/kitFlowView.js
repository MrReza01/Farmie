class KitFlowView {
  _parentElement = document.querySelector('.view-soil');

  /**
   * @description Injects the basic kit flow markup into the DOM and initializes validation.
   * @returns {void}
   */
  render() {
    const markup = this._generateMarkup();
    this._parentElement.insertAdjacentHTML('beforeend', markup);

    this._attachValidation();
  }

  /**
   * @description Attaches a handler for the close button click event.
   * @param {Function} handler - The controller function to handle closing the flow.
   * @returns {void}
   */
  addHandlerClose(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btnClose = e.target.closest('#flow-basic-kit .btn-close-flow');
      if (!btnClose) return;
      handler();
    });
  }

  /**
   * @description Attaches a handler for the form submission and extracts result values.
   * @param {Function} handler - The controller function to process the kit data.
   * @returns {void}
   */
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
        source: 'basic-kit',
      };

      handler(formData);
    });
  }

  _attachValidation() {
    const phInput = document.getElementById('kit-ph');
    const submitBtn = document.querySelector(
      '#flow-basic-kit .btn-submit-flow'
    );

    if (!phInput || !submitBtn) return;

    phInput.addEventListener('input', function () {
      // Enables submission only if pH is a valid number within the 0-14 range
      if (phInput.value !== '' && phInput.value >= 0 && phInput.value <= 14) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    });
  }

  /**
   * @description Removes the basic kit flow container from the DOM.
   * @returns {void}
   */
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
