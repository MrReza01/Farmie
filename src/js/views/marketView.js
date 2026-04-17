class MarketView {
  _currentView = 'farmer';

  // Toggle & Container Elements
  _toggleInput = document.querySelector('#market-view-toggle');
  _centerLabel = document.querySelector('.market-center-label');
  _searchInput = document.querySelector('.market-search-input');
  _farmerContainer = document.querySelector('.market-view-farmer');
  _buyerContainer = document.querySelector('.market-view-buyer');
  _farmerTextLabel = document.querySelector('.farmer-label');
  _buyerTextLabel = document.querySelector('.buyer-label');

  // Stage M9: Form Elements
  _form = document.querySelector('#add-listing-form');
  _radios = document.querySelectorAll('input[name="availability"]');
  _datePickerGroup = document.querySelector('.date-picker-group');
  _dateInput = document.querySelector('#market-date');

  _buyerGrid = document.querySelector('.buyer-grid');

  init() {
    if (!this._toggleInput) return;

    this._toggleInput.checked = true;
    this._applyState();

    this._toggleInput.addEventListener('change', this._handleToggle.bind(this));

    // Listen for Availability changes to show/hide the Date Picker
    this._radios.forEach((radio) => {
      radio.addEventListener(
        'change',
        this._handleAvailabilityToggle.bind(this)
      );
    });

    // Clear error states when the user starts typing
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
      this._dateInput.value = ''; // Clear it out
      this._dateInput.classList.remove('input-error');
    }
  }

  // Called by the controller when the form is submitted
  addHandlerSubmit(handler) {
    if (!this._form) return;
    this._form.addEventListener('submit', function (e) {
      e.preventDefault(); // Stop standard HTML submission

      // 1. Strict Validation
      const requiredInputs = this.querySelectorAll('input[required]');
      let isValid = true;

      requiredInputs.forEach((input) => {
        if (!input.value.trim()) {
          input.classList.add('input-error');
          isValid = false;
        }
      });

      if (!isValid) return; // Stop completely if any required field is empty

      // 2. Gather Data
      const formData = new FormData(this);
      const listingData = Object.fromEntries(formData.entries());

      // 3. Pass to Controller
      handler(listingData);
    });
  }

  addHandlerToggleBuyer(handler) {
    this._onToggleBuyerHandler = handler;
  }
  // Called by the controller after the toast disappears
  resetForm() {
    this._form.reset();

    // Reset the availability UI specifically
    document.querySelector('input[name="availability"][value="now"]').checked =
      true;
    this._datePickerGroup.classList.add('hidden-field');
    this._dateInput.required = false;

    // Remove any lingering error classes just in case
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

      // STAGE M10: Trigger the controller to fetch data
      if (this._onToggleBuyerHandler) {
        this._onToggleBuyerHandler();
      }
    }
  }

  // STAGE M10: The Renderer
  // STAGE M12 Upgrade: Added searchQuery parameter with a default empty string
  renderListingCards(listings, searchQuery = '') {
    this._buyerGrid.innerHTML = '';

    if (!listings || listings.length === 0) {
      // Step 5: Dynamic empty state messaging
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

  // STAGE M10: HTML Generator
  _generateCardMarkup(listing) {
    // Image Logic (Step 2)
    const imageMarkup = listing.imageUrl
      ? `<img src="${listing.imageUrl}" alt="${listing.cropName}" class="crop-image-actual">`
      : `<div class="fallback-letter">${listing.cropName.charAt(0)}</div>`;

    // Discount Badge Logic (Step 3)
    const badgeMarkup = listing.discount
      ? `<span class="discount-badge">${listing.discount}% OFF</span>`
      : '';

    // Price Logic (Step 4)
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

    // Format Availability String
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

  // STAGE M11: Listen for card taps
  addHandlerClickCard(handler) {
    this._buyerGrid.addEventListener('click', function (e) {
      // Find the closest card-body that was clicked
      const cardBody = e.target.closest('.card-body');

      // If we didn't click a card body (e.g., clicked the Contact button or empty space), do nothing
      if (!cardBody) return;

      // Extract the ID from the data attribute we added in M10
      const id = cardBody.dataset.id;

      // Pass the ID to the controller
      handler(id);
    });
  }

  // STAGE M12: Listen for search input
  addHandlerSearch(handler) {
    this._searchInput.addEventListener('input', (e) => {
      // Read, trim, and lowercase as requested in Step 2
      const query = e.target.value.trim().toLowerCase();
      handler(query);
    });
  }
}

export default new MarketView();
