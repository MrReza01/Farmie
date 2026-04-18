import * as model from './model/model.js';
import * as scanModel from './model/scanModel.js';
import navView from './views/navView.js';
import modalView from './views/modalView.js';
import resultsView from './views/resultsView.js';
import errorView from './views/errorView.js';
import dashboardView from './views/dashboardView.js';
import chatView from './views/chatView.js';

import navigationView from './views/navigationView.js';
import soilMethodView from './views/soilMethodView.js';
import soilView from './views/soilView.js';
import labFlowView from './views/labFlowView.js';
import kitFlowView from './views/kitFlowView.js';
import diyFlowView from './views/diyFlowView.js';
import questFlowView from './views/questFlowView.js';

import diagnosisView from './views/diagnosisView.js';
import scanHistoryView from './views/scanHistoryView.js';
import scanView from './views/scanView.js';

import marketToastView from './views/marketToastView.js';
import marketDetailView from './views/marketDetailView.js';
import marketView from './views/marketView.js';
import networkView from './views/networkView.js';

const creationState = {
  selectedMethod: null,
  linkedCropThreadId: null,
};

const controlOffline = function () {
  networkView.show();
};

const controlOnline = function () {
  ('Network connection restored.');
  networkView.hide();
};

const controlRetry = function () {
  if (navigator.onLine) {
    controlOnline();
  }
};

const controlNavigation = function (clickedBtn) {
  navView.updateActiveState(clickedBtn);
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
    const crop = userInput.crop.trim();
    const location = userInput.location.trim();

    if (!crop || !location) {
      throw new Error(`Enter both a crop and your farm location`);
    }

    // Validates inputs using letters and spaces only
    const isValidText = /^[a-zA-Z\s]+$/;
    if (!isValidText.test(crop) || !isValidText.test(location)) {
      throw new Error(`Use only letters for crop and location`);
    }

    document.querySelector('.modal').classList.add('modal--hidden');

    document
      .querySelector('.view-dashboard')
      .classList.add('view-dashboard--hidden');
    document.querySelector('.fab').classList.add('fab--hidden');
    document.querySelector('.bottom-nav').classList.add('bottom-nav--hidden');

    document.querySelector('.header').classList.remove('header--hidden');

    document
      .querySelector('.results-container')
      .classList.remove('results-container--hidden');
    resultsView.renderSpinner();

    await model.loadCropReport(userInput.crop, userInput.location);

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

  model.state.currentView = 'form';
};

const controlAddCrop = async function () {
  const newCrop = await model.addCropToDashboard();
  dashboardView.render(model.state.savedCrops);

  document
    .querySelector('.results-container')
    .classList.add('results-container--hidden');
  document.querySelector('.modal').classList.add('modal--hidden');

  // Transitions the UI back to the main dashboard and clears scroll locks
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
};

const controlSelectCrop = function (id) {
  const cropData = model.state.savedCrops.find((crop) => crop.id === id);
  if (!cropData) return;

  chatView.showChat(cropData);
};

const controlDismissShortcut = function (id) {
  const updatedCrop = model.dismissSoilShortcut(id);

  if (updatedCrop) {
    chatView.renderMessages(updatedCrop);
  }
};

const controlSendMessage = async function (id, text) {
  try {
    const updatedCrop = model.addUserMessageToThread(id, text);
    if (updatedCrop) {
      chatView.renderMessages(updatedCrop);
    }

    chatView.showTypingIndicator();

    // Async fetch of AI response based on thread context
    const aiResponseText = await model.getAIResponse(id, text);

    chatView.removeTypingIndicator();

    const finalCropThread = model.addAIMessageToThread(id, aiResponseText);

    if (finalCropThread) {
      chatView.renderMessages(finalCropThread);
    }

    model.bumpCropToTop(id);
    dashboardView.render(model.state.savedCrops);
  } catch {
    chatView.removeTypingIndicator();

    const errorThread = model.addAIMessageToThread(
      id,
      'I seem to have lost my connection. Please try sending that again!'
    );
    chatView.renderMessages(errorThread);
  }
};

const controlCalendarPrompt = function (
  id,
  timestamp,
  activity,
  time,
  isAccepted
) {
  const updatedCrop = model.resolveCalendarPrompt(
    id,
    timestamp,
    activity,
    time,
    isAccepted
  );
  if (updatedCrop) {
    chatView.renderMessages(updatedCrop);
  }
};

