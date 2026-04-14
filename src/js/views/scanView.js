class ScanView {
  _parentElement = document.querySelector('.view-scan');

  // DOM Elements
  _uploadBox = document.getElementById('scan-upload-box');
  _fileInput = document.getElementById('scan-file-input');
  _previewBox = document.getElementById('scan-preview-box');
  _previewImg = document.getElementById('scan-preview-img');
  _btnRemove = document.querySelector('.btn-remove-scan');
  _btnScan = document.getElementById('btn-start-scan');
  _cropInput = document.getElementById('scan-crop-name');

  // Module-level variable to store the compressed Base64 string
  _selectedImageData = null;

  constructor() {
    this._insertLoaderHTML();
    this._insertErrorHTML();
    this._addHandlerFileInput();
    this._addHandlerRemoveImage();
  }

  // --- 1. INJECT LOADER HTML ---
  _insertLoaderHTML() {
    const loaderMarkup = `
      <div class="scan-loader-overlay u-hidden" id="scan-loader">
        <div class="scan-spinner"></div>
        <p class="scan-loader__text" id="scan-loader-text">Preparing...</p>
      </div>
    `;
    this._parentElement.insertAdjacentHTML('beforeend', loaderMarkup);

    // Bulletproof element targeting: Querying strictly inside the parent
    this._loaderOverlay = this._parentElement.querySelector('#scan-loader');
    this._loaderText = this._parentElement.querySelector('#scan-loader-text');

    this._header = document.querySelector('.header');
    this._bottomNav = document.querySelector('.bottom-nav');
  }

  // --- 2. SHOW LOADER ---
  showLoader() {
    this.clearError();
    // 1. Show the overlay
    if (this._loaderOverlay) {
      this._loaderOverlay.classList.remove('u-hidden');
    }

    // 2. Hide layout
    if (this._header) this._header.classList.add('u-hidden');
    if (this._bottomNav) this._bottomNav.classList.add('u-hidden');

    // 3. Safety check for the text cycling array
    if (!this._scanMessages || this._scanMessages.length === 0) {
      this._scanMessages = [
        'Examining leaf patterns...',
        'Checking for disease signatures...',
        'Analysing symptoms...',
        'Preparing your diagnosis...',
      ];
    }

    // 4. Start Text Cycling safely
    if (this._loaderText) {
      let messageIndex = 0;
      this._loaderText.textContent = this._scanMessages[0]; // Set first message

      this._messageInterval = setInterval(() => {
        messageIndex++;
        if (messageIndex >= this._scanMessages.length) messageIndex = 0;

        // Only update if the element still exists
        if (this._loaderText) {
          this._loaderText.textContent = this._scanMessages[messageIndex];
        }
      }, 1500);
    }
  }

  // --- 3. HIDE LOADER ---
  hideLoader() {
    // Stop the interval so it doesn't run in the background forever
    if (this._messageInterval) {
      clearInterval(this._messageInterval);
    }

    // Hide the loader
    if (this._loaderOverlay) {
      this._loaderOverlay.classList.add('u-hidden');
    }

    // Restore layout
    if (this._header) this._header.classList.remove('u-hidden');
    if (this._bottomNav) this._bottomNav.classList.remove('u-hidden');
  }

  // --- ERROR HANDLING ---
  _insertErrorHTML() {
    const errorMarkup = `
      <div class="scan-error u-hidden" id="scan-error-box">
        <i class="fa-solid fa-circle-exclamation scan-error__icon"></i>
        <p class="scan-error__text" id="scan-error-text">Analysis failed. Please try again.</p>
      </div>
    `;

    // Inject it right above the upload box so it's highly visible
    if (this._uploadBox) {
      this._uploadBox.insertAdjacentHTML('beforebegin', errorMarkup);
    }

    this._errorBox = document.getElementById('scan-error-box');
    this._errorText = document.getElementById('scan-error-text');
  }

  renderError(message) {
    if (this._errorText) this._errorText.textContent = message;
    if (this._errorBox) this._errorBox.classList.remove('u-hidden');

    // 1. Clear any existing timer so they don't overlap if the user clicks twice quickly
    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
    }

    // 2. Set the 5-second (5000ms) auto-dismiss timer
    this._errorTimeout = setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  clearError() {
    if (this._errorBox) this._errorBox.classList.add('u-hidden');

    // Also clear the timer here just to keep the memory perfectly clean
    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
    }
  }

  // 1. Handle File Selection & Compression
  _addHandlerFileInput() {
    this._fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Compression Settings (Shrinks to < 1MB to protect API)
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        // Compress the image using the library from the CDN
        const compressedFile = await imageCompression(file, options);

        // Convert the compressed file to a Base64 string for the preview and API
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          this._selectedImageData = reader.result;

          // Update UI
          this._previewImg.src = this._selectedImageData;
          this._uploadBox.classList.add('u-hidden');
          this._previewBox.classList.remove('u-hidden');
          this._btnScan.classList.remove('u-hidden');
        };
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Could not process this image. Please try another one.');
      }
    });
  }

  // 2. Handle Remove Button
  _addHandlerRemoveImage() {
    this._btnRemove.addEventListener('click', () => {
      // Clear variables
      this._selectedImageData = null;
      this._fileInput.value = ''; // Resets the actual input
      this._cropInput.value = ''; // Clears the optional crop name
      this._previewImg.src = '';

      // Revert UI
      this._previewBox.classList.add('u-hidden');
      this._btnScan.classList.add('u-hidden');
      this._uploadBox.classList.remove('u-hidden');
    });
  }

  // 3. Handle Scan Button Click (To be called by Controller)
  addHandlerStartScan(handler) {
    this._btnScan.addEventListener('click', () => {
      const cropName = this._cropInput.value.trim();
      // Pass the stored Base64 data and the crop name to the controller
      handler(this._selectedImageData, cropName);
    });
  }

  addHandlerShowHistory(handler) {
    const historyBtn = document.querySelector('.btn-scan-history');
    if (historyBtn) {
      historyBtn.addEventListener('click', handler);
    }
  }
}

export default new ScanView();
