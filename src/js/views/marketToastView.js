class MarketToastView {
  _parentElement = document.querySelector('#market-toast-hook');
  _timeoutId;

  /**
   * @description Renders the success toast message and manages the entry/exit animations.
   * @param {string} [message='Listing added successfully'] - The message to display.
   * @returns {void}
   */
  render(message = 'Listing added successfully') {
    const markup = this._generateMarkup(message);

    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);

    const toastElement = this._parentElement.querySelector('.market-toast');

    // Nested requestAnimationFrame ensures the browser paints the initial state before triggering the CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toastElement.classList.add('visible');
      });
    });

    if (this._timeoutId) clearTimeout(this._timeoutId);

    this._timeoutId = setTimeout(() => {
      toastElement.classList.remove('visible');
      // Synchronize DOM cleanup with the duration of the slide-up transition
      setTimeout(() => this.clear(), 400);
    }, 3000);
  }

  /**
   * @description Clears the toast container's inner HTML.
   * @returns {void}
   */
  clear() {
    this._parentElement.innerHTML = '';
  }

  _generateMarkup(message) {
    return `
      <div class="market-toast">
        <i class="fas fa-check-circle market-toast__icon"></i>
        <p class="market-toast__message">${message}</p>
      </div>
    `;
  }
}

export default new MarketToastView();
