class MarketDetailView {
  _parentElement = document.querySelector('#market-detail-hook');

  constructor() {
    this._parentElement.addEventListener('click', (e) => {
      const backBtn = e.target.closest('.btn-back-detail');
      if (backBtn) this.hide();
    });
  }

  /**
   * @description Renders the detail view for a specific market listing.
   * @param {Object} listing - The listing data object to render.
   * @returns {void}
   */
  render(listing) {
    if (!listing) return;
    const markup = this._generateMarkup(listing);
    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);
  }

  /**
   * @description Displays the detail overlay with a slide-in animation.
   * @returns {void}
   */
  show() {
    const overlay = this._parentElement.querySelector('.market-detail-overlay');
    if (overlay) {
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
      });
    }
  }

  /**
   * @description Hides the detail overlay and clears content after the animation completes.
   * @returns {void}
   */
  hide() {
    const overlay = this._parentElement.querySelector('.market-detail-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      // Synchronize DOM cleanup with the CSS transition duration
      setTimeout(() => this.clear(), 300);
    }
  }

  /**
   * @description Clears the detail view container.
   * @returns {void}
   */
  clear() {
    this._parentElement.innerHTML = '';
  }

  _generateMarkup(listing) {
    const imageMarkup = listing.imageUrl
      ? `<img src="${listing.imageUrl}" alt="${listing.cropName}" class="crop-image-actual">`
      : `<div class="fallback-letter">${listing.cropName.charAt(0)}</div>`;

    const badgeMarkup = listing.discount
      ? `<span class="detail-discount-badge">${listing.discount}% OFF</span>`
      : '';

    const priceMarkup = listing.discountedPrice
      ? `
        <div class="detail-pricing has-discount">
          <span class="detail-price-original">₦${listing.price} / ${listing.unit}</span>
          <span class="detail-price-discounted">₦${listing.discountedPrice} / ${listing.unit}</span>
        </div>
      `
      : `
        <div class="detail-pricing">
          <span class="detail-price-discounted">₦${listing.price} / ${listing.unit}</span>
        </div>
      `;

    const availabilityText =
      listing.availability === 'now'
        ? 'Available Now'
        : `Coming Soon (${listing.availableDate})`;
    const availabilityClass =
      listing.availability === 'now' ? 'status-now' : 'status-soon';

    const descriptionMarkup = listing.description
      ? `
        <div class="detail-description-section">
          <span class="info-label">Description</span>
          <p class="detail-description-text">${listing.description}</p>
        </div>
      `
      : '';

    return `
      <div class="market-detail-overlay">
        
        <header class="detail-header">
          <button class="btn-back-detail" aria-label="Go back to listings">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2 class="detail-header-title">${listing.cropName}</h2>
        </header>

        <div class="detail-scroll-body">
          
          <div class="detail-image-wrapper">
            ${imageMarkup}
          </div>

          <div class="detail-content">
            ${badgeMarkup}
            <h1 class="detail-crop-name">${listing.cropName}</h1>
            
            ${priceMarkup}

            <div class="detail-info-grid">
              <div class="info-item">
                <span class="info-label">Quantity</span>
                <span class="info-value">${listing.quantity} ${listing.unit}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Location</span>
                <span class="info-value">${listing.location}</span>
              </div>
            </div>

            <div class="detail-availability-section">
              <span class="info-label">Availability</span>
              <div class="status-pill ${availabilityClass}">${availabilityText}</div>
            </div>

            ${descriptionMarkup}
          </div>

          <div class="detail-footer">
            <a href="https://mrreza.netlify.app" target="_blank" class="btn-contact-farmer-full">Contact Farmer</a>
          </div>

        </div>
      </div>
    `;
  }
}

export default new MarketDetailView();