const controlConfirmPlanting = async function (id) {
  const plantedCrop = model.confirmPlanting(id);
  if (plantedCrop) {
    chatView.showChat(plantedCrop);
  }

  chatView.showTypingIndicator();

  // Requests predicted harvest metrics and care advice from the AI model
  const finalizedCrop = await model.getHarvestDataFromAI(id);

  chatView.removeTypingIndicator();
  if (finalizedCrop) {
    chatView.renderMessages(finalizedCrop);
  }

  model.bumpCropToTop(id);
  dashboardView.render(model.state.savedCrops);
};

const controlDeleteCrop = function (id) {
  const success = model.deleteCropThread(id);
  if (!success) return;

  dashboardView.removeCropCard(id);

  if (model.state.savedCrops.length === 0) {
    dashboardView.render([]);
  }

  if (chatView._currentThreadId === id) {
    chatView.hideChat();
  }
};

const controlViewSwitcher = function (sectionName) {
  document
    .querySelectorAll('.view')
    .forEach((view) => view.classList.add('view--hidden'));

  document.body.classList.remove('split-screen-active');

  const chatContainer = document.querySelector('.chat-container');
  if (chatContainer) {
    if (sectionName.includes('crop')) {
      chatContainer.style.display = '';
    } else {
      chatContainer.style.display = 'none';
    }
  }

  // Maps navigation labels to their corresponding view container selectors
  const viewMap = {
    crops: '.view-dashboard',
    soil: '.view-soil',
    scan: '.view-scan',
    market: '.view-market',
  };

  const targetClass = viewMap[sectionName] || viewMap['crops'];
  const targetView = document.querySelector(targetClass);
  if (targetView) targetView.classList.remove('view--hidden');

  const fab = document.querySelector('.fab');
  if (fab) {
    if (sectionName.includes('crop')) {
      fab.classList.remove('fab--hidden');
    } else {
      fab.classList.add('fab--hidden');
    }
  }
};

const controlOpenSoilMethod = function (threadId = null) {
  creationState.selectedMethod = null;
  creationState.linkedCropThreadId =
    typeof threadId === 'string' ? threadId : null;

  soilMethodView.toggleModal();
};

const controlClickSoilCard = function (id) {
  const thread = model.state.soilThreads.find((t) => t.id === id);
  if (!thread) return;

  soilView.toggleDashboardVisibility(false);

  // Determines which testing flow or results view to display based on status
  if (thread.status === 'pending') {
    if (thread.method === 'lab-report') {
      labFlowView.render();
    } else if (thread.method === 'basic-kit') {
      kitFlowView.render();
    } else if (thread.method === 'diy-test') {
      diyFlowView.render();
    } else if (thread.method === 'questionnaire') {
      questFlowView.render();
    } else {
      soilView.toggleDashboardVisibility(true);
    }
  } else {
    soilView.renderResultView(thread);
  }
};

const controlSoilMethodContinue = function (selectedMethod) {
  creationState.selectedMethod = selectedMethod;
  soilMethodView.toggleModal();

  let linkedCropTitle = null;
  if (creationState.linkedCropThreadId) {
    const crop = model.state.savedCrops.find(
      (c) => c.id === creationState.linkedCropThreadId
    );
    if (crop) linkedCropTitle = crop.title;
  }

  // Initializes a new soil test thread in the local database
  const newThread = model.saveSoilThread(
    selectedMethod,
    creationState.linkedCropThreadId,
    linkedCropTitle
  );

  soilView.renderSoilCard(newThread);
  soilView.toggleEmptyState(true);

  if (selectedMethod === 'lab-report') {
    soilView.toggleDashboardVisibility(false);
    labFlowView.render();
  } else if (selectedMethod === 'basic-kit') {
    soilView.toggleDashboardVisibility(false);
    kitFlowView.render();
  } else if (selectedMethod === 'diy-test') {
    soilView.toggleDashboardVisibility(false);
    diyFlowView.render();
  } else if (selectedMethod === 'questionnaire') {
    soilView.toggleDashboardVisibility(false);
    questFlowView.render();
  }
};

const controlSubmitLabFlow = async function (formData) {
  try {
    const threadId = getActivePendingThreadId();
    if (!threadId) throw new Error('No pending test found.');

    soilView.renderSpinner();
    const updatedThread = await model.processSoilTestResult(threadId, formData);

    labFlowView.remove();
    soilView.removeSpinner();
    soilView.renderResultView(updatedThread);
  } catch (err) {
    soilView.removeSpinner();
    errorView.render(
      err.message || 'Error connecting to AI. Please try again.'
    );
  }
};

