class MarketDetailView {
  _parentElement = document.querySelector('#market-detail-hook');

  // Listen for clicks inside the parent element (Event Delegation)
  constructor() {
    this._parentElement.addEventListener('click', (e) => {
      const backBtn = e.target.closest('.btn-back-detail');
      if (backBtn) this.hide();
    });
  }

  // Generate HTML and inject it
  render(listing) {
    if (!listing) return;
    const markup = this._generateMarkup(listing);
    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);
  }

  show() {
    const overlay = this._parentElement.querySelector('.market-detail-overlay');
    if (overlay) {
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
      });
    }
  }

  hide() {
    const overlay = this._parentElement.querySelector('.market-detail-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      // Wait for the slide animation (0.3s) before clearing the HTML
      setTimeout(() => this.clear(), 300);
    }
  }

  clear() {
    this._parentElement.innerHTML = '';
  }

  _generateMarkup(listing) {
    // 1. Image Logic
    const imageMarkup = listing.imageUrl
      ? `<img src="${listing.imageUrl}" alt="${listing.cropName}" class="crop-image-actual">`
      : `<div class="fallback-letter">${listing.cropName.charAt(0)}</div>`;

    // 2. Discount Badge Logic
    const badgeMarkup = listing.discount
      ? `<span class="detail-discount-badge">${listing.discount}% OFF</span>`
      : '';

    // 3. Pricing Logic
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

    // 4. Availability Logic
    const availabilityText =
      listing.availability === 'now'
        ? 'Available Now'
        : `Coming Soon (${listing.availableDate})`;
    const availabilityClass =
      listing.availability === 'now' ? 'status-now' : 'status-soon';

    // 5. Description Logic
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
