class MarketToastView {
  _parentElement = document.querySelector('#market-toast-hook');
  _timeoutId;

  // Render the toast and trigger the slide-down animation
  render(message = 'Listing added successfully') {
    const markup = this._generateMarkup(message);

    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);

    // Grab the newly injected element
    const toastElement = this._parentElement.querySelector('.market-toast');

    // Force a tiny frame delay so the browser registers the element before adding the visible class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toastElement.classList.add('visible');
      });
    });

    // Clear any existing timeouts to prevent animation glitches if spammed
    if (this._timeoutId) clearTimeout(this._timeoutId);

    // Slide it back up after 3 seconds
    this._timeoutId = setTimeout(() => {
      toastElement.classList.remove('visible');
      // Wait for the slide-up transition to finish (0.4s) before wiping the HTML
      setTimeout(() => this.clear(), 400);
    }, 3000);
  }

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
