class NavigationView {
  _parentElement = document.querySelector('.bottom-nav');

  addHandlerSwitchView(handler) {
    this._parentElement.addEventListener('click', (e) => {
      // 1. Find the exact button clicked
      const btn = e.target.closest('.bottom-nav__item');
      if (!btn) return;

      // 2. UI FIX: Instantly remove green from ALL buttons, then add to the clicked one
      this._parentElement.querySelectorAll('.bottom-nav__item').forEach((b) => {
        b.classList.remove('bottom-nav__item--active');
      });
      btn.classList.add('bottom-nav__item--active');

      // 3. Send the aria-label to the controller
      const sectionName = btn.getAttribute('aria-label').toLowerCase().trim();
      handler(sectionName);
    });
  }
}

export default new NavigationView();
