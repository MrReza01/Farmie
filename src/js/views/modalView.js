class ModalView {
  _parentElement = document.querySelector('.modal');
  _btnClose = document.querySelector('.modal__back-btn');
  _fabBtn = document.querySelector('.fab');
  _bottomNav = document.querySelector('.bottom-nav');
  _header = document.querySelector('.header');
  _mainView = document.querySelector('.view-dashboard');

  _form = document.querySelector('.modal__form');
  _cropInput = document.querySelector('#crop');
  _locationInput = document.querySelector('#location');

  /**
   * @description Attaches a click event listener to the Floating Action Button (FAB) to open the modal.
   * @param {Function} handler - The controller function to execute when the modal opens.
   * @returns {void}
   */
  addHandlerOpenModal(handler) {
    this._fabBtn.addEventListener('click', () => {
      // Stops the pulsing animation once the user interacts with the primary action
      this._fabBtn.classList.remove('fab--pulsing');
      handler();
    });
  }

  /**
   * @description Attaches a click event listener to the modal back button to close the modal.
   * @param {Function} handler - The controller function to execute when closing.
   * @returns {void}
   */
  addHandlerCloseModal(handler) {
    this._btnClose.addEventListener('click', handler);
  }

  /**
   * @description Attaches a submit event listener to the modal form to process a new crop plan.
   * @param {Function} handler - The controller function that receives the form data object.
   * @returns {void}
   */
  addHandlerSubmitPlan(handler) {
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = {
        crop: this._cropInput.value,
        location: this._locationInput.value,
      };

      handler(data);
    });
  }

  /**
   * @description Resets the values of the crop and location input fields.
   * @returns {void}
   */
  clearInputs() {
    this._cropInput.value = '';
    this._locationInput.value = '';
  }

  /**
   * @description Toggles the visibility of the modal and shifts the UI state of main navigation elements.
   * @returns {void}
   */
  toggleModal() {
    this._parentElement.classList.toggle('modal--hidden');

    this._bottomNav.classList.toggle('bottom-nav--hidden');

    this._fabBtn.classList.toggle('fab--hidden');

    this._header.classList.toggle('header--hidden');

    this._mainView.classList.toggle('view-dashboard--hidden');
    document.body.classList.toggle('no-scroll');
  }
}

export default new ModalView();
