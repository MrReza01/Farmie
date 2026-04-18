class ErrorView {
  _parentElement = document.querySelector('.toast-container');
  _timeoutId;

  constructor() {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.toast__close');
      if (!btn) return;
      this.clear();
    });
  }

  /**
   * @description Displays an error toast message that automatically dismisses after 4 seconds.
   * @param {string} message - The error message to display.
   * @returns {void}
   */
  render(message) {
    const markup = this._generateMarkup(message);

    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);

    // Resets the auto-dismissal timer to prevent overlapping removal logic
    if (this._timeoutId) clearTimeout(this._timeoutId);

    this._timeoutId = setTimeout(() => {
      this.clear();
    }, 4000);
  }

  /**
   * @description Clears the error toast container by removing all injected HTML.
   * @returns {void}
   */
  clear() {
    this._parentElement.innerHTML = '';
  }

  _generateMarkup(message) {
    return `
      
<div class="toast toast--error">
<i class="toast__icon fas fa-exclamation-triangle"></i>
  <p class="toast__message">${message}</p>
  <button class="toast__close" aria-label="Close error"> &times;</button>
</div>
    `;
  }
}

export default new ErrorView();
