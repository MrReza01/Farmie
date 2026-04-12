class SoilMethodView {
  _parentElement = document.querySelector('.app-container');
  _modalElement = null;

  // We will call this from the controller to render the UI
  render() {
    // Prevent rendering multiple times
    if (this._modalElement) return;

    const markup = this._generateMarkup();
    this._parentElement.insertAdjacentHTML('beforeend', markup);
    this._modalElement = this._parentElement.querySelector('.method-modal');
  }

  // Toggles the modal and manages the global header/nav visibility
  toggleModal() {
    if (!this._modalElement) this.render();

    // Toggle the modal visibility
    this._modalElement.classList.toggle('method-modal--hidden');

    // Hide/Show the global header and bottom nav
    const header = document.querySelector('.header'); // Update if your header class is different
    const bottomNav = document.querySelector('.bottom-nav');

    if (this._modalElement.classList.contains('method-modal--hidden')) {
      // Modal is closing: bring back header and nav
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
    } else {
      // Modal is opening: hide header and nav for full-screen focus
      if (header) header.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
    }
  }

  // --- UI EVENT LISTENERS ---

  // 1. Handles tapping the options
  addHandlerSelectMethod() {
    // We use event delegation on the parent container
    this._parentElement.addEventListener('click', (e) => {
      const optionBtn = e.target.closest('.method-option');
      if (!optionBtn) return;

      // Strip the selected class from ALL options
      this._parentElement.querySelectorAll('.method-option').forEach((btn) => {
        btn.classList.remove('method-option--selected');
      });

      // Add the selected class ONLY to the clicked option
      optionBtn.classList.add('method-option--selected');

      // Enable the Continue button now that a choice is made
      const continueBtn = this._parentElement.querySelector(
        '.btn-continue-method'
      );
      if (continueBtn) continueBtn.disabled = false;
    });
  }

  // 2. Handles tapping the back/close arrow
  addHandlerClose() {
    this._parentElement.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.method-modal__close-btn');
      if (!closeBtn) return;

      this.toggleModal(); // Hides the modal and brings back the main nav
    });
  }

  // 3. Handles tapping the Continue button (Sends data to Controller)
  addHandlerContinue(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const continueBtn = e.target.closest('.btn-continue-method');
      if (!continueBtn) return;

      // Find exactly which option has the active class
      const selectedOption = this._parentElement.querySelector(
        '.method-option--selected'
      );
      if (!selectedOption) return;

      // Extract the specific method (e.g., 'lab-report', 'diy-test') from the HTML data attribute
      const methodString = selectedOption.dataset.method;

      // Send that string to the Controller so it knows where to route the user next
      handler(methodString);
    });
  }

  // 4. Handles opening the modal from anywhere in the app (Entry Points A & B)
  addHandlerOpenMethod(handler) {
    document.addEventListener('click', (e) => {
      // Entry Point A: "Start a Soil Test" button
      const startBtn = e.target.closest('.btn-start-soil');
      if (startBtn) {
        e.preventDefault();
        handler(); // Calls the controller with no thread ID
      }

      // Entry Point B: Shortcut from a Crop Chat
      const shortcutBtn = e.target.closest('.btn-soil-shortcut');
      if (shortcutBtn) {
        e.preventDefault();
        const threadId = shortcutBtn.dataset.thread || 'unknown-thread';
        handler(threadId); // Calls the controller and passes the thread ID
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
