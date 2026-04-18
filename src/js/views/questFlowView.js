class QuestFlowView {
  _parentElement = document.querySelector('.view-soil');
  _currentStep = 0;
  _answers = {};

  _questions = [
    {
      id: 'q1-color',
      title: 'What colour is your soil?',
      options: [
        { value: 'Dark Brown', label: 'Dark Brown' },
        { value: 'Reddish', label: 'Reddish' },
        { value: 'Sandy / Light', label: 'Sandy / Light' },
        { value: 'Grey', label: 'Grey' },
      ],
    },
    {
      id: 'q2-drainage',
      title: 'After rain, does water soak in quickly or sit on top?',
      options: [
        { value: 'Soaks in quickly', label: 'Soaks in quickly' },
        {
          value: 'Sits on top then drains',
          label: 'Sits on top for a while then drains',
        },
        { value: 'Pools and stays', label: 'Pools and stays for a long time' },
      ],
    },
    {
      id: 'q3-history',
      title: 'Have you grown crops here before? How did they grow?',
      options: [
        { value: 'Never grown crops', label: 'Never grown crops here' },
        { value: 'Grew poorly', label: 'Crops grew poorly' },
        { value: 'Grew reasonably well', label: 'Crops grew reasonably well' },
        { value: 'Grew very well', label: 'Crops grew very well' },
      ],
    },
    {
      id: 'q4-crust',
      title:
        'Do you see a white or pale crusty layer on the surface when it dries?',
      options: [
        { value: 'Always', label: 'Yes, always' },
        { value: 'Sometimes', label: 'Sometimes' },
        { value: 'Never', label: 'No, never' },
      ],
    },
  ];

  /**
   * @description Injects the questionnaire base markup into the soil view and starts the first step.
   * @returns {void}
   */
  render() {
    this.remove();
    this._currentStep = 0;
    this._answers = {};

    const baseMarkup = `
      <div class="soil-input-flow soil-input-flow--quest" id="flow-questionnaire">
        <div class="soil-input-flow__header">
          <button type="button" class="btn-close-flow" id="btn-quest-back"><i class="fas fa-arrow-left"></i> Back</button>
          <h2 class="soil-input-flow__title" id="quest-progress">Question 1 of 4</h2>
        </div>
        
        <form class="soil-quest-form" id="quest-form-container">
          </form>
      </div>
    `;
    this._parentElement.insertAdjacentHTML('beforeend', baseMarkup);

    this._renderCurrentStep();
    this._attachInternalListeners();
  }

  _renderCurrentStep() {
    const container = document.getElementById('quest-form-container');
    const progressText = document.getElementById('quest-progress');
    if (!container || !progressText) return;

    const currentQ = this._questions[this._currentStep];
    progressText.textContent = `Question ${this._currentStep + 1} of ${this._questions.length}`;

    const optionsMarkup = currentQ.options
      .map(
        (opt, index) => `
      <label class="quest-option-card">
        <input type="radio" name="${currentQ.id}" value="${opt.value}" class="quest-radio-input" required>
        <span class="quest-option-label">${opt.label}</span>
      </label>
    `
      )
      .join('');

    const buttonText =
      this._currentStep === this._questions.length - 1 ? 'Get Results' : 'Next';
    const buttonColor =
      this._currentStep === this._questions.length - 1 ? '#74C69D' : '#495057';

    container.innerHTML = `
      <h3 class="quest-question-title">${currentQ.title}</h3>
      <div class="quest-options-grid">
        ${optionsMarkup}
      </div>
      <button type="submit" class="btn-submit-flow btn-quest-next" style="background-color: ${buttonColor};" disabled>${buttonText}</button>
    `;

    this._attachValidation();
  }

  _attachInternalListeners() {
    const flowContainer = document.getElementById('flow-questionnaire');
    if (!flowContainer) return;

    flowContainer.addEventListener('click', (e) => {
      const backBtn = e.target.closest('#btn-quest-back');
      if (!backBtn) return;

      if (this._currentStep > 0) {
        this._currentStep--;
        this._renderCurrentStep();
      } else {
        flowContainer.dispatchEvent(
          new CustomEvent('closeFlowReq', { bubbles: true })
        );
      }
    });
  }

  _attachValidation() {
    const form = document.getElementById('quest-form-container');
    const nextBtn = form.querySelector('.btn-quest-next');

    form.addEventListener('change', () => {
      const isChecked = form.querySelector('input[type="radio"]:checked');
      if (isChecked) nextBtn.disabled = false;
    });
  }

  /**
   * @description Attaches a listener for the custom close event fired when navigating back from the first question.
   * @param {Function} handler - The controller function to handle closing the flow.
   * @returns {void}
   */
  addHandlerClose(handler) {
    this._parentElement.addEventListener('closeFlowReq', function (e) {
      if (!e.target.closest('#flow-questionnaire')) return;
      handler();
    });
  }

  /**
   * @description Attaches a submit listener to the questionnaire form to handle navigation between steps or final submission.
   * @param {Function} handler - The controller function to process the final questionnaire data.
   * @returns {void}
   */
  addHandlerSubmit(handler) {
    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#quest-form-container');
      if (!form) return;
      e.preventDefault();

      const currentQ = this._questions[this._currentStep];
      const selectedValue = form.querySelector(
        'input[type="radio"]:checked'
      ).value;
      this._answers[currentQ.id] = selectedValue;

      // Progresses to the next question or submits the final dataset to the handler
      if (this._currentStep < this._questions.length - 1) {
        this._currentStep++;
        this._renderCurrentStep();
      } else {
        const finalData = {
          source: 'questionnaire',
          color: this._answers['q1-color'],
          drainage: this._answers['q2-drainage'],
          history: this._answers['q3-history'],
          crust: this._answers['q4-crust'],
        };
        handler(finalData);
      }
    });
  }

  /**
   * @description Removes the questionnaire flow container from the DOM.
   * @returns {void}
   */
  remove() {
    const flowContainer = document.getElementById('flow-questionnaire');
    if (flowContainer) flowContainer.remove();
  }
}

export default new QuestFlowView();
