class SoilView {
  // Assuming this is the container for the soil dashboard/homepage
  _parentElement = document.querySelector('.view-soil');
  _emptyState = document.querySelector('.soil-empty-state');
  _threadsContainer = document.querySelector('.soil-threads-list');

  // Renders the Results using ACTUAL AI Data
  renderResultView(thread) {
    this.toggleDashboardVisibility(false);

    const existingView = document.getElementById('flow-results-view');
    if (existingView) existingView.remove();

    // Extract the AI results and the source
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

    // Both buttons can just close the view and go back to dashboard
    const closeHandler = () => {
      document.getElementById('flow-results-view').remove();
      this.toggleDashboardVisibility(true);
      // Optional: Refresh the dashboard cards here so the "Completed" status shows
      // soilView.renderDashboardCards(model.state.soilThreads);
    };

    document
      .getElementById('btn-close-results')
      .addEventListener('click', closeHandler);
    document
      .querySelector('.btn-save-results')
      .addEventListener('click', closeHandler);
  }
  // The stub requested in your blueprint (we will wire data into this later)
  renderSoilResults(test, thread) {
    // TODO in C5-C8: Accept real data, clear the container, and render dynamic markup
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

  // Toggles between the empty state and the list view
  toggleEmptyState(hasThreads) {
    if (hasThreads) {
      // Hide empty state, show list
      this._emptyState.classList.add('soil-view__empty-state--hidden');
      this._threadsContainer.classList.remove('soil-threads-list--hidden');
    } else {
      // Show empty state, hide list
      this._emptyState.classList.remove('soil-view__empty-state--hidden');
      this._threadsContainer.classList.add('soil-threads-list--hidden');
    }
  }

  // Generates and injects a single thread card
  renderSoilCard(thread) {
    // 1. Icon & Color configuration mapping
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

    // 2. Status Pill configuration
    const statusConfig = {
      pending: '<span class="status-pill status-pill--pending">Pending</span>',
      completed:
        '<span class="status-pill status-pill--success">Completed</span>',
      'needs-amendment':
        '<span class="status-pill status-pill--warning">Needs Amendment</span>',
    };
    const statusMarkup = statusConfig[thread.status] || statusConfig['pending'];

    // 3. Linked Crop Pill (Only render if linked)
    const linkedMarkup = thread.linkedCropThreadId
      ? `<div class="soil-card__linked-crop"><i class="fas fa-link"></i> Linked Crop</div>` // Note: In a real flow, you'd fetch the actual crop name
      : '';

    // 4. Results Summary (Only render if status is not pending)
    const resultsMarkup =
      thread.status !== 'pending' && thread.tests.length > 0
        ? `
        <div class="soil-card__summary">
          <span class="summary-item">pH: ${thread.tests[0].pH || '--'}</span>
          <span class="summary-item">Type: ${thread.tests[0].soilType || '--'}</span>
        </div>
      `
        : '';

    // 5. Build the final HTML string
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

    // 6. Inject into the DOM
    this._threadsContainer.insertAdjacentHTML('afterbegin', markup); // Puts the newest card at the top
  }

  // Hides/Shows the dashboard elements when a flow is active
  toggleDashboardVisibility(show) {
    const actionArea = document.querySelector('.soil-action-area');
    if (show) {
      // Bring the list and button back
      this._threadsContainer.classList.remove('soil-threads-list--hidden');
      if (actionArea) actionArea.style.display = 'flex';
    } else {
      // Hide them so the form takes over
      this._threadsContainer.classList.add('soil-threads-list--hidden');
      if (actionArea) actionArea.style.display = 'none';
    }
  }

  // Shows the loading spinner
  renderSpinner() {
    const markup = `
      <div class="soil-spinner-overlay" id="soil-spinner">
        <div class="spinner-icon"><i class="fas fa-spinner fa-spin"></i></div>
        <p> Analyzing your soil...</p>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', markup);
  }

  // --- DELETE MODAL UI ---
  _injectDeleteModal() {
    if (this._deleteModalInjected) return;

    // Notice we use unique IDs (delete-soil-modal) so it doesn't clash with the Crop modal!
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

    // 1. Cancel button logic
    document
      .getElementById('btn-cancel-soil-delete')
      .addEventListener('click', () => this.hideDeleteModal());

    // 2. Yes, Delete logic
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

  showDeleteModal(id) {
    this._injectDeleteModal();
    this._soilToDeleteId = id;
    document
      .getElementById('delete-soil-modal')
      .classList.add('modal-overlay--active');
  }

  hideDeleteModal() {
    const modal = document.getElementById('delete-soil-modal');
    if (modal) modal.classList.remove('modal-overlay--active');
    this._soilToDeleteId = null;
  }

  addHandlerDeleteConfirm(handler) {
    this._deleteHandler = handler;
  }

  // --- TRASH CAN CLICK LISTENER ---
  addHandlerDeleteIconClick() {
    this._parentElement.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-soil');
      if (!deleteBtn) return;

      e.stopPropagation(); // Stop the card from opening!

      const card = deleteBtn.closest('.soil-card');
      if (!card) return;

      // Show the beautiful modal instead of the ugly browser confirm()
      this.showDeleteModal(card.dataset.id);
    });
  }

  // --- SMOOTH FADE OUT ANIMATION ---
  removeSoilCard(id) {
    const card = this._parentElement.querySelector(
      `.soil-card[data-id="${id}"]`
    );
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => card.remove(), 300);
    }
  }

  // Removes the loading spinner
  removeSpinner() {
    const spinner = document.getElementById('soil-spinner');
    if (spinner) spinner.remove();
  }

  // Listens for clicks on any soil thread card
  addHandlerClickCard(handler) {
    this._threadsContainer.addEventListener('click', function (e) {
      // THE FIX: If the user clicked the delete button, ignore the click entirely!
      if (e.target.closest('.btn-delete-soil')) return;
      // Find the closest card element that was clicked
      const card = e.target.closest('.soil-card');
      if (!card) return;

      // Extract the thread ID from the HTML data attribute
      const id = card.dataset.id;
      handler(id);
    });
  }
}

export default new SoilView();
