class ModalView {
  _parentElement = document.querySelector('.modal');
  _btnClose = document.querySelector('.modal__back-btn');
  _fabBtn = document.querySelector('.fab');
  _bottomNav = document.querySelector('.bottom-nav');
  _header = document.querySelector('.header');
  _mainView = document.querySelector('.view-dashboard');

  _form = document.querySelector('.modal__form');
  _cropInput = document.querySelector('#crop');
  _locationInput = document.querySelector('#location');

  addHandlerOpenModal(handler) {
    this._fabBtn.addEventListener('click', () => {
      this._fabBtn.classList.remove('fab--pulsing');
      handler();
    });
  }

  addHandlerCloseModal(handler) {
    this._btnClose.addEventListener('click', handler);
  }

  addHandlerSubmitPlan(handler) {
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = {
        crop: this._cropInput.value,
        location: this._locationInput.value,
      };

      handler(data);
    });
  }

  clearInputs() {
    this._cropInput.value = '';
    this._locationInput.value = '';
  }

  toggleModal() {
    this._parentElement.classList.toggle('modal--hidden');

    this._bottomNav.classList.toggle('bottom-nav--hidden');

    this._fabBtn.classList.toggle('fab--hidden');

    this._header.classList.toggle('header--hidden');

    this._mainView.classList.toggle('view-dashboard--hidden');
  }
}

export default new ModalView();
