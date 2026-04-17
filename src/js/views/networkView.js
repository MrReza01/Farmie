class NetworkView {
  _parentElement = document.querySelector('.error-state');
  _retryBtn = document.querySelector('.error-state__retry');

  addHandlerNetwork(handlerOffline, handlerOnline) {
    window.addEventListener('offline', handlerOffline);
    window.addEventListener('online', handlerOnline);
  }

  addHandlerRetry(handler) {
    if (!this._retryBtn) return;
    this._retryBtn.addEventListener('click', handler);
  }

  show() {
    if (this._parentElement) {
      this._parentElement.classList.remove('error-state--hidden');
      // Add the global class to hide the rest of the app
      document.body.classList.add('is-offline');
    }
  }

  hide() {
    if (this._parentElement) {
      this._parentElement.classList.add('error-state--hidden');
      // Remove the global class to restore the app UI
      document.body.classList.remove('is-offline');
    }
  }
}

export default new NetworkView();
