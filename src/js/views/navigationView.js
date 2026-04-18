class NavigationView {
  _parentElement = document.querySelector('.bottom-nav');

  /**
   * @description Attaches a click event listener to the navigation bar to handle view switching.
   * @param {Function} handler - The controller function that receives the section name.
   * @returns {void}
   */
  addHandlerSwitchView(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.bottom-nav__item');
      if (!btn) return;

      // Resets the active state for all navigation items before activating the clicked element
      this._parentElement.querySelectorAll('.bottom-nav__item').forEach((b) => {
        b.classList.remove('bottom-nav__item--active');
      });
      btn.classList.add('bottom-nav__item--active');

      const sectionName = btn.getAttribute('aria-label').toLowerCase().trim();
      handler(sectionName);
    });
  }
}

export default new NavigationView();
