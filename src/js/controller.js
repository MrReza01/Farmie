import * as model from './model.js';
import navView from './views/navView.js';
import modalView from './views/modalView.js';
import resultsView from './views/resultsView.js';
import errorView from './views/errorView.js';
import dashboardView from './views/dashboardView.js';
import chatView from './views/chatView.js';

const controlNavigation = function (clickedBtn) {
  navView.updateActiveState(clickedBtn);

  // LATER
};

const controlOpenModal = function () {
  model.state.isModalOpen = false;
  modalView.toggleModal();

  if (document.body.classList.contains('split-screen-active')) {
    chatView.disableSplitScreen();

    document.body.dataset.restoreSplit = 'true';
  }
};

const controlCloseModal = function () {
  model.state.isModalOpen = false;
  modalView.toggleModal();

  if (document.body.dataset.restoreSplit === 'true') {
    chatView.showChat();
    delete document.body.dataset.restoreSplit;
  }
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

const controlAddCrop = async function () {
  try {
    const newCrop = await model.addCropToDashboard();

    dashboardView.render(model.state.savedCrops);

    // ... inside controlAddCrop ...

    document
      .querySelector('.results-container')
      .classList.add('results-container--hidden');
    document.querySelector('.modal').classList.add('modal--hidden');

    document
      .querySelector('.view-dashboard')
      .classList.remove('view-dashboard--hidden');

    // FIX 1: Aggressively remove scroll locks from both body and html
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');

    const fab = document.querySelector('.fab');
    if (fab) fab.classList.remove('fab--hidden');

    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.classList.remove('bottom-nav--hidden');

    const header = document.querySelector('.header');
    if (header) header.classList.remove('header--hidden');

    chatView.showChat(newCrop);
  } catch (err) {
    console.error(`Error saving crop:`, err);
  }
};

// Inside controller.js

const controlSelectCrop = function (id) {
  // 1. Find the specific crop data from your model using the ID
  const cropData = model.state.savedCrops.find((crop) => crop.id === id);

  if (!cropData) return; // Safety check

  // 2. Pass that specific data into the chat view!
  chatView.showChat(cropData);
};

const init = function () {
  const didCropsExpire = model.checkExpiredThreads();
  if (didCropsExpire) {
    console.log(`Expired crops removed`);
  }

  dashboardView.render(model.state.savedCrops);
  navView.addHandlerClick(controlNavigation);
  modalView.addHandlerOpenModal(controlOpenModal);
  modalView.addHandlerCloseModal(controlCloseModal);
  modalView.addHandlerSubmitPlan(controlGeneratePlan);

  resultsView.addHandlerAddCrop(controlAddCrop);

  resultsView.addHandlerToggleDetails();
  resultsView.addHandlerCarousel();

  resultsView.addHandlerClose(controlCloseResults);

  dashboardView.addHandlerClickCrop(controlSelectCrop);
};

init();
