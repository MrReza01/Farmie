class ChatView {
  _parentElement = document.querySelector('body');
  _chatContainer;
  _isShellInjected = false;
  _currentThreadId = null;
  _modalInjected = false;

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

    this._chatContainer
      .querySelector('.btn-thread-back')
      .addEventListener('click', this.hideChat.bind(this));

    this._chatContainer
      .querySelector('.btn-confirm-planting')
      .addEventListener('click', this.showConfirmModal.bind(this));
    this._isShellInjected = true;
  }

  /**
   * @description Displays the typing indicator animation in the chat messages container.
   * @returns {void}
   */
  showTypingIndicator() {
    const messagesContainer =
      this._chatContainer.querySelector('.thread__messages');

    const markup = `
      <div class="message message--typing" id="active-typing-indicator">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', markup);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * @description Removes the active typing indicator from the chat messages container.
   * @returns {void}
   */
  removeTypingIndicator() {
    const indicator = this._chatContainer.querySelector(
      '#active-typing-indicator'
    );
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * @description Renders all chat messages and interactive widgets for a specific crop thread.
   * @param {Object} threadData - The crop thread data containing chat history and calendar events.
   * @returns {void}
   */
  renderMessages(threadData) {
    const messagesContainer =
      this._chatContainer.querySelector('.thread__messages');
    messagesContainer.innerHTML = '';
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

    let bubblesMarkup = threadData.chatHistory
      .map((msg) => {
        const typeClass =
          msg.role === 'user'
            ? 'message--user'
            : msg.role === 'proactive'
              ? 'message--proactive'
              : 'message--ai';
        let bubbleHtml = `<div class="message ${typeClass}">${msg.content}</div>`;

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

    messagesContainer.insertAdjacentHTML('beforeend', bubblesMarkup);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * @description Activates and displays the chat view for a selected crop, populating it with relevant data.
   * @param {Object} threadData - The crop data to display in the chat.
   * @returns {void}
   */
  showChat(threadData) {
    this._injectChatShell();

    if (threadData) {
      this._currentThreadId = threadData.id;
      const titleElement = this._chatContainer.querySelector(
        '.thread__crop-title'
      );
      titleElement.textContent =
        threadData.title || `${threadData.crop} in ${threadData.location}`;

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
        plantBtn.style.display = 'flex';
      }

      this.renderMessages(threadData);
    }

    this._chatContainer.classList.add('chat-container--active');
    document.body.classList.add('split-screen-active');
  }

  /**
   * @description Hides the chat view and restores the standard application layout.
   * @returns {void}
   */
  hideChat() {
    if (this._chatContainer) {
      this._chatContainer.classList.remove('chat-container--active');
    }

    document.body.classList.remove('split-screen-active');
    delete document.body.dataset.restoreSplit;
  }

  /**
   * @description Disables the split-screen layout mode and hides the chat container.
   * @returns {void}
   */
  disableSplitScreen() {
    document.body.classList.remove('split-screen-active');
    if (this._chatContainer)
      this._chatContainer.classList.remove('chat-container--active');
  }

  /**
   * @description Attaches a handler to dismiss the soil test shortcut recommendation.
   * @param {Function} handler - The controller function to execute.
   * @returns {void}
   */
  addHandlerDismissShortcut(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('.btn-soil-cancel');
      if (!cancelBtn) return;

      handler(this._currentThreadId);
    });
  }

  /**
   * @description Attaches handlers for sending messages via form submission or the Enter key.
   * @param {Function} handler - The controller function to handle the message sending.
   * @returns {void}
   */
  addHandlerSendMessage(handler) {
    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('.thread__input-bar');
      if (!form) return;
      e.preventDefault();

      const input = form.querySelector('.thread__input');
      const text = input.value.trim();

      if (!text) return;

      input.value = '';
      handler(this._currentThreadId, text);
    });

    this._parentElement.addEventListener('keydown', (e) => {
      // Submits on Enter unless Shift is held for new lines
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

  /**
   * @description Attaches a handler to process user responses to calendar reminder prompts.
   * @param {Function} handler - The controller function to handle prompt resolution.
   * @returns {void}
   */
  addHandlerCalendarPrompt(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-calendar-add');
      // const skipBtn = e.target.closest('.btn-calendar-skip');

      const promptBox = e.target.closest('.calendar-prompt');
      if (!promptBox) return;
      const timestamp = promptBox.dataset.timestamp;
      const activity = promptBox.dataset.activity;
      const time = promptBox.dataset.time;
      const isAccepted = !!addBtn;

      handler(this._currentThreadId, timestamp, activity, time, isAccepted);
    });
  }

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

    document
      .querySelector('.btn-modal-no')
      .addEventListener('click', () => this.hideConfirmModal());

    document.querySelector('.btn-modal-yes').addEventListener('click', () => {
      this.hideConfirmModal();

      if (this._plantingHandler) {
        this._plantingHandler(this._currentThreadId);
      }
    });

    this._modalInjected = true;
  }

  /**
   * @description Displays the planting confirmation modal with dynamic crop information.
   * @returns {void}
   */
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

  /**
   * @description Attaches a handler for the planting confirmation action.
   * @param {Function} handler - The controller function to handle confirmation.
   * @returns {void}
   */
  addHandlerConfirmPlanting(handler) {
    // We ONLY listen for the "Yes" button here to tell the Controller to save the data!

    this._plantingHandler = handler;
  }

  /**
   * @description Hides the planting confirmation modal.
   * @returns {void}
   */
  hideConfirmModal() {
    const modal = document.getElementById('planting-modal');
    if (modal) modal.classList.remove('modal-overlay--active');
  }

  /**
   * @description Attaches a handler for the soil test shortcut click event.
   * @param {Function} handler - The controller function to execute.
   * @returns {void}
   */
  addHandlerSoilShortcut(handler) {
    this._parentElement.addEventListener('click', (e) => {
      // 1. Check if they clicked the shortcut button
      const btn = e.target.closest('.soil-shortcut__left');
      if (!btn) return;

      // 2. Grab the current crop ID
      const cropId = this._currentThreadId;
      if (!cropId) return;

      // 3. Send the ID to the Controller
      handler(cropId);
    });
  }

  // --- MASTER CALENDAR UI CONTROLLER ---
  /**
   * @description Attaches a handler to toggle the calendar popup and manage visibility across multiple instances.
   * @returns {void}
   */
  addHandlerToggleCalendar() {
    this._parentElement.addEventListener('click', (e) => {
      const icon = e.target.closest('.thread__calendar-icon');
      if (icon) {
        const headerContainer = icon.closest('.thread__header-right');
        const popup = headerContainer.querySelector('.calendar-popup');

        if (popup) {
          popup.classList.toggle('calendar-popup--active');

          document.querySelectorAll('.calendar-popup--active').forEach((p) => {
            if (p !== popup) p.classList.remove('calendar-popup--active');
          });
        }
        return;
      }

      if (e.target.closest('.calendar-popup')) {
        return;
      }

      const activePopups = document.querySelectorAll('.calendar-popup--active');
      if (activePopups.length > 0) {
        activePopups.forEach((popup) =>
          popup.classList.remove('calendar-popup--active')
        );
      }
    });
  }
}

export default new ChatView();
