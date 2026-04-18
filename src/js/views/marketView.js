class MarketView {
  _currentView = 'farmer';

  _toggleInput = document.querySelector('#market-view-toggle');
  _centerLabel = document.querySelector('.market-center-label');
  _searchInput = document.querySelector('.market-search-input');
  _farmerContainer = document.querySelector('.market-view-farmer');
  _buyerContainer = document.querySelector('.market-view-buyer');
  _farmerTextLabel = document.querySelector('.farmer-label');
  _buyerTextLabel = document.querySelector('.buyer-label');

  _form = document.querySelector('#add-listing-form');
  _radios = document.querySelectorAll('input[name="availability"]');
  _datePickerGroup = document.querySelector('.date-picker-group');
  _dateInput = document.querySelector('#market-date');

  _buyerGrid = document.querySelector('.buyer-grid');

  /**
   * @description Initializes the market view by setting the default toggle state and attaching internal UI listeners.
   * @returns {void}
   */
  init() {
    if (!this._toggleInput) return;

    this._toggleInput.checked = true;
    this._applyState();

    this._toggleInput.addEventListener('change', this._handleToggle.bind(this));

    this._radios.forEach((radio) => {
      radio.addEventListener(
        'change',
        this._handleAvailabilityToggle.bind(this)
      );
    });

    this._form.addEventListener('input', (e) => {
      if (e.target.classList.contains('input-error')) {
        e.target.classList.remove('input-error');
      }
    });
  }

  _handleAvailabilityToggle(e) {
    if (e.target.value === 'soon') {
      this._datePickerGroup.classList.remove('hidden-field');
      this._dateInput.required = true;
    } else {
      this._datePickerGroup.classList.add('hidden-field');
      this._dateInput.required = false;
      this._dateInput.value = '';
      this._dateInput.classList.remove('input-error');
    }
  }

  /**
   * @description Attaches a submit event listener to the listing form with manual validation logic.
   * @param {Function} handler - The controller function to process valid listing data.
   * @returns {void}
   */
  addHandlerSubmit(handler) {
    if (!this._form) return;
    this._form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Iterates through required inputs to manually flag empty fields with error classes
      const requiredInputs = this.querySelectorAll('input[required]');
      let isValid = true;

      requiredInputs.forEach((input) => {
        if (!input.value.trim()) {
          input.classList.add('input-error');
          isValid = false;
        }
      });

      if (!isValid) return;

      const formData = new FormData(this);
      const listingData = Object.fromEntries(formData.entries());

      handler(listingData);
    });
  }

  /**
   * @description Sets the handler to be executed when the view toggles to the Buyer perspective.
   * @param {Function} handler - The controller function to fetch market data.
   * @returns {void}
   */
  addHandlerToggleBuyer(handler) {
    this._onToggleBuyerHandler = handler;
  }

  /**
   * @description Resets the add-listing form and associated UI states to default.
   * @returns {void}
   */
  resetForm() {
    this._form.reset();

    document.querySelector('input[name="availability"][value="now"]').checked =
      true;
    this._datePickerGroup.classList.add('hidden-field');
    this._dateInput.required = false;

    this._form
      .querySelectorAll('.input-error')
      .forEach((el) => el.classList.remove('input-error'));
  }

  _handleToggle(e) {
    this._currentView = e.target.checked ? 'farmer' : 'buyer';
    this._applyState();
  }

  _applyState() {
    if (this._currentView === 'farmer') {
      this._centerLabel.textContent = 'Farmer View';
      this._searchInput.disabled = true;
      this._searchInput.value = '';
      this._farmerContainer.classList.remove('view--hidden');
      this._buyerContainer.classList.add('view--hidden');
      this._farmerTextLabel.classList.add('active');
      this._buyerTextLabel.classList.remove('active');
    } else {
      this._centerLabel.textContent = 'Buyer View';
      this._searchInput.disabled = false;
      this._farmerContainer.classList.add('view--hidden');
      this._buyerContainer.classList.remove('view--hidden');
      this._farmerTextLabel.classList.remove('active');
      this._buyerTextLabel.classList.add('active');

      if (this._onToggleBuyerHandler) {
        this._onToggleBuyerHandler();
      }
    }
  }

  /**
   * @description Renders market listing cards into the buyer grid or displays a filtered empty state.
   * @param {Array} listings - The array of listing objects to be rendered.
   * @param {string} [searchQuery=''] - The current search term used to customize the empty state message.
   * @returns {void}
   */
  renderListingCards(listings, searchQuery = '') {
    this._buyerGrid.innerHTML = '';

    if (!listings || listings.length === 0) {
      const title = searchQuery
        ? `No listings found for "${searchQuery}"`
        : 'No listings available';
      const text = searchQuery
        ? 'Try adjusting your search term.'
        : 'Switch to Farmer View to create the first listing!';

      const emptyMarkup = `
        <div class="market-empty-state">
          <h3 class="market-empty-title">${title}</h3>
          <p class="market-empty-text">${text}</p>
        </div>
      `;
      this._buyerGrid.insertAdjacentHTML('afterbegin', emptyMarkup);
      return;
    }

    const markup = listings.map(this._generateCardMarkup).join('');
    this._buyerGrid.insertAdjacentHTML('afterbegin', markup);

    this._buyerGrid.querySelectorAll('.btn-contact-farmer').forEach((btn) => {
      btn.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  _generateCardMarkup(listing) {
    const imageMarkup = listing.imageUrl
      ? `<img src="${listing.imageUrl}" alt="${listing.cropName}" class="crop-image-actual">`
      : `<div class="fallback-letter">${listing.cropName.charAt(0)}</div>`;

    const badgeMarkup = listing.discount
      ? `<span class="discount-badge">${listing.discount}% OFF</span>`
      : '';

    const priceMarkup = listing.discountedPrice
      ? `
        <div class="card-pricing has-discount">
          <span class="price-original">₦${listing.price} / ${listing.unit}</span>
          <span class="price-discounted">₦${listing.discountedPrice} / ${listing.unit}</span>
        </div>
      `
      : `
        <div class="card-pricing">
          <span class="price-current">₦${listing.price} / ${listing.unit}</span>
        </div>
      `;

    const availabilityText =
      listing.availability === 'now'
        ? 'Available Now'
        : `Coming Soon (${listing.availableDate})`;

    return `
      <article class="listing-card">
        <div class="card-body" tabindex="0" role="button" aria-label="View details for ${listing.cropName}" data-id="${listing.id}">
          
          ${badgeMarkup}
          
          <div class="card-image-wrapper">
            ${imageMarkup}
          </div>
          
          <div class="card-content">
            <h4 class="card-title">${listing.cropName}</h4>
            
            ${priceMarkup}
            
            <p class="card-availability">${availabilityText} • ${listing.location}</p>
          </div>
        </div>
        
        <a href="https://mrreza.netlify.app" target="_blank" class="btn-contact-farmer">Contact Farmer</a>
      </article>
    `;
  }

  /**
   * @description Attaches a click event listener to the buyer grid for card-based navigation.
   * @param {Function} handler - The controller function to handle listing selection.
   * @returns {void}
   */
  addHandlerClickCard(handler) {
    this._buyerGrid.addEventListener('click', function (e) {
      const cardBody = e.target.closest('.card-body');

      if (!cardBody) return;

      const id = cardBody.dataset.id;
      handler(id);
    });
  }

  /**
   * @description Attaches an input event listener to the search bar to handle live filtering.
   * @param {Function} handler - The controller function to process search queries.
   * @returns {void}
   */
  addHandlerSearch(handler) {
    this._searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      handler(query);
    });
  }
}

export default new MarketView();
