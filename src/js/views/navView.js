class NavView {
  _parentElement = document.querySelector('.bottom-nav');
  _navItems = document.querySelectorAll('.bottom-nav__item');

  /**
   * @description Attaches a click event listener to the navigation bar using event delegation.
   * @param {Function} handler - The controller function to be called when a navigation item is clicked.
   * @returns {void}
   */
  addHandlerClick(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.bottom-nav__item');

      if (!btn) return;

      handler(btn);
    });
  }

  /**
   * @description Updates the visual active state by toggling CSS classes on navigation items.
   * @param {HTMLElement} clickedBtn - The navigation button element that was clicked.
   * @returns {void}
   */
  updateActiveState(clickedBtn) {
    this._navItems.forEach((item) =>
      item.classList.remove('bottom-nav__item--active')
    );

    clickedBtn.classList.add('bottom-nav__item--active');
  }
}

export default new NavView();
