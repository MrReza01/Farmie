class ResultsView {
  _parentElement = document.querySelector('.results-container');
  _data;
  _currentDayIndex = 0;

  /**
   * @description Renders the results view with the provided data and updates button visibility.
   * @param {Object} data - The results data object containing daily weather and AI advice.
   * @returns {void}
   */
  render(data) {
    this._data = data;
    const markup = this._generateMarkup();
    this._clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);
    this._syncAddCropButtonVisibility();
  }

  /**
   * @description Displays a loading spinner with cycling messages while the plan is being generated.
   * @returns {void}
   */
  renderSpinner() {
    const messages = [
      'Checking weather conditions',
      'Analysing crop requirements',
      'Consulting your farming data',
      'Building your planting plan',
    ];

    const markup = `
    <div class="loader">
      <i class="fas fa-seedling loader__icon"></i>
      <p class="loader__text">${messages[0]}</p>
      <div class="loader__dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
     
    </div>
  `;

    this._clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);
    this._cycleMessages(messages);
  }

  _cycleMessages(messages) {
    let index = 0;
    const textEl = this._parentElement.querySelector('.loader__text');

    this._loaderInterval = setInterval(() => {
      // Cycles through messages with a fade transition effect
      index = (index + 1) % messages.length;
      textEl.classList.add('loader__text--fade');

      setTimeout(() => {
        textEl.textContent = messages[index];
        textEl.classList.remove('loader__text--fade');
      }, 300);
    }, 2000);
  }

  addHandlerToggleDetails() {
    this._parentElement.addEventListener(
      'click',
      function (e) {
        const btn = e.target.closest('.btn-toggle-details');

        if (!btn) return;

        const detailsContainer = document.querySelector('.results__details');
        const addCropBtn = document.querySelector('.btn-add-crop');

        detailsContainer.classList.toggle('results__details--hidden');

        if (addCropBtn) {
          addCropBtn.classList.toggle('btn-add-crop--hidden');
        }

        const icon = btn.querySelector('i');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      }.bind(this)
    );
  }

  /**
   * @description Attaches event listeners for the carousel navigation between different result days.
   * @returns {void}
   */
  addHandlerCarousel() {
    this._parentElement.addEventListener('click', (e) => {
      const btnPrev = e.target.closest('.btn-nav--prev');
      const btnNext = e.target.closest('.btn-nav--next');

      if (!btnPrev && !btnNext) return;

      if (btnPrev) {
        if (this._currentDayIndex > 0) {
          this._currentDayIndex--;
        }
      }

      if (btnNext) {
        if (this._currentDayIndex < 4) {
          this._currentDayIndex++;
        }
      }

      this.render(this._data);
      // Re-renders view and forces detail visibility on day switch for better UX

      const detailsContainer = document.querySelector('.results__details');
      const icon = document.querySelector('.btn-toggle-details i');

      if (detailsContainer) {
        detailsContainer.classList.remove('results__details--hidden');
      }

      if (icon) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
      }
      this._syncAddCropButtonVisibility();
    });
  }

  /**
   * @description Attaches a click event listener to handle closing the results view.
   * @param {Function} handler - The controller function to execute when closing results.
   * @returns {void}
   */
  addHandlerClose(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-close-results');

      if (!btn) return;
      handler();
    });
  }

  /**
   * @description Attaches a click event listener to handle adding a crop to the dashboard.
   * @param {Function} handler - The controller function to execute when adding a crop.
   * @returns {void}
   */
  addHandlerAddCrop(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-add-crop');
      if (!btn) return;
      handler();
    });
  }

  _clear() {
    if (this._loaderInterval) {
      clearInterval(this._loaderInterval);
      this._loaderInterval = null;
    }
    this._parentElement.innerHTML = '';
  }

  _syncAddCropButtonVisibility() {
    const detailsContainer =
      this._parentElement.querySelector('.results__details');
    const addCropBtn = this._parentElement.querySelector('.btn-add-crop');

    if (!detailsContainer || !addCropBtn) return;
    const isDetailsVisible = !detailsContainer.classList.contains(
      'results__details--hidden'
    );

    // Ensures the CTA button is only visible when the user is viewing the full plan details
    if (isDetailsVisible) {
      addCropBtn.classList.remove('btn-add-crop--hidden');
    } else {
      addCropBtn.classList.add('btn-add-crop--hidden');
    }
  }

  _generateMarkup() {
    const currentDay = this._data.dailyData[this._currentDayIndex];

    if (!currentDay) {
      return `
      <div class="results__title">
  <h2>Ooop! We couldn't load this day's data.</h2>
  <p>Please try generating the plan again</p>
</div>`;
    }

    return `

  <div class="results-card">
  <div class="results__summary">

    <div class="summary__top-bar">
      <button class="btn-close-results" aria-label="Close results">
        <i class="fas fa-times"></i>
      </button>

      
<button class="btn-add-crop btn-add-crop--hidden" aria-label="Add to My Crops" >
  </i>Add to My Crops
</button>
    </div>

    <h2 class="summary__date">${currentDay.dayName}</h2>
  <h1 class="summary__verdict summary__verdict--${currentDay.status}">${currentDay.verdict}</h1>

    <button class="btn-toggle-details" aria-label="View details">
      <i class="fas fa-chevron-down"></i>
    </button>
  </div>

  <div class="results__details results__details--hidden">
    <div class="details__carousel-nav">
      <button class="btn-nav btn-nav--prev">
        <i class="fas fa-chevron-left"></i>
      </button>

      <span class="carousel-indicator">Day ${this._currentDayIndex + 1} of 5</span>

      <button class="btn-nav btn-nav--next">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <table class="details__weather-table">
      <tbody>
        <tr>
          <td>Day Temp</td>
          <td class="table-value">${currentDay.dayTemp}°C</td>
        </tr>
        <tr>
          <td>Night Temp</td>
          <td class="table-value">${currentDay.nightTemp}°C</td>
        </tr>
        <tr>
          <td>Humidity</td>
          <td class="table-value">${currentDay.humidity}</td>
        </tr>
        <tr>
          <td>Rain Chance</td>
          <td class="table-value">${currentDay.rainChance}</td>
        </tr>
        <tr>
          <td>Sunlight</td>
          <td class="table-value">${currentDay.sunlight}</td>
        </tr>
      </tbody>
    </table>

    <div class="details__recommendations">
      <h3>Farming Recommendations</h3>
      <p>${currentDay.advice}</p>
    </div>
  </div>
</div>

    `;
  }
}

export default new ResultsView();
