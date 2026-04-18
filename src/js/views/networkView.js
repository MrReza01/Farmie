class NetworkView {
  _parentElement = document.querySelector('.error-state');
  _retryBtn = document.querySelector('.error-state__retry');

  /**
   * @description Attaches event listeners for online and offline status changes.
   * @param {Function} handlerOffline - Function to call when the browser goes offline.
   * @param {Function} handlerOnline - Function to call when the browser goes online.
   * @returns {void}
   */
  addHandlerNetwork(handlerOffline, handlerOnline) {
    window.addEventListener('offline', handlerOffline);
    window.addEventListener('online', handlerOnline);
  }

  /**
   * @description Attaches a click handler to the retry button in the error state.
   * @param {Function} handler - The function to call on retry button click.
   * @returns {void}
   */
  addHandlerRetry(handler) {
    if (!this._retryBtn) return;
    this._retryBtn.addEventListener('click', handler);
  }

  /**
   * @description Displays the offline error state and updates the document body class.
   * @returns {void}
   */
  show() {
    if (this._parentElement) {
      this._parentElement.classList.remove('error-state--hidden');
      document.body.classList.add('is-offline');
    }
  }

  /**
   * @description Hides the offline error state and restores the document body class.
   * @returns {void}
   */
  hide() {
    if (this._parentElement) {
      this._parentElement.classList.add('error-state--hidden');
      document.body.classList.remove('is-offline');
    }
  }
}

export default new NetworkView();
