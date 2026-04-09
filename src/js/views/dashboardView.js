import { WARNING_THRESHOLD } from '../model.js';

class DashboardView {
  _parentElement = document.querySelector('.dashboard__crops-list');

  render(data) {
    const emptyState = document.querySelector('.empty-state');

    if (!data || (Array.isArray(data) && data.length === 0)) {
      this._parentElement.innerHTML = '';
      if (emptyState) emptyState.classList.remove('empty-state--hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('empty-state--hidden');

    this._parentElement.innerHTML = '';
    const markup = data.map(this._generateMarkup.bind(this)).join('');
    this._parentElement.insertAdjacentHTML('afterbegin', markup);

    // NEW FIX: Instantly snap the dashboard to the top the exact moment new data is rendered!
    const dashboardContainer = document.querySelector('.view-dashboard');
    if (dashboardContainer) {
      dashboardContainer.scrollTop = 0;
    }
  }

  _generateMarkup(thread) {
    const imageMarkup = thread.imageUrl
      ? `<img src="${thread.imageUrl}" alt="${thread.crop}" class="crop-card__img">`
      : `<div class="crop-card__fallback-img">
  ${thread.crop.charAt(0).toUpperCase()}
</div>`;

    const now = new Date();
    const expiryDate = new Date(thread.expiresAt);
    const timeRemaining = expiryDate - now;

    const isExpiringSoon =
      thread.plantedAt === null &&
      timeRemaining > 0 &&
      timeRemaining <= WARNING_THRESHOLD;

    const warningBadge = isExpiringSoon
      ? `<div class="crop-card__warning-badge"><i class="fa-solid fa-triangle-exclamation"></i> Action Required</div>`
      : '';

    // 3. Return the HTML
    return `
    <div class="crop-card" data-id="${thread.id}">
      <div class="crop-card__image-container">
        ${imageMarkup}
      </div>
      
      <div class="crop-card__content">
        
        <div class="crop-card__info">
          <h3 class="crop-card__title">${thread.title}</h3>
          <span class="crop-card__status crop-card__status--${thread.status}">${thread.status.replace(/-/g, '')}</span>
          <p class="crop-card__summary">Tap to view your 5-day AI plan</p>
        </div>

        ${warningBadge}
        
      </div>
    </div>
    `;
  }

  addHandlerClickCrop(handler) {
    this._parentElement.addEventListener('click', function (e) {
      // BUG FIX: Added the missing period (.) so it correctly finds the CSS class!
      const clickedCard = e.target.closest('.crop-card');

      if (!clickedCard) return;

      const id = clickedCard.dataset.id;
      handler(id);
    });
  }
}

export default new DashboardView();
