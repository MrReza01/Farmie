import * as model from './model.js';
import navView from './views/navView.js';
import modalView from './views/modalView.js';
import resultsView from './views/resultsView.js';
import errorView from './views/errorView.js';

const controlNavigation = function (clickedBtn) {
  navView.updateActiveState(clickedBtn);

  // LATER
};

const controlOpenModal = function () {
  model.state.isModalOpen = false;
  modalView.toggleModal();
};

const controlCloseModal = function () {
  model.state.isModalOpen = false;
  modalView.toggleModal();
};

const controlGeneratePlan = async function (userInput) {
  try {
    // FORM VALIDATION
    const crop = userInput.crop.trim();
    const location = userInput.location.trim();

    if (!crop || !location) {
      throw new Error(`Enter both a crop and your farm location`);
    }

    const isValidText = /^[a-zA-Z\s]+$/;
    if (!isValidText.test(crop) || !isValidText.test(location)) {
      throw new Error(`Use only letters for crop and location`);
    }

    // hiding the form when both of the inputs are valid
    document.querySelector('.modal').classList.add('modal--hidden');

    // to hide the mainpage fab, buttom nav
    document
      .querySelector('.view-dashboard')
      .classList.add('view-dashboard--hidden');
    document.querySelector('.fab').classList.add('fab--hidden');
    document.querySelector('.bottom-nav').classList.add('bottom-nav--hidden');

    // to show header and spinner
    document.querySelector('.header').classList.remove('header--hidden');

    document
      .querySelector('.results-container')
      .classList.remove('results-container--hidden');
    resultsView.renderSpinner();

    //  AWAITING THE DATA

    await model.loadCropReport(userInput.crop, userInput.location);

    //  modal to return to day for a new serach
    resultsView._currentDayIndex = 0;

    resultsView.render(model.state.report);
    model.state.currentView = 'results';
    modalView.clearInputs();
  } catch (err) {
    errorView.render(err.message);

    document.querySelector('.header').classList.add('header--hidden');
    document
      .querySelector('.results-container')
      .classList.add('results-container--hidden');

    document.querySelector('.modal').classList.remove('modal--hidden');
  }
};

const controlCloseResults = function () {
  document
    .querySelector('.results-container')
    .classList.add('results-container--hidden');
  resultsView._clear();

  document.querySelector('.modal').classList.remove('modal--hidden');
  document.querySelector('.header').classList.add('header--hidden');

  // model.state.currentView = 'dashboard';
  model.state.currentView = 'form';
};

const init = function () {
  navView.addHandlerClick(controlNavigation);
  modalView.addHandlerOpenModal(controlOpenModal);
  modalView.addHandlerCloseModal(controlCloseModal);
  modalView.addHandlerSubmitPlan(controlGeneratePlan);

  resultsView.addHandlerToggleDetails();
  resultsView.addHandlerCarousel();

  resultsView.addHandlerClose(controlCloseResults);
};

init();
