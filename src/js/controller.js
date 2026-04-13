import * as model from './model.js';
import navView from './views/navView.js';
import modalView from './views/modalView.js';
import resultsView from './views/resultsView.js';
import errorView from './views/errorView.js';
import dashboardView from './views/dashboardView.js';
import chatView from './views/chatView.js';

// SOIL SECTION IMPORTS
import navigationView from './views/navigationView.js';
import soilMethodView from './views/soilMethodView.js';
import soilView from './views/soilView.js';
import labFlowView from './views/labFlowView.js';
import kitFlowView from './views/kitFlowView.js';
import diyFlowView from './views/diyFlowView.js';
import questFlowView from './views/questFlowView.js';

// --- SOIL TEST CREATION STATE ---
const creationState = {
  selectedMethod: null,
  linkedCropThreadId: null,
};

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

  // 4. Handle the FAB visibility
  const fab = document.querySelector('.fab');
  if (fab) {
    if (sectionName.includes('crop')) {
      fab.classList.remove('fab--hidden');
    } else {
      fab.classList.add('fab--hidden');
    }
  }
};

// Opens the modal and optionally links a crop thread
const controlOpenSoilMethod = function (threadId = null) {
  // 1. Reset state for a fresh flow
  creationState.selectedMethod = null;
  creationState.linkedCropThreadId =
    typeof threadId === 'string' ? threadId : null;

  // 2. Open the UI
  soilMethodView.toggleModal();
};

// Handles tapping an existing soil card on the dashboard
const controlClickSoilCard = function (id) {
  // 1. Find the specific thread in our database
  const thread = model.state.soilThreads.find((t) => t.id === id);
  if (!thread) return;

  // 2. Hide the main dashboard so we can show the details
  soilView.toggleDashboardVisibility(false);

  // 3. Route based on the thread's status
  if (thread.status === 'pending') {
    // RESUME THE TEST: Open the correct input flow
    if (thread.method === 'lab-report') {
      labFlowView.render();
    } else if (thread.method === 'basic-kit') {
      kitFlowView.render();
    } else if (thread.method === 'diy-test') {
      diyFlowView.render();
    } else if (thread.method === 'questionnaire') {
      questFlowView.render(); // <-- This guarantees the questionnaire opens!
    } else {
      console.log(
        `🚧 The flow for ${thread.method} is still under construction!`
      );
      soilView.toggleDashboardVisibility(true);
    }
  } else {
    // VIEW RESULTS: The test is completed
    soilView.renderResultView(thread);
  }
};

// Handles the final "Continue" click from the Method Modal
const controlSoilMethodContinue = function (selectedMethod) {
  // 1. Save to temporary state
  creationState.selectedMethod = selectedMethod;

  // 2. Hide the modal
  soilMethodView.toggleModal();

  // 3. Attempt to find the Linked Crop Title (if we came from a crop thread)
  let linkedCropTitle = null;
  if (creationState.linkedCropThreadId) {
    // Looks into your existing crop database to grab the name (e.g., "Tomatoes in Lagos")
    const crop = model.state.savedCrops.find(
      (c) => c.id === creationState.linkedCropThreadId
    );
    if (crop) linkedCropTitle = crop.title;
  }

  // 4. Save the new thread to LocalStorage
  const newThread = model.saveSoilThread(
    selectedMethod,
    creationState.linkedCropThreadId,
    linkedCropTitle
  );

  // 5. Render the new card immediately to the dashboard
  soilView.renderSoilCard(newThread);

  // 6. Hide the empty state
  soilView.toggleEmptyState(true);

  // 7. ROUTING: Launch the correct input flow
  // 7. ROUTING: Launch the correct input flow
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
    questFlowView.render(); // <-- NEW ROUTE
  } else {
    console.log(`🚧 The flow for ${selectedMethod} is under construction!`);
  }
};

// --- LAB ---
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
    alert('Error connecting to AI. Please try again.');
  }
};

// --- KIT ---
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
    alert('Error connecting to AI. Please try again.');
  }
};

// --- DIY ---
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
    alert('Error connecting to AI. Please try again.');
  }
};

// --- QUESTIONNAIRE ---
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
    console.error('🚨 AI ERROR DETAILS:', err);
    soilView.removeSpinner();
    alert('Error connecting to AI. Please try again.');
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
    soilNavButton.click(); // This fires your native navigation listener perfectly
  } else {
    console.error('Could not find the Soil navigation button!');
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

  soilMethodView.addHandlerSelectMethod();
  soilMethodView.addHandlerClose();
  soilMethodView.addHandlerContinue(controlSoilMethodContinue);
  soilMethodView.addHandlerOpenMethod(controlOpenSoilMethod);

  // 1. Load existing soil threads from LocalStorage
  model.loadSoilThreads();

  // 2. Render any existing threads to the screen on page load
  if (model.state.soilThreads.length > 0) {
    // If we have data, render each card and hide the empty state
    model.state.soilThreads.forEach((thread) =>
      soilView.renderSoilCard(thread)
    );
    soilView.toggleEmptyState(true);
  } else {
    // If no data, ensure the empty state is visible
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

  // 1. Wakes up the trash can icons on the cards
  soilView.addHandlerDeleteIconClick();

  // 2. Connects the "Yes, Delete" button to the database controller
  soilView.addHandlerDeleteConfirm(controlDeleteSoilCard);

  chatView.addHandlerToggleCalendar();
};

init();
