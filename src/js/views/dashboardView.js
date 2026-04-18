import { WARNING_THRESHOLD } from '../model/model.js';

class DashboardView {
  _parentElement = document.querySelector('.dashboard__crops-list');
  _deleteModalInjected = false;
  _cropToDeleteId = null;

  /**
   * @description Renders the crop cards to the dashboard or displays an empty state if no data exists.
   * @param {Array} data - Array of crop thread objects to be rendered.
   * @returns {void}
   */
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

    return `
    <div class="crop-card" data-id="${thread.id}">
      <div class="crop-card__image-container">
        ${imageMarkup}
      </div>
      
    <div class="crop-card__content">
        
        <div class="crop-card__info">
          <h3 class="crop-card__title">${thread.title}</h3>
          <span class="crop-card__status crop-card__status--${thread.status}">${thread.status.replace(/-/g, ' ')}</span>
          <p class="crop-card__summary">Tap to view your 5-day AI plan</p>
        </div>

        ${warningBadge}

        <div class="card-menu">
          <i class="fa-solid fa-ellipsis-vertical card-menu__icon"></i>
          <div class="card-menu__dropdown">
            
            <div class="card-menu__dropdown-header">
              <i class="fa-solid fa-xmark btn-close-dropdown"></i>
            </div>
            
            <button class="btn-card-delete">
              <i class="fa-solid fa-trash-can"></i> Delete Plan
            </button>
          </div>
        </div>
        
      </div>

        ${warningBadge}
        
      </div>
    </div>
    `;
  }

  /**
   * @description Attaches a click handler to the dashboard crops list for navigating to crop details.
   * @param {Function} handler - The controller function to handle the selection.
   * @returns {void}
   */
  addHandlerClickCrop(handler) {
    this._parentElement.addEventListener('click', function (e) {
      if (e.target.closest('.card-menu')) return;
      // Finds the specific card element within the dashboard list
      const clickedCard = e.target.closest('.crop-card');

      if (!clickedCard) return;

      const id = clickedCard.dataset.id;
      handler(id);
    });
  }

  /**
   * @description Attaches event handlers for managing the crop card dropdown menus and delete actions.
   * @returns {void}
   */
  addHandlerCardMenu() {
    this._parentElement.addEventListener('click', (e) => {
      // Closes menu if the close button is clicked
      if (e.target.closest('.btn-close-dropdown')) {
        document
          .querySelectorAll('.card-menu__dropdown')
          .forEach((d) => d.classList.remove('card-menu__dropdown--active'));
        e.stopPropagation();
        return;
      }

      // 2. If they click Delete, trigger the Danger Modal
      const deleteBtn = e.target.closest('.btn-card-delete');
      if (deleteBtn) {
        const card = e.target.closest('.crop-card');
        if (card) {
          this.showDeleteModal(card.dataset.id); // This will no longer fail!
        }

        // Hide the dropdown immediately
        document
          .querySelectorAll('.card-menu__dropdown')
          .forEach((d) => d.classList.remove('card-menu__dropdown--active'));
        e.stopPropagation();
        return;
      }

      // 3. If they click the 3-dot icon, open the menu
      const menuIcon = e.target.closest('.card-menu__icon');

      document.querySelectorAll('.card-menu__dropdown').forEach((dropdown) => {
        dropdown.classList.remove('card-menu__dropdown--active');
      });

      if (menuIcon) {
        const dropdown = menuIcon.nextElementSibling;
        dropdown.classList.toggle('card-menu__dropdown--active');
        e.stopPropagation();
      }
    });

    window.addEventListener('click', () => {
      document.querySelectorAll('.card-menu__dropdown').forEach((dropdown) => {
        dropdown.classList.remove('card-menu__dropdown--active');
      });
    });
  }

  _injectDeleteModal() {
    if (this._deleteModalInjected) return;

    const markup = `
      <div class="modal-overlay" id="delete-modal">
        <div class="delete-modal">
          <div class="delete-modal__icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="delete-modal__title">Delete this crop plan?</h3>
          <p class="delete-modal__text">This cannot be undone. Your saved schedule and chat history will be permanently erased.</p>
          <div class="delete-modal__actions">
            <button class="btn-delete-cancel" id="btn-cancel-delete">Cancel</button>
            <button class="btn-delete-confirm">Yes, Delete</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', markup);

    document
      .getElementById('btn-cancel-delete')
      .addEventListener('click', () => this.hideDeleteModal());

    document
      .querySelector('.btn-delete-confirm')
      .addEventListener('click', () => {
        const targetId = this._cropToDeleteId;

        this.hideDeleteModal();

        if (this._deleteHandler && targetId) {
          this._deleteHandler(targetId);
        }
      });

    this._deleteModalInjected = true;
  }

  /**
   * @description Displays the delete confirmation modal for a specific crop plan.
   * @param {string} id - The ID of the crop thread to be marked for deletion.
   * @returns {void}
   */
  showDeleteModal(id) {
    this._injectDeleteModal();
    this._cropToDeleteId = id;
    document
      .getElementById('delete-modal')
      .classList.add('modal-overlay--active');
  }

  /**
   * @description Hides the delete confirmation modal.
   * @returns {void}
   */
  hideDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('modal-overlay--active');
    this._cropToDeleteId = null;
  }

  /**
   * @description Attaches a handler to be executed when the user confirms deletion in the modal.
   * @param {Function} handler - The controller function to handle deletion logic.
   * @returns {void}
   */
  addHandlerDeleteConfirm(handler) {
    this._deleteHandler = handler;
  }

  /**
   * @description Removes a specific crop card from the DOM with a transition.
   * @param {string} id - The ID of the crop card to remove.
   * @returns {void}
   */
  removeCropCard(id) {
    const card = this._parentElement.querySelector(
      `.crop-card[data-id="${id}"]`
    );
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => card.remove(), 300);
    }
  }
}

export default new DashboardView();
