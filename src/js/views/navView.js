class NavView {
  _parentElement = document.querySelector('.bottom-nav');
  _navItems = document.querySelectorAll('.bottom-nav__item');

  addHandlerClick(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.bottom-nav__item');

      if (!btn) return;

      handler(btn);
    });
  }
  updateActiveState(clickedBtn) {
    this._navItems.forEach((item) =>
      item.classList.remove('bottom-nav__item--active')
    );

    // Adding active class to the clicked item
    clickedBtn.classList.add('bottom-nav__item--active');
  }
}

export default new NavView();
