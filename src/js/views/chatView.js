class ChatView {
  _parentElement = document.querySelector('body');
  _chatContainer;
  _isShellInjected = false; // Tracks if we've already built the HTML

  _injectChatShell() {
    // If it's already built, don't build it again
    if (this._isShellInjected) return;

    const markup = `
      <section class="chat-container">
        <div class="chat-header">
          <button class="chat-header__back-btn" aria-label="Go back">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="chat-header__info">
          
            <h2 class="chat-header__title"></h2>
          </div>
        </div>
        
        <div class="chat-messages">
          </div>
        
        <form class="chat-input-area">
          <input type="text" class="chat-input__field" placeholder="Ask Farmie..." disabled />
          <button type="submit" class="chat-input__send-btn" disabled>
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </section>
    `;
    this._parentElement.insertAdjacentHTML('beforeend', markup);
    this._chatContainer = document.querySelector('.chat-container');

    // Attach listener to the new back button
    this._chatContainer
      .querySelector('.chat-header__back-btn')
      .addEventListener('click', this.hideChat.bind(this));

    this._isShellInjected = true;
  }

  // Inside chatView.js

  showChat(threadData) {
    this._injectChatShell(); // Build it safely on first click

    // NEW: Update the header title dynamically!
    if (threadData) {
      const titleElement = this._chatContainer.querySelector(
        '.chat-header__title'
      );
      // Swap the text to match the clicked crop
      titleElement.textContent = `${threadData.crop} in ${threadData.location}`;
    }

    // 1. On Mobile: Slide it in
    this._chatContainer.classList.add('chat-container--active');

    // 2. On Desktop: Trigger the split screen
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
}

export default new ChatView();