const controlSubmitKitFlow = async function (formData) {
  try {
    const threadId = getActivePendingThreadId();
    if (!threadId) throw new Error('No pending test found.');

    soilView.renderSpinner();
    const updatedThread = await model.processSoilTestResult(threadId, formData);

    kitFlowView.remove();
    soilView.removeSpinner();
    soilView.renderResultView(updatedThread);
  } catch (err) {
    soilView.removeSpinner();
    errorView.render(err.message || 'Something went wrong. Please try again.');
  }
};

const controlSubmitDiyFlow = async function (formData) {
  try {
    const threadId = getActivePendingThreadId();
    if (!threadId) throw new Error('No pending test found.');

    soilView.renderSpinner();
    const updatedThread = await model.processSoilTestResult(threadId, formData);

    diyFlowView.remove();
    soilView.removeSpinner();
    soilView.renderResultView(updatedThread);
  } catch (err) {
    soilView.removeSpinner();
    errorView.render(err.message || 'Something went wrong. Please try again.');
  }
};

const controlSubmitQuestFlow = async function (formData) {
  try {
    const threadId = getActivePendingThreadId();
    if (!threadId) throw new Error('No pending test found.');

    soilView.renderSpinner();
    const updatedThread = await model.processSoilTestResult(threadId, formData);

    questFlowView.remove();
    soilView.removeSpinner();
    soilView.renderResultView(updatedThread);
  } catch (err) {
    soilView.removeSpinner();
    errorView.render(err.message || 'Something went wrong. Please try again.');
  }
};

// Handles clicking "Back" on the Lab Form
const controlCloseLabFlow = function () {
  labFlowView.remove(); // Destroy the form
  soilView.toggleDashboardVisibility(true); // Bring the dashboard back
};

// Handles clicking "Get Recommendations"

// Handles clicking "Back" on the Kit Form
const controlCloseKitFlow = function () {
  kitFlowView.remove(); // Destroy the form
  soilView.toggleDashboardVisibility(true); // Bring the dashboard back
};

// Handles clicking "Back" on the DIY Form
const controlCloseDiyFlow = function () {
  diyFlowView.remove();
  soilView.toggleDashboardVisibility(true);
};

// Handles clicking "Back" on Step 1 of the Questionnaire
const controlCloseQuestFlow = function () {
  questFlowView.remove();
  soilView.toggleDashboardVisibility(true);
};

// Helper to grab the thread the user is currently working on
const getActivePendingThreadId = () => {
  // Finds the most recently created thread that is still 'pending'
  const threads = model.state.soilThreads;
  const pendingThreads = threads.filter((t) => t.status === 'pending');
  return pendingThreads.length > 0
    ? pendingThreads[pendingThreads.length - 1].id
    : null;
};

const controlLinkedSoilTest = function (cropId) {
  // 1. Tell the Model to permanently hide the shortcut for this crop
  const updatedCrop = model.dismissSoilShortcut(cropId);

  // 2. Re-render the chat so the button instantly disappears from the screen
  if (updatedCrop) {
    chatView.renderMessages(updatedCrop);
  }

  // 3. THE MAGIC BULLET: Target the aria-label and simulate a native click!
  const soilNavButton = document.querySelector(
    '.bottom-nav__item[aria-label="Soil"]'
  );

  if (soilNavButton) {
    soilNavButton.click(); // This fires native navigation listener perfectly
  }
};

const controlDeleteSoilCard = function (id) {
  // 1. Erase from the Model/Database
  const success = model.deleteSoilThread(id);
  if (!success) return;

  // 2. Fade it out of the Soil Dashboard smoothly
  soilView.removeSoilCard(id);

  // 3. Check if we need to show the Empty State illustration
  if (model.state.soilThreads.length === 0) {
    soilView.render([]); // Or whatever method you use to draw the empty state!
  }
};

// ================SCAN SECTIION ===========

const controlStartScan = async function (imageData, cropName) {
  try {
    scanView.showLoader();

    // Call the REAL AI API
    const diagnosisData = await model.analyzePlantImage(imageData, cropName);

    scanView.hideLoader();

    // --- NEW: Paint the UI ---
    diagnosisView.renderDiagnosis(diagnosisData, imageData, cropName);
  } catch {
    scanView.hideLoader();

    // --- NEW: Show UI Error ---
    scanView.renderError(
      'Unable to analyze the image right now. Please check your internet connection or try a clearer photo.'
    );
  }
};

const controlSaveScan = function (imageData, cropName, diagnosisData) {
  // Save to DB
  model.saveScanRecord(imageData, cropName, diagnosisData);
};

const controlShowHistory = function () {
  // 1. Get data from Model
  const historyData = model.loadScanHistory();

  // 2. Pass data to View to render the list
  scanHistoryView.renderHistoryList(historyData);

  // 3. Slide the screen in
  scanHistoryView.showHistory();
};

