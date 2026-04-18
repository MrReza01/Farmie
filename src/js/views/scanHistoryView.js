class ScanHistoryView {
  _parentElement = document.querySelector('.view-scan');

  /**
   * @description Initializes and renders the base history screen markup if it does not already exist.
   * @returns {void}
   */
  render() {
    if (!document.getElementById('history-screen')) {
      const markup = this._generateBaseMarkup();
      this._parentElement.insertAdjacentHTML('beforeend', markup);

      this._parentElement
        .querySelector('.btn-close-history')
        .addEventListener('click', () => {
          this.hideHistory();
        });
    }
  }

  /**
   * @description Displays the scan history overlay with a transition effect.
   * @returns {void}
   */
  showHistory() {
    const headerEl = document.querySelector('.header');
    const navEl = document.querySelector('.bottom-nav');

    if (headerEl) headerEl.classList.add('u-hidden');
    if (navEl) navEl.classList.add('u-hidden');

    const overlay = this._parentElement.querySelector('.history-overlay');
    if (overlay) {
      // Delay allows the browser to register the element before starting transition
      setTimeout(() => overlay.classList.add('history-overlay--active'), 10);
    }
  }

  /**
   * @description Hides the scan history overlay and restores the main application layout.
   * @returns {void}
   */
  hideHistory() {
    const headerEl = document.querySelector('.header');
    const navEl = document.querySelector('.bottom-nav');

    if (headerEl) headerEl.classList.remove('u-hidden');
    if (navEl) navEl.classList.remove('u-hidden');

    const overlay = this._parentElement.querySelector('.history-overlay');
    if (overlay) overlay.classList.remove('history-overlay--active');
  }

  /**
   * @description Renders the list of previous scans or an empty state message.
   * @param {Array} historyData - The array of scan objects to display.
   * @returns {void}
   */
  renderHistoryList(historyData) {
    this.render();

    const emptyState = document.getElementById('history-empty-state');
    const listContainer = document.getElementById('history-list-container');

    listContainer.innerHTML = '';

    if (!historyData || historyData.length === 0) {
      emptyState.classList.remove('u-hidden');
      listContainer.classList.add('u-hidden');
      return;
    }

    emptyState.classList.add('u-hidden');
    listContainer.classList.remove('u-hidden');

    const cardsMarkup = historyData
      .map((scan) => this._generateCardMarkup(scan))
      .join('');
    listContainer.insertAdjacentHTML('afterbegin', cardsMarkup);
  }

  _generateCardMarkup(scan) {
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(scan.date));

    const title = scan.diagnosis?.diseaseName || 'Unknown Issue';
    const severity = scan.diagnosis?.severity?.toLowerCase() || 'none';
    const severityText = severity.charAt(0).toUpperCase() + severity.slice(1);

    return `
      <div class="history-card" data-id="${scan.id}">
        <img src="${scan.imageData}" alt="${title}" class="history-card__img">
        <div class="history-card__info">
          <h4 class="history-card__title">${title}</h4>
          <span class="badge badge--${severity}">${severityText}</span>
          <span class="history-card__date">${formattedDate}</span>
        </div>
        <i class="fa-solid fa-chevron-right history-card__arrow"></i>
      </div>
    `;
  }

  _generateBaseMarkup() {
    return `
      <div class="history-overlay" id="history-screen">
        <header class="history-header">
          <button class="btn-icon btn-close-history" type="button" aria-label="Back to Scan">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h2 class="history-header__title">Scan History</h2>
          <div style="width: 24px;"></div>
        </header>

        <div class="history-body">
          <div class="history-content">
            
            <div class="history-empty u-hidden" id="history-empty-state">
              <i class="fa-solid fa-folder-open history-empty__icon"></i>
              <h3 class="history-empty__title">No scans yet</h3>
              <p class="history-empty__text">Upload a plant photo to get your first diagnosis.</p>
            </div>

            <div class="history-list" id="history-list-container">
              </div>

          </div>
        </div>
      </div>
    `;
  }

  /**
   * @description Attaches a click event listener to history cards using event delegation.
   * @param {Function} handler - The controller function to handle card selection.
   * @returns {void}
   */
  addHandlerClickCard(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const card = e.target.closest('.history-card');
      if (!card) return;

      const id = card.dataset.id;
      handler(id);
    });
  }
}

export default new ScanHistoryView();
