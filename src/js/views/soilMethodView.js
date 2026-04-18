class SoilMethodView {
  _parentElement = document.querySelector('.app-container');
  _modalElement = null;

  /**
   * @description Renders the soil method selection modal into the application container.
   * @returns {void}
   */
  render() {
    if (this._modalElement) return;

    const markup = this._generateMarkup();
    this._parentElement.insertAdjacentHTML('beforeend', markup);
    this._modalElement = this._parentElement.querySelector('.method-modal');
  }

  /**
   * @description Toggles the visibility of the method selection modal and manages the visibility of global navigation elements.
   * @returns {void}
   */
  toggleModal() {
    if (!this._modalElement) this.render();

    this._modalElement.classList.toggle('method-modal--hidden');

    const header = document.querySelector('.header');
    const bottomNav = document.querySelector('.bottom-nav');

    if (this._modalElement.classList.contains('method-modal--hidden')) {
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
    } else {
      if (header) header.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
    }
  }

  /**
   * @description Attaches an event listener to handle the selection and visual highlighting of a soil testing method.
   * @returns {void}
   */
  addHandlerSelectMethod() {
    this._parentElement.addEventListener('click', (e) => {
      const optionBtn = e.target.closest('.method-option');
      if (!optionBtn) return;

      this._parentElement.querySelectorAll('.method-option').forEach((btn) => {
        btn.classList.remove('method-option--selected');
      });

      optionBtn.classList.add('method-option--selected');

      const continueBtn = this._parentElement.querySelector(
        '.btn-continue-method'
      );
      if (continueBtn) continueBtn.disabled = false;
    });
  }

  /**
   * @description Attaches an event listener to the modal's back/close button.
   * @returns {void}
   */
  addHandlerClose() {
    this._parentElement.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.method-modal__close-btn');
      if (!closeBtn) return;

      this.toggleModal();
    });
  }

  /**
   * @description Attaches an event listener to the continue button to initiate the selected testing flow.
   * @param {Function} handler - The controller function to handle the selected method string.
   * @returns {void}
   */
  addHandlerContinue(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const continueBtn = e.target.closest('.btn-continue-method');
      if (!continueBtn) return;

      const selectedOption = this._parentElement.querySelector(
        '.method-option--selected'
      );
      if (!selectedOption) return;

      const methodString = selectedOption.dataset.method;

      handler(methodString);
    });
  }

  /**
   * @description Attaches a global event listener to handle opening the soil method modal from various entry points.
   * @param {Function} handler - The controller function to handle opening the modal, optionally receiving a thread ID.
   * @returns {void}
   */
  addHandlerOpenMethod(handler) {
    // Listens on document to capture clicks from dynamic buttons across different views
    document.addEventListener('click', (e) => {
      const startBtn = e.target.closest('.btn-start-soil');
      if (startBtn) {
        e.preventDefault();
        handler();
      }

      const shortcutBtn = e.target.closest('.btn-soil-shortcut');
      if (shortcutBtn) {
        e.preventDefault();
        const threadId = shortcutBtn.dataset.thread || 'unknown-thread';
        handler(threadId);
      }
    });
  }

  _generateMarkup() {
    return `
      <div class="method-modal method-modal--hidden">
        
        <div class="method-modal__header">
          <button class="method-modal__close-btn" aria-label="Go back">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
        </div>

        <div class="method-modal__content">
          <h2 class="method-modal__title">How would you like to test your soil?</h2>
          <p class="method-modal__subtitle">Choose a method below.</p>

          <div class="method-options-container">
            <button class="method-option" data-method="lab-report">
              <span class="method-option__indicator"></span>
              <span class="method-option__text">Provide a Lab Report</span>
            </button>

            <button class="method-option" data-method="basic-kit">
              <span class="method-option__indicator"></span>
              <span class="method-option__text">Use a Basic Test Kit</span>
            </button>

            <button class="method-option" data-method="diy-test">
              <span class="method-option__indicator"></span>
              <span class="method-option__text">DIY Test</span>
            </button>

            <button class="method-option" data-method="questionnaire">
              <span class="method-option__indicator"></span>
              <span class="method-option__text">Questionnaire</span>
            </button>
          </div>

          <button class="method-location-link">Find a soil testing lab near me</button>
        </div>

        <div class="method-modal__footer">
          <button class="btn-primary btn-continue-method" disabled>Continue</button>
        </div>

      </div>
    `;
  }
}

export default new SoilMethodView();