const controlViewHistoricalScan = function (id) {
  // 1. Get the specific scan data from the model
  const scanRecord = model.getScanById(id);
  if (!scanRecord) return;

  // 2. Pass the saved data to the diagnosis screen
  // Note the 4th parameter 'true' flags this as a historical record!
  diagnosisView.renderDiagnosis(
    scanRecord.diagnosis,
    scanRecord.imageData,
    scanRecord.cropName || '',
    true
  );
};

const controlAddListing = async function (listingData) {
  const newListing = scanModel.addListing(listingData);
  marketToastView.render('Listing added successfully!');

  setTimeout(() => {
    marketView.resetForm();
  }, 2500);

  try {
    // Fetches descriptive imagery from Wikipedia API to enrich the listing
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(newListing.cropName)}`
    );
    if (!res.ok) throw new Error('Wiki image not found');

    const data = await res.json();
    if (data.thumbnail && data.thumbnail.source) {
      scanModel.updateListingImage(newListing.id, data.thumbnail.source);
    }
  } catch (err) {
    ('Background Wiki Fetch failed, using fallback later:', err.message);
  }
};

const controlToggleBuyer = function () {
  const listings = scanModel.loadListings();
  marketView.renderListingCards(listings);
};

const controlListingDetail = function (id) {
  const listing = scanModel.getListingById(id);
  if (!listing) return;

  marketDetailView.render(listing);
  marketDetailView.show();
};

const controlMarketSearch = function (query) {
  const allListings = scanModel.loadListings();

  if (!query) {
    marketView.renderListingCards(allListings);
    return;
  }

  const filteredListings = allListings.filter((listing) =>
    listing.cropName.toLowerCase().includes(query)
  );

  marketView.renderListingCards(filteredListings, query);
};

const init = function () {
  if (!navigator.onLine) {
    controlOffline();
  }

  networkView.addHandlerNetwork(controlOffline, controlOnline);
  networkView.addHandlerRetry(controlRetry);

  const didCropsExpire = model.checkExpiredThreads();
  if (didCropsExpire) {
    `Expired crops removed`;
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
  chatView.addHandlerDismissShortcut(controlDismissShortcut);
  chatView.addHandlerSendMessage(controlSendMessage);
  chatView.addHandlerCalendarPrompt(controlCalendarPrompt);
  chatView.addHandlerConfirmPlanting(controlConfirmPlanting);
  dashboardView.addHandlerCardMenu();
  dashboardView.addHandlerDeleteConfirm(controlDeleteCrop);
  chatView.addHandlerToggleCalendar();

  navigationView.addHandlerSwitchView(controlViewSwitcher);
  soilMethodView.addHandlerSelectMethod();
  soilMethodView.addHandlerClose();
  soilMethodView.addHandlerContinue(controlSoilMethodContinue);
  soilMethodView.addHandlerOpenMethod(controlOpenSoilMethod);

  model.loadSoilThreads();

  if (model.state.soilThreads.length > 0) {
    model.state.soilThreads.forEach((thread) =>
      soilView.renderSoilCard(thread)
    );
    soilView.toggleEmptyState(true);
  } else {
    soilView.toggleEmptyState(false);
  }
  soilView.addHandlerClickCard(controlClickSoilCard);
  labFlowView.addHandlerClose(controlCloseLabFlow);

  labFlowView.addHandlerSubmit(controlSubmitLabFlow);
  kitFlowView.addHandlerClose(controlCloseKitFlow);

  kitFlowView.addHandlerSubmit(controlSubmitKitFlow);
  diyFlowView.addHandlerClose(controlCloseDiyFlow);

  diyFlowView.addHandlerSubmit(controlSubmitDiyFlow);
  questFlowView.addHandlerClose(controlCloseQuestFlow);
  questFlowView.addHandlerSubmit(controlSubmitQuestFlow);
  chatView.addHandlerSoilShortcut(controlLinkedSoilTest);
  soilView.addHandlerDeleteIconClick();
  soilView.addHandlerDeleteConfirm(controlDeleteSoilCard);

  scanView.addHandlerStartScan(controlStartScan);
  scanView.addHandlerShowHistory(controlShowHistory);
  diagnosisView.addHandlerSaveHistory(controlSaveScan);
  scanHistoryView.addHandlerClickCard(controlViewHistoricalScan);
  marketView.init();
  marketView.addHandlerSubmit(controlAddListing);
  marketView.addHandlerToggleBuyer(controlToggleBuyer);
  marketView.addHandlerClickCard(controlListingDetail);
  marketView.addHandlerSearch(controlMarketSearch);
};

init();
