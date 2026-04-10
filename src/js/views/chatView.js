class ChatView {
  _parentElement = document.querySelector('body');
  _chatContainer;
  _isShellInjected = false;
  _currentThreadId = null;
  _modalInjected = false;

  // --- 1. BUILDS THE "HOUSE" (Runs Once) ---
  _injectChatShell() {
    if (this._isShellInjected) return;

    const markup = `
      <section class="chat-container">
        <div class="thread__header">
          <div class="thread__header-left">
            <button class="btn-thread-back" aria-label="Go back">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button class="btn-confirm-planting">
              <i class="fa-solid fa-check"></i> <span>Plant</span>
            </button>
          </div>
          <div class="thread__header-center">
            <h2 class="thread__crop-title"></h2>
            <span class="thread__status-tag"></span>
          </div>
          <div class="thread__header-right">
            <i class="fa-solid fa-calendar-days thread__calendar-icon"></i>
            <div class="calendar-popup">
              <h3>Saved Schedule</h3>
              <div class="calendar-popup__list"></div>
            </div>
          </div>
        </div>
        
        <div class="thread__messages">
          </div>
        
        <form class="thread__input-bar">
          <textarea class="thread__input" placeholder="Ask Farmie..." rows="1"></textarea>
          <button type="submit" class="btn-thread-send" >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </section>
    `;
    this._parentElement.insertAdjacentHTML('beforeend', markup);
    this._chatContainer = document.querySelector('.chat-container');

    // Make the back button work
    this._chatContainer
      .querySelector('.btn-thread-back')
      .addEventListener('click', this.hideChat.bind(this));
    // Toggle the calendar popup when the icon is clicked
    this._chatContainer
      .querySelector('.thread__calendar-icon')
      .addEventListener('click', () => {
        this._chatContainer
          .querySelector('.calendar-popup')
          .classList.toggle('calendar-popup--active');
      });

    this._chatContainer
      .querySelector('.btn-confirm-planting')
      .addEventListener('click', this.showConfirmModal.bind(this));
    this._isShellInjected = true;
  }

  // --- STAGE B4: TYPING INDICATOR UI ---

  showTypingIndicator() {
    const messagesContainer =
      this._chatContainer.querySelector('.thread__messages');

    // Inject the bouncing dots inside a green AI bubble
    const markup = `
      <div class="message message--typing" id="active-typing-indicator">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', markup);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to show the dots!
  }

  removeTypingIndicator() {
    const indicator = this._chatContainer.querySelector(
      '#active-typing-indicator'
    );
    if (indicator) {
      indicator.remove();
    }
  }

  // --- 2. BUILDS THE "FURNITURE" (Runs every time a crop is clicked) ---
  renderMessages(threadData) {
    const messagesContainer =
      this._chatContainer.querySelector('.thread__messages');
    messagesContainer.innerHTML = ''; // Clean out the old furniture first
    // --- 1. Populate the Calendar Popup List ---
    const popupList = this._chatContainer.querySelector(
      '.calendar-popup__list'
    );
    const events = threadData.calendarEvents || [];

    if (events.length === 0) {
      popupList.innerHTML =
        '<p style="font-size:1.2rem; color:#888;">No events scheduled yet.</p>';
    } else {
      popupList.innerHTML = events
        .map(
          (ev) => `
        <div class="calendar-popup__item">
          <span style="text-transform: capitalize; font-weight:600;">${ev.activity}</span>
          <span style="color:var(--color-primary); text-transform: capitalize;">${ev.time}</span>
        </div>
      `
        )
        .join('');
    }

    // --- 2. Build the Chat Bubbles ---
    let bubblesMarkup = threadData.chatHistory
      .map((msg) => {
        const typeClass =
          msg.role === 'user'
            ? 'message--user'
            : msg.role === 'proactive'
              ? 'message--proactive'
              : 'message--ai';
        let bubbleHtml = `<div class="message ${typeClass}">${msg.content}</div>`;

        // NEW: Notice we now pull msg.proposedTime and inject it into the text and dataset!
        if (
          msg.proposedActivity &&
          msg.proposedTime &&
          !msg.activityPromptAnswered
        ) {
          bubbleHtml += `
          <div class="calendar-prompt" data-timestamp="${msg.timestamp}" data-activity="${msg.proposedActivity}" data-time="${msg.proposedTime}">
            <span class="calendar-prompt__text">Farmie noticed a timeline. Want to add a reminder for <b>${msg.proposedActivity}</b> (${msg.proposedTime}) to your calendar?</span>
            <div class="calendar-prompt__actions">
              <button class="btn-calendar-add">Yes, add it</button>
              <button class="btn-calendar-skip">Skip</button>
            </div>
          </div>
        `;
        }
        return bubbleHtml;
      })
      .join('');

    // Add the Soil Shortcut to the bottom
    // (Note: bestDays check is bypassed right now so you can test it!)
    if (!threadData.soilShortcutDismissed) {
      bubblesMarkup += `
        <div class="soil-shortcut">
          <div class="soil-shortcut__left">
            <i class="fa-solid fa-flask soil-shortcut__icon"></i>
            <span class="soil-shortcut__text">Start Soil Test for this crop</span>
          </div>
          <button class="btn-soil-cancel" aria-label="Dismiss shortcut">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      `;
    }

    // Inject the furniture into the house
    messagesContainer.insertAdjacentHTML('beforeend', bubblesMarkup);

    // Add this as the very last line inside renderMessages():
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // --- 3. THE MAIN CONTROLLER TRIGGER ---
  showChat(threadData) {
    this._injectChatShell(); // Make sure the house exists

    if (threadData) {
      this._currentThreadId = threadData.id;
      // Update Title
      const titleElement = this._chatContainer.querySelector(
        '.thread__crop-title'
      );
      titleElement.textContent =
        threadData.title || `${threadData.crop} in ${threadData.location}`;

      // Update Status Tag
      const statusElement = this._chatContainer.querySelector(
        '.thread__status-tag'
      );
      statusElement.textContent = threadData.status.replace(/-/g, ' ');

      const plantBtn = this._chatContainer.querySelector(
        '.btn-confirm-planting'
      );
      if (threadData.status === 'planted') {
        plantBtn.style.display = 'none';
      } else {
        plantBtn.style.display = 'flex'; // Show it if still in 'planning'
      }

      // Render the messages!
      this.renderMessages(threadData);
    }

    this._chatContainer.classList.add('chat-container--active');
    document.body.classList.add('split-screen-active');
  }

  hideChat() {
    if (this._chatContainer)
      this._chatContainer.classList.remove('chat-container--active');
  }

  disableSplitScreen() {
    document.body.classList.remove('split-screen-active');
    if (this._chatContainer)
      this._chatContainer.classList.remove('chat-container--active');
  }

  addHandlerDismissShortcut(handler) {
    // We attach the listener to the whole container because the cancel button is injected dynamically
    this._parentElement.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('.btn-soil-cancel');
      if (!cancelBtn) return;

      // When clicked, pass the active crop ID to the Controller!
      handler(this._currentThreadId);
    });
  }

  addHandlerSendMessage(handler) {
    // 1. Listen for the Submit Button click
    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('.thread__input-bar');
      if (!form) return;
      e.preventDefault();

      const input = form.querySelector('.thread__input');
      const text = input.value.trim();

      if (!text) return; // Don't send empty messages

      input.value = ''; // Clear the box
      handler(this._currentThreadId, text); // Send to Controller!
    });

    // 2. Listen for the 'Enter' key (but allow Shift+Enter for new lines)
    this._parentElement.addEventListener('keydown', (e) => {
      if (
        e.target.classList.contains('thread__input') &&
        e.key === 'Enter' &&
        !e.shiftKey
      ) {
        e.preventDefault();
        const form = e.target.closest('.thread__input-bar');
        form.dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true })
        );
      }
    });
  }

  addHandlerCalendarPrompt(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-calendar-add');
      const skipBtn = e.target.closest('.btn-calendar-skip');

      if (!addBtn && !skipBtn) return; // Ignore clicks that aren't on our buttons

      // Find the prompt box to grab our hidden data variables
      const promptBox = e.target.closest('.calendar-prompt');
      const timestamp = promptBox.dataset.timestamp; // We use timestamp to uniquely identify which message this belongs to
      // Find these lines and update them:
      const activity = promptBox.dataset.activity;
      const time = promptBox.dataset.time; // Extract the time!
      const isAccepted = !!addBtn;

      // Send to the controller!
      handler(this._currentThreadId, timestamp, activity, time, isAccepted);
    });
  }

  // --- STAGE B5: CONFIRM PLANTING UI ---

  _injectConfirmModal() {
    if (this._modalInjected) return;

    const markup = `
      <div class="modal-overlay" id="planting-modal">
        <div class="confirm-modal">
          <div class="confirm-modal__icon">
            <i class="fa-solid fa-seedling"></i>
          </div>
          <h3 class="confirm-modal__title">Did you plant today?</h3>
          <p class="confirm-modal__text">Confirming this will lock in your date, calculate your harvest, and stop the 5-day expiration timer.</p>
          <div class="confirm-modal__actions">
            <button class="btn-modal-yes">Yes, I planted today</button>
            <button class="btn-modal-no">Not yet</button>
          </div>
        </div>
      </div>
    `;
    this._parentElement.insertAdjacentHTML('beforeend', markup);

    // Close modal when clicking "Not yet"
    document
      .querySelector('.btn-modal-no')
      .addEventListener('click', () => this.hideConfirmModal());

    // 2. BULLETPROOF FIX: The "Yes" button
    document.querySelector('.btn-modal-yes').addEventListener('click', () => {
      this.hideConfirmModal();

      // Fire the controller function we saved earlier!
      if (this._plantingHandler) {
        this._plantingHandler(this._currentThreadId);
      } else {
        console.error('Controller handler missing!');
      }
    });

    this._modalInjected = true;
  }

  showConfirmModal() {
    this._injectConfirmModal();

    const cropName = this._chatContainer
      .querySelector('.thread__crop-title')
      .textContent.split(' in ')[0];
    document.querySelector('.confirm-modal__text').innerHTML =
      `Confirm that you planted your <b>${cropName}</b> today, ${new Date().toLocaleDateString()}?`;

    document
      .getElementById('planting-modal')
      .classList.add('modal-overlay--active');
  }

  addHandlerConfirmPlanting(handler) {
    // We ONLY listen for the "Yes" button here to tell the Controller to save the data!

    this._plantingHandler = handler;
  }

  hideConfirmModal() {
    const modal = document.getElementById('planting-modal');
    if (modal) modal.classList.remove('modal-overlay--active');
  }
}

export default new ChatView();
