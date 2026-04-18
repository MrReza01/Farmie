class LabFlowView {
  _parentElement = document.querySelector('.view-soil');

  /**
   * @description Injects the lab report flow markup into the soil view.
   * @returns {void}
   */
  render() {
    const markup = this._generateMarkup();
    this._parentElement.insertAdjacentHTML('beforeend', markup);
  }

  /**
   * @description Attaches a handler for the close button click event within the lab flow.
   * @param {Function} handler - The controller function to handle closing the flow.
   * @returns {void}
   */
  addHandlerClose(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btnClose = e.target.closest('#flow-lab-report .btn-close-flow');
      if (!btnClose) return;
      handler();
    });
  }

  /**
   * @description Attaches a handler for the form submission and extracts soil lab data.
   * @param {Function} handler - The controller function to process the lab data.
   * @returns {void}
   */
  addHandlerSubmit(handler) {
    this._parentElement.addEventListener('submit', function (e) {
      const form = e.target.closest('.soil-lab-form');
      if (!form) return;

      e.preventDefault();

      const formData = {
        ph: parseFloat(form.querySelector('#lab-ph').value),
        n: form.querySelector('#lab-n').value,
        p: form.querySelector('#lab-p').value,
        k: form.querySelector('#lab-k').value,
        // Converts string to float only if input is not empty to avoid NaN
        om: form.querySelector('#lab-om').value
          ? parseFloat(form.querySelector('#lab-om').value)
          : null,
      };

      handler(formData);
    });
  }

  /**
   * @description Removes the lab report flow container from the DOM.
   * @returns {void}
   */
  remove() {
    const flowContainer = document.getElementById('flow-lab-report');
    if (flowContainer) flowContainer.remove();
  }

  _generateMarkup() {
    return `
      <div class="soil-input-flow" id="flow-lab-report">
        
        <div class="soil-input-flow__header">
          <button type="button" class="btn-close-flow"><i class="fas fa-arrow-left"></i> Back</button>
          <h2 class="soil-input-flow__title">Enter Lab Results</h2>
        </div>

        <form class="soil-lab-form">
          <p class="soil-form-instructions">Only pH is strictly required. Provide other metrics if your lab report includes them.</p>

          <div class="form-group">
            <label for="lab-ph" class="form-label">pH Level <span class="required-star">*</span></label>
            <input type="number" id="lab-ph" class="form-input" step="0.1" min="0" max="14" placeholder="e.g. 6.5" required>
            <span class="form-hint">Must be between 0 and 14</span>
          </div>

          <div class="form-group">
            <label for="lab-n" class="form-label">Nitrogen (N)</label>
            <select id="lab-n" class="form-select">
              <option value="">Select level (optional)</option>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="lab-p" class="form-label">Phosphorus (P)</label>
            <select id="lab-p" class="form-select">
              <option value="">Select level (optional)</option>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="lab-k" class="form-label">Potassium (K)</label>
            <select id="lab-k" class="form-select">
              <option value="">Select level (optional)</option>
              <option value="Very Low">Very Low</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="lab-om" class="form-label">Organic Matter (%)</label>
            <input type="number" id="lab-om" class="form-input" step="0.1" min="0" max="100" placeholder="e.g. 4.5">
          </div>

          <button type="submit" class="btn-submit-flow">Get Recommendations</button>
        </form>
      </div>
    `;
  }
}

export default new LabFlowView();
