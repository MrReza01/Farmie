/* global imageCompression */

class ScanView {
  _parentElement = document.querySelector('.view-scan');

  _uploadBox = document.getElementById('scan-upload-box');
  _fileInput = document.getElementById('scan-file-input');
  _previewBox = document.getElementById('scan-preview-box');
  _previewImg = document.getElementById('scan-preview-img');
  _btnRemove = document.querySelector('.btn-remove-scan');
  _btnScan = document.getElementById('btn-start-scan');
  _cropInput = document.getElementById('scan-crop-name');

  _selectedImageData = null;

  constructor() {
    this._insertLoaderHTML();
    this._insertErrorHTML();
    this._addHandlerFileInput();
    this._addHandlerRemoveImage();
  }

  _insertLoaderHTML() {
    const loaderMarkup = `
      <div class="scan-loader-overlay u-hidden" id="scan-loader">
        <div class="scan-spinner"></div>
        <p class="scan-loader__text" id="scan-loader-text">Preparing...</p>
      </div>
    `;
    this._parentElement.insertAdjacentHTML('beforeend', loaderMarkup);

    this._loaderOverlay = this._parentElement.querySelector('#scan-loader');
    this._loaderText = this._parentElement.querySelector('#scan-loader-text');

    this._header = document.querySelector('.header');
    this._bottomNav = document.querySelector('.bottom-nav');
  }

  /**
   * @description Displays the scanning loader overlay and starts the message cycling animation.
   * @returns {void}
   */
  showLoader() {
    this.clearError();
    if (this._loaderOverlay) {
      this._loaderOverlay.classList.remove('u-hidden');
    }

    if (this._header) this._header.classList.add('u-hidden');
    if (this._bottomNav) this._bottomNav.classList.add('u-hidden');

    if (!this._scanMessages || this._scanMessages.length === 0) {
      this._scanMessages = [
        'Examining leaf patterns...',
        'Checking for disease signatures...',
        'Analysing symptoms...',
        'Preparing your diagnosis...',
      ];
    }

    if (this._loaderText) {
      let messageIndex = 0;
      this._loaderText.textContent = this._scanMessages[0];

      // Cycle through analysis messages every 1.5 seconds
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

  /**
   * @description Hides the scanning loader overlay and restores the main navigation visibility.
   * @returns {void}
   */
  hideLoader() {
    if (this._messageInterval) {
      clearInterval(this._messageInterval);
    }

    if (this._loaderOverlay) {
      this._loaderOverlay.classList.add('u-hidden');
    }

    if (this._header) this._header.classList.remove('u-hidden');
    if (this._bottomNav) this._bottomNav.classList.remove('u-hidden');
  }

  _insertErrorHTML() {
    const errorMarkup = `
      <div class="scan-error u-hidden" id="scan-error-box">
        <i class="fa-solid fa-circle-exclamation scan-error__icon"></i>
        <p class="scan-error__text" id="scan-error-text">Analysis failed. Please try again.</p>
      </div>
    `;

    if (this._uploadBox) {
      this._uploadBox.insertAdjacentHTML('beforebegin', errorMarkup);
    }

    this._errorBox = document.getElementById('scan-error-box');
    this._errorText = document.getElementById('scan-error-text');
  }

  /**
   * @description Renders an error message to the scan view that automatically dismisses after 5 seconds.
   * @param {string} message - The error message to display.
   * @returns {void}
   */
  renderError(message) {
    if (this._errorText) this._errorText.textContent = message;
    if (this._errorBox) this._errorBox.classList.remove('u-hidden');

    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
    }

    this._errorTimeout = setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  /**
   * @description Immediately hides the error message box and clears any active dismissal timers.
   * @returns {void}
   */
  clearError() {
    if (this._errorBox) this._errorBox.classList.add('u-hidden');

    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
    }
  }

  _addHandlerFileInput() {
    this._fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        // Shrink image to protect API payload limits
        const compressedFile = await imageCompression(file, options);

        // Generate Base64 string for preview and subsequent API transmission
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          this._selectedImageData = reader.result;

          this._previewImg.src = this._selectedImageData;
          this._uploadBox.classList.add('u-hidden');
          this._previewBox.classList.remove('u-hidden');
          this._btnScan.classList.remove('u-hidden');
        };
      } catch {
        this.renderError(
          'Failed to process image. Please try a different photo.'
        );
      }
    });
  }

  _addHandlerRemoveImage() {
    this._btnRemove.addEventListener('click', () => {
      this._selectedImageData = null;
      this._fileInput.value = '';
      this._cropInput.value = '';
      this._previewImg.src = '';

      this._previewBox.classList.add('u-hidden');
      this._btnScan.classList.add('u-hidden');
      this._uploadBox.classList.remove('u-hidden');
    });
  }

  /**
   * @description Attaches a handler to the scan button to initiate the analysis process.
   * @param {Function} handler - The controller function to execute on click.
   * @returns {void}
   */
  addHandlerStartScan(handler) {
    this._btnScan.addEventListener('click', () => {
      const cropName = this._cropInput.value.trim();
      handler(this._selectedImageData, cropName);
    });
  }

  /**
   * @description Attaches a handler to the history button to display past scan results.
   * @param {Function} handler - The controller function to execute on click.
   * @returns {void}
   */
  addHandlerShowHistory(handler) {
    const historyBtn = document.querySelector('.btn-scan-history');
    if (historyBtn) {
      historyBtn.addEventListener('click', handler);
    }
  }
}

export default new ScanView();
