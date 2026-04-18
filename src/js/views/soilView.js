class SoilView {
  _parentElement = document.querySelector('.view-soil');
  _emptyState = document.querySelector('.soil-empty-state');
  _threadsContainer = document.querySelector('.soil-threads-list');

  /**
   * @description Renders the soil analysis results using AI data and configures result view interaction.
   * @param {Object} thread - The soil thread object containing analysis results and form data.
   * @returns {void}
   */
  renderResultView(thread) {
    this.toggleDashboardVisibility(false);

    const existingView = document.getElementById('flow-results-view');
    if (existingView) existingView.remove();

    const results = thread.results;
    const source = thread.formData.source;
    const disclaimerClass =
      source === 'questionnaire' ? '' : 'soil-disclaimer--hidden';

    const markup = `
      <div class="soil-input-flow" id="flow-results-view">
        
        <div class="soil-input-flow__header">
          <button type="button" class="btn-close-flow" id="btn-close-results"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
          <h2 class="soil-input-flow__title">Test Results</h2>
        </div>

        <div class="soil-disclaimer ${disclaimerClass}">
          <i class="fas fa-exclamation-triangle"></i>
          <p><strong>Observational Estimate:</strong> These recommendations are based on visual observations, not chemical analysis. For precise amendment quantities, a physical soil test is required.</p>
        </div>

        <div class="soil-results-card">
          
          <div class="results-header">
            <div class="results-title-wrap">
              <h3 class="results-title">Soil Analysis Complete</h3>
              <p class="results-subtitle">Analyzed by Farmie AI</p>
            </div>
            <div class="results-score">pH ${results.estimatedPh}</div>
          </div>

          <div class="results-section">
            <h4 class="results-section-title">AI Summary</h4>
            <p class="results-text">${results.summary}</p>
          </div>

          <div class="results-section">
            <h4 class="results-section-title">Recommended Amendments</h4>
            <div class="amendments-grid">
              
              <div class="amendment-card amendment-card--organic">
                <h5 class="amendment-title">${results.organicOption.title}</h5>
                <p class="amendment-text">${results.organicOption.description}</p>
              </div>

              <div class="amendment-card amendment-card--conv">
                <h5 class="amendment-title">${results.conventionalOption.title}</h5>
                <p class="amendment-text">${results.conventionalOption.description}</p>
              </div>

            </div>
          </div>

          <div class="results-actions">
            <button class="btn-save-results">Return to Dashboard</button>
          </div>

        </div>
      </div>
    `;

    this._parentElement.insertAdjacentHTML('beforeend', markup);

    // Both navigation and action buttons restore the dashboard state
    const closeHandler = () => {
      document.getElementById('flow-results-view').remove();
      this.toggleDashboardVisibility(true);
    };

    document
      .getElementById('btn-close-results')
      .addEventListener('click', closeHandler);
    document
      .querySelector('.btn-save-results')
      .addEventListener('click', closeHandler);
  }

  _generateResultsMarkup() {
    return `
      <div class="soil-results">
        
        <div class="soil-results__header">
          <div class="soil-results__meta">
            <span class="soil-results__date">11 April 2026</span>
            <span class="soil-results__method-badge method-badge--basic-kit">Basic Test Kit</span>
          </div>
          <button class="btn-test-again">Test Again</button>
        </div>

        <div class="soil-results__disclaimer soil-results__disclaimer--hidden">
          Based on visual observations. For precise results, consider a basic test kit or lab report.
        </div>

        <div class="soil-results__metrics">
          <div class="metric-card">
            <span class="metric-card__label">pH Range</span>
            <span class="metric-card__value">6.0 – 6.5</span>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">Soil Type</span>
            <span class="metric-card__value">Sandy Loam</span>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">Drainage</span>
            <span class="metric-card__value rating-value--good">Good</span>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">Biological Health</span>
            <span class="metric-card__value rating-value--moderate">Moderate</span>
          </div>
        </div>

        <div class="soil-results__summary">
          <h3 class="results-section-title">Soil Condition Summary</h3>
          <p>Your soil is in generally good health with a balanced sandy loam texture that promotes adequate drainage. The pH level is slightly acidic, which is excellent for most vegetable crops like tomatoes. However, the moderate biological health indicates a slight deficiency in active soil microbes and organic matter.</p>
        </div>

        <div class="soil-results__amendments">
          <h3 class="results-section-title">Recommended Amendments</h3>
          
          <div class="amendment-row warning-border">
            <div class="amendment-row__issue">Issue: Low Organic Matter & Microbial Activity</div>
            <div class="amendment-row__fixes">
              <div class="fix-item">
                <span class="fix-type">Organic:</span> Apply well-rotted compost — 500kg per hectare.
              </div>
              <div class="fix-item">
                <span class="fix-type">Conventional:</span> Apply NPK 15-15-15 fertilizer — 50kg per hectare.
              </div>
            </div>
          </div>
          
        </div>

      </div>
    `;
  }

  /**
   * @description Toggles the visibility between the empty state placeholder and the active threads list.
   * @param {boolean} hasThreads - Indicates if there are existing soil threads to display.
   * @returns {void}
   */
  toggleEmptyState(hasThreads) {
    if (hasThreads) {
      this._emptyState.classList.add('soil-view__empty-state--hidden');
      this._threadsContainer.classList.remove('soil-threads-list--hidden');
    } else {
      this._emptyState.classList.remove('soil-view__empty-state--hidden');
      this._threadsContainer.classList.add('soil-threads-list--hidden');
    }
  }

  /**
   * @description Generates and injects a formatted soil test thread card into the dashboard.
   * @param {Object} thread - The soil thread data object to render.
   * @returns {void}
   */
  renderSoilCard(thread) {
    const methodConfig = {
      'lab-report': { icon: 'fa-flask', borderClass: 'soil-card--lab' },
      'basic-kit': { icon: 'fa-vial', borderClass: 'soil-card--kit' },
      'diy-test': { icon: 'fa-leaf', borderClass: 'soil-card--diy' },
      questionnaire: {
        icon: 'fa-clipboard-list',
        borderClass: 'soil-card--quest',
      },
    };
    const config = methodConfig[thread.method] || methodConfig['basic-kit'];

    const statusConfig = {
      pending: '<span class="status-pill status-pill--pending">Pending</span>',
      completed:
        '<span class="status-pill status-pill--success">Completed</span>',
      'needs-amendment':
        '<span class="status-pill status-pill--warning">Needs Amendment</span>',
    };
    const statusMarkup = statusConfig[thread.status] || statusConfig['pending'];

    const linkedMarkup = thread.linkedCropThreadId
      ? `<div class="soil-card__linked-crop"><i class="fas fa-link"></i> Linked Crop</div>`
      : '';

    const resultsMarkup =
      thread.status !== 'pending' && thread.tests.length > 0
        ? `
        <div class="soil-card__summary">
          <span class="summary-item">pH: ${thread.tests[0].pH || '--'}</span>
          <span class="summary-item">Type: ${thread.tests[0].soilType || '--'}</span>
        </div>
      `
        : '';

    const markup = `
      <div class="soil-card ${config.borderClass}" data-id="${thread.id}">
        
        <button type="button" class="btn-delete-soil" aria-label="Delete Test">
          <i class="fa-solid fa-trash"></i>
        </button>

        <div class="soil-card__header">
          <div class="soil-card__icon-wrap">
            <i class="fas ${config.icon}"></i>
          </div>
          <div class="soil-card__title-wrap">
            <h3 class="soil-card__title">${thread.title}</h3>
            <span class="soil-card__date">${new Date(thread.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        
        <div class="soil-card__body">
          <div class="soil-card__tags">
            ${statusMarkup}
            ${linkedMarkup}
          </div>
          ${resultsMarkup}
        </div>
      </div>
    `;

    this._threadsContainer.insertAdjacentHTML('afterbegin', markup);
  }

  /**
   * @description Manages visibility of main dashboard components when entering or exiting sub-flows.
   * @param {boolean} show - Whether to show or hide the dashboard list and action area.
   * @returns {void}
   */
  toggleDashboardVisibility(show) {
    const actionArea = document.querySelector('.soil-action-area');
    if (show) {
      this._threadsContainer.classList.remove('soil-threads-list--hidden');
      if (actionArea) actionArea.style.display = 'flex';
    } else {
      this._threadsContainer.classList.add('soil-threads-list--hidden');
      if (actionArea) actionArea.style.display = 'none';
    }
  }

  /**
   * @description Injects and displays a loading spinner overlay.
   * @returns {void}
   */
  renderSpinner() {
    const markup = `
      <div class="soil-spinner-overlay" id="soil-spinner">
        <div class="spinner-icon"><i class="fas fa-spinner fa-spin"></i></div>
        <p> Analyzing your soil...</p>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', markup);
  }

  _injectDeleteModal() {
    if (this._deleteModalInjected) return;

    const markup = `
      <div class="modal-overlay" id="delete-soil-modal">
        <div class="delete-modal">
          <div class="delete-modal__icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="delete-modal__title">Delete this soil test?</h3>
          <p class="delete-modal__text">This cannot be undone. Your soil test results and recommendations will be permanently erased.</p>
          <div class="delete-modal__actions">
            <button class="btn-delete-cancel" id="btn-cancel-soil-delete" type="button">Cancel</button>
            <button class="btn-delete-confirm" id="btn-confirm-soil-delete" type="button">Yes, Delete</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', markup);

    document
      .getElementById('btn-cancel-soil-delete')
      .addEventListener('click', () => this.hideDeleteModal());

    document
      .getElementById('btn-confirm-soil-delete')
      .addEventListener('click', () => {
        const targetId = this._soilToDeleteId;
        this.hideDeleteModal();

        if (this._deleteHandler && targetId) {
          this._deleteHandler(targetId);
        }
      });

    this._deleteModalInjected = true;
  }

  /**
   * @description Displays the delete confirmation modal for a specific soil test.
   * @param {string} id - The unique ID of the soil thread to be deleted.
   * @returns {void}
   */
  showDeleteModal(id) {
    this._injectDeleteModal();
    this._soilToDeleteId = id;
    document
      .getElementById('delete-soil-modal')
      .classList.add('modal-overlay--active');
  }

  /**
   * @description Hides the soil test delete confirmation modal.
   * @returns {void}
   */
  hideDeleteModal() {
    const modal = document.getElementById('delete-soil-modal');
    if (modal) modal.classList.remove('modal-overlay--active');
    this._soilToDeleteId = null;
  }

  /**
   * @description Attaches a handler to be executed when the user confirms a soil test deletion.
   * @param {Function} handler - The controller function to handle deletion logic.
   * @returns {void}
   */
  addHandlerDeleteConfirm(handler) {
    this._deleteHandler = handler;
  }

  /**
   * @description Attaches a click event listener to handle deletion requests via soil card trash icons.
   * @returns {void}
   */
  addHandlerDeleteIconClick() {
    this._parentElement.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-soil');
      if (!deleteBtn) return;

      e.stopPropagation();

      const card = deleteBtn.closest('.soil-card');
      if (!card) return;

      this.showDeleteModal(card.dataset.id);
    });
  }

  /**
   * @description Removes a soil thread card from the DOM with a scale and fade transition.
   * @param {string} id - The unique ID of the card to be removed.
   * @returns {void}
   */
  removeSoilCard(id) {
    const card = this._parentElement.querySelector(
      `.soil-card[data-id="${id}"]`
    );
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      card.style.transition = 'all 0.3s ease';
      // Synchronize DOM removal with CSS transition duration
      setTimeout(() => card.remove(), 300);
    }
  }

  /**
   * @description Removes the loading spinner overlay from the DOM.
   * @returns {void}
   */
  removeSpinner() {
    const spinner = document.getElementById('soil-spinner');
    if (spinner) spinner.remove();
  }

  /**
   * @description Attaches a click event listener to soil thread cards for navigation to details.
   * @param {Function} handler - The controller function to handle thread selection.
   * @returns {void}
   */
  addHandlerClickCard(handler) {
    this._threadsContainer.addEventListener('click', function (e) {
      if (e.target.closest('.btn-delete-soil')) return;
      const card = e.target.closest('.soil-card');
      if (!card) return;

      // Extract the thread ID from the HTML data attribute
      const id = card.dataset.id;
      handler(id);
    });
  }
}

export default new SoilView();
