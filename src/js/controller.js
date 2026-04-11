import * as model from './model.js';
import navView from './views/navView.js';
import modalView from './views/modalView.js';
import resultsView from './views/resultsView.js';
import errorView from './views/errorView.js';
import dashboardView from './views/dashboardView.js';
import chatView from './views/chatView.js';
// SOIL SECTION IMPORTS
import navigationView from './views/navigationView.js';

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

const controlSelectCrop = function (id) {
  // 1. Find the specific crop data from your model using the ID
  const cropData = model.state.savedCrops.find((crop) => crop.id === id);

  if (!cropData) return; // Safety check

  // 2. Pass that specific data into the chat view!
  chatView.showChat(cropData);
};

const controlDismissShortcut = function (id) {
  // 1. Tell the model to update the database
  const updatedCrop = model.dismissSoilShortcut(id);

  // 2. If successful, instantly re-render the chat bubbles (which makes the shortcut disappear!)
  if (updatedCrop) {
    chatView.renderMessages(updatedCrop);
  }
};

// --- STAGE B4: LIVE CHAT CONTROLLER ---

const controlSendMessage = async function (id, text) {
  try {
    // 1. Save the user's message and instantly render it on the right side
    const updatedCrop = model.addUserMessageToThread(id, text);
    if (updatedCrop) {
      chatView.renderMessages(updatedCrop);
    }

    // 2. Turn on the "Farmie is typing..." bouncing dots
    chatView.showTypingIndicator();

    // 3. Send the context and the text to Groq (Awaits the real API response!)
    const aiResponseText = await model.getAIResponse(id, text);

    // 4. The response arrived! Instantly kill the bouncing dots
    chatView.removeTypingIndicator();

    // 5. Save the new AI text to the database
    const finalCropThread = model.addAIMessageToThread(id, aiResponseText);

    // 6. Re-render the chat to show the final green AI bubble!
    if (finalCropThread) {
      chatView.renderMessages(finalCropThread);
    }

    // 1. Move the data to the top of the database
    model.bumpCropToTop(id);

    // 2. Refresh the dashboard sidebar instantly to show the new order
    dashboardView.render(model.state.savedCrops);
  } catch (error) {
    console.error('Chat flow failed:', error);
    chatView.removeTypingIndicator();

    // Fallback: If the internet drops, save an error message so the user isn't stuck
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
    chatView.renderMessages(updatedCrop); // Re-render to hide the widget!
  }
};

// --- STAGE B5: CONTROLLER LOGIC ---

const controlConfirmPlanting = async function (id) {
  // 1. Instantly update the status to 'planted' and hide the Plant button
  const plantedCrop = model.confirmPlanting(id);
  if (plantedCrop) {
    chatView.showChat(plantedCrop); // Re-renders the header instantly
  }

  // 2. Show the "Farmie is typing..." dots
  chatView.showTypingIndicator();

  // 3. Fetch the custom harvest data and message from the AI
  const finalizedCrop = await model.getHarvestDataFromAI(id);

  // 4. Remove the typing dots and render the final AI congratulatory message
  chatView.removeTypingIndicator();
  if (finalizedCrop) {
    chatView.renderMessages(finalizedCrop);
  }

  // 1. Move the data to the top of the database
  model.bumpCropToTop(id);

  // 2. Refresh the dashboard sidebar instantly to show the new order
  dashboardView.render(model.state.savedCrops);
};

const controlDeleteCrop = function (id) {
  // 1. Erase from the Model/Database
  const success = model.deleteCropThread(id);
  if (!success) return;

  // 2. Fade it out of the Dashboard UI smoothly
  dashboardView.removeCropCard(id);

  // 3. NEW: Check if we need to show the Empty State
  // If the internal array is now empty, re-render to show the illustration
  if (model.state.savedCrops.length === 0) {
    dashboardView.render([]);
  }

  if (chatView._currentThreadId === id) {
    chatView.hideChat();
  }
};

// =========================================================================================== SOIL SECTION (COME BACK HERE BEFORE YOU START TO WORK ON THE OTHER SECTIONS) ===================================================================================

// --- VIEW SWITCHER CONTROLLER ---
const controlViewSwitcher = function (sectionName) {
  // 1. Hide all main views
  document
    .querySelectorAll('.view')
    .forEach((view) => view.classList.add('view--hidden'));

  // 2. Reset the desktop layout
  document.body.classList.remove('split-screen-active');

  // 3. THE CHAT KILL-SWITCH
  const chatContainer = document.querySelector('.chat-container');
  if (chatContainer) {
    if (sectionName.includes('crop')) {
      // If returning to crops, remove our JS lock so your normal chat code works again
      chatContainer.style.display = '';
    } else {
      // If going to ANY other tab (like Soil), violently hide the chat
      chatContainer.style.display = 'none';
    }
  }

  // 2. The "View Dictionary": Maps aria-labels to exact HTML classes
  const viewMap = {
    crops: '.view-dashboard', // Assuming aria-label is "Crops"
    soil: '.view-soil',
    scan: '.view-scan', // Example for your 3rd icon
    market: '.view-market', // Example for your 4rd icon
  };

  // 3. Look up the correct class and show it
  const targetClass = viewMap[sectionName] || viewMap['crops']; // Defaults to crops if not found
  const targetView = document.querySelector(targetClass);
  if (targetView) targetView.classList.remove('view--hidden');

  // ... inside controlViewSwitcher ...

  // Add this line to see exactly what the browser thinks you clicked:
  console.log('Current Section is:', sectionName);

  // 4. Handle the FAB visibility
  const fab = document.querySelector('.fab');
  if (fab) {
    if (sectionName.includes('crop')) {
      console.log('Showing FAB');
      fab.classList.remove('fab--hidden');
    } else {
      console.log('Hiding FAB');
      fab.classList.add('fab--hidden');
    }
  }
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
  chatView.addHandlerDismissShortcut(controlDismissShortcut);
  chatView.addHandlerSendMessage(controlSendMessage);
  chatView.addHandlerCalendarPrompt(controlCalendarPrompt);
  chatView.addHandlerConfirmPlanting(controlConfirmPlanting);
  dashboardView.addHandlerCardMenu();
  dashboardView.addHandlerDeleteConfirm(controlDeleteCrop);

  // ===================================== SOIL SECTION==================================

  navigationView.addHandlerSwitchView(controlViewSwitcher);
};

init();
