class DiyFlowView {
  _parentElement = document.querySelector('.view-soil');

  render() {
    // 1. Inject the markup
    const markup = this._generateMarkup();
    this._parentElement.insertAdjacentHTML('beforeend', markup);

    // 2. Attach internal listeners for accordions and validation
    this._attachAccordionLogic();
    this._attachValidation();
  }

  // --------------------------------------------------
  // INTERNAL UI LOGIC
  // --------------------------------------------------

  // Handles opening and closing the dropdowns
  _attachAccordionLogic() {
    const container = document.getElementById('flow-diy-test');
    if (!container) return;

    container.addEventListener('click', function (e) {
      const headerBtn = e.target.closest('.diy-accordion__header');
      if (!headerBtn) return;

      // Find the content linked to this header
      const content = headerBtn.nextElementSibling;
      const icon = headerBtn.querySelector('.accordion-icon');

      // Toggle visibility (using simple classes, no transitions)
      if (content.classList.contains('diy-accordion__content--hidden')) {
        content.classList.remove('diy-accordion__content--hidden');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        headerBtn.classList.add('diy-accordion__header--active');
      } else {
        content.classList.add('diy-accordion__content--hidden');
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        headerBtn.classList.remove('diy-accordion__header--active');
      }
    });
  }

  // Enables the submit button if AT LEAST ONE field has data
  _attachValidation() {
    const form = document.querySelector('.soil-diy-form');
    const submitBtn = document.querySelector('#flow-diy-test .btn-submit-flow');
    if (!form || !submitBtn) return;

    // Listen to all changes in the form
    form.addEventListener('input', function () {
      // Get all inputs and selects
      const allInputs = Array.from(form.querySelectorAll('input, select'));

      // Check if any single input has a value
      const hasData = allInputs.some((input) => input.value.trim() !== '');

      // Enable or disable the button
      submitBtn.disabled = !hasData;
    });
  }

  // --------------------------------------------------
  // CONTROLLER COMMUNICATION
  // --------------------------------------------------

  addHandlerClose(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btnClose = e.target.closest('#flow-diy-test .btn-close-flow');
      if (!btnClose) return;
      handler();
    });
  }

  addHandlerSubmit(handler) {
    this._parentElement.addEventListener('submit', function (e) {
      const form = e.target.closest('.soil-diy-form');
      if (!form) return;
      e.preventDefault();

      // Gather data from all 5 tests
      const formData = {
        source: 'diy-test',
        // Test A
        vinegarFizz: form.querySelector('#diy-vinegar').value || null,
        bakingSodaFizz: form.querySelector('#diy-baking-soda').value || null,
        // Test B
        sandPercent: form.querySelector('#diy-sand').value
          ? parseFloat(form.querySelector('#diy-sand').value)
          : null,
        siltPercent: form.querySelector('#diy-silt').value
          ? parseFloat(form.querySelector('#diy-silt').value)
          : null,
        clayPercent: form.querySelector('#diy-clay').value
          ? parseFloat(form.querySelector('#diy-clay').value)
          : null,
        // Test C
        earthworms: form.querySelector('#diy-worms').value
          ? parseInt(form.querySelector('#diy-worms').value)
          : null,
        // Test D
        drainageTime: form.querySelector('#diy-drainage').value
          ? parseFloat(form.querySelector('#diy-drainage').value)
          : null,
        // Test E
        squeezeResult: form.querySelector('#diy-squeeze').value || null,
      };

      // Quick Validation: If they filled out the Jar Test, do they equal 100?
      if (
        formData.sandPercent ||
        formData.siltPercent ||
        formData.clayPercent
      ) {
        const sum =
          (formData.sandPercent || 0) +
          (formData.siltPercent || 0) +
          (formData.clayPercent || 0);
        if (sum !== 100) {
          alert(
            'Jar Test values (Sand, Silt, Clay) must add up exactly to 100%. Please check your numbers.'
          );
          return; // Stop submission
        }
      }

      handler(formData);
    });
  }

  remove() {
    const flowContainer = document.getElementById('flow-diy-test');
    if (flowContainer) flowContainer.remove();
  }

  // --------------------------------------------------
  // MARKUP GENERATION
  // --------------------------------------------------

  _generateMarkup() {
    return `
      <div class="soil-input-flow" id="flow-diy-test">
        
        <div class="soil-input-flow__header">
          <button type="button" class="btn-close-flow"><i class="fas fa-arrow-left"></i> Back</button>
          <h2 class="soil-input-flow__title">DIY Soil Tests</h2>
        </div>

        <form class="soil-diy-form">
          <p class="soil-form-instructions" style="border-left-color: #E76F51;">
            Perform at least one of the tests below to get an analysis. Tap a test to see the instructions and enter your results.
          </p>

          <div class="diy-accordion">
            <button type="button" class="diy-accordion__header">
              <span class="diy-accordion__title">Test A: pH (Vinegar & Baking Soda)</span>
              <i class="fas fa-chevron-down accordion-icon"></i>
            </button>
            <div class="diy-accordion__content diy-accordion__content--hidden">
              <div class="diy-instructions">
                <strong>Materials:</strong> White vinegar, baking soda, two cups of water, soil sample.<br><br>
                <strong>Procedure:</strong> Add vinegar to a moist soil sample. If it fizzes, it's alkaline. If not, take a fresh sample, mix with water, and add baking soda. If it fizzes, it's acidic. 
                <br><br><em>Chemistry Note: Alkaline soils contain carbonates that react with vinegar (acid) to produce CO2 fizz!</em>
              </div>
              <div class="form-group">
                <label for="diy-vinegar" class="form-label">Did it fizz with Vinegar?</label>
                <select id="diy-vinegar" class="form-select">
                  <option value="">Select result...</option>
                  <option value="Yes">Yes (Alkaline)</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div class="form-group">
                <label for="diy-baking-soda" class="form-label">Did it fizz with Baking Soda?</label>
                <select id="diy-baking-soda" class="form-select">
                  <option value="">Select result...</option>
                  <option value="Yes">Yes (Acidic)</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          <div class="diy-accordion">
            <button type="button" class="diy-accordion__header">
              <span class="diy-accordion__title">Test B: Texture (Jar Test)</span>
              <i class="fas fa-chevron-down accordion-icon"></i>
            </button>
            <div class="diy-accordion__content diy-accordion__content--hidden">
              <div class="diy-instructions">
                <strong>Materials:</strong> Clear glass jar, water, 1 drop dish soap, ruler. <br>
                <em>Note: This test takes 24–48 hours to settle. You can leave and come back later.</em><br><br>
                <strong>Procedure:</strong> Fill jar 1/3 with soil, add water and soap, shake vigorously. Wait 24-48hrs for layers to settle (Sand bottom, Silt middle, Clay top). Measure each layer to find the percentages.
              </div>
              <div class="form-group">
                <label for="diy-sand" class="form-label">Sand (%)</label>
                <input type="number" id="diy-sand" class="form-input" min="0" max="100" placeholder="e.g. 40">
              </div>
              <div class="form-group">
                <label for="diy-silt" class="form-label">Silt (%)</label>
                <input type="number" id="diy-silt" class="form-input" min="0" max="100" placeholder="e.g. 40">
              </div>
              <div class="form-group">
                <label for="diy-clay" class="form-label">Clay (%)</label>
                <input type="number" id="diy-clay" class="form-input" min="0" max="100" placeholder="e.g. 20">
              </div>
            </div>
          </div>

          <div class="diy-accordion">
            <button type="button" class="diy-accordion__header">
              <span class="diy-accordion__title">Test C: Health (Earthworms)</span>
              <i class="fas fa-chevron-down accordion-icon"></i>
            </button>
            <div class="diy-accordion__content diy-accordion__content--hidden">
              <div class="diy-instructions">
                <strong>Materials:</strong> A spade.<br><br>
                <strong>Procedure:</strong> Dig a hole roughly 30cm x 30cm. Sift through the excavated soil and count every earthworm you find.
              </div>
              <div class="form-group">
                <label for="diy-worms" class="form-label">Earthworms Found</label>
                <input type="number" id="diy-worms" class="form-input" min="0" placeholder="e.g. 12">
              </div>
            </div>
          </div>

          <div class="diy-accordion">
            <button type="button" class="diy-accordion__header">
              <span class="diy-accordion__title">Test D: Drainage (Percolation)</span>
              <i class="fas fa-chevron-down accordion-icon"></i>
            </button>
            <div class="diy-accordion__content diy-accordion__content--hidden">
              <div class="diy-instructions">
                <strong>Materials:</strong> Tin can or PVC pipe (both ends open), water, timer.<br><br>
                <strong>Procedure:</strong> Push the can 15cm into the soil. Fill with water and let drain completely to saturate the soil. Fill it a second time and time exactly how many minutes it takes to drain fully.
              </div>
              <div class="form-group">
                <label for="diy-drainage" class="form-label">Drainage Time (Minutes)</label>
                <input type="number" id="diy-drainage" class="form-input" min="0" placeholder="e.g. 45">
              </div>
            </div>
          </div>

          <div class="diy-accordion">
            <button type="button" class="diy-accordion__header">
              <span class="diy-accordion__title">Test E: Texture (Squeeze Test)</span>
              <i class="fas fa-chevron-down accordion-icon"></i>
            </button>
            <div class="diy-accordion__content diy-accordion__content--hidden">
              <div class="diy-instructions">
                <strong>Materials:</strong> Moist soil and your hands.<br><br>
                <strong>Procedure:</strong> Take a handful of moist soil and squeeze it firmly. Open your hand and observe the result.
              </div>
              <div class="form-group">
                <label for="diy-squeeze" class="form-label">Observation</label>
                <select id="diy-squeeze" class="form-select">
                  <option value="">Select result...</option>
                  <option value="Loam">Holds shape, crumbles when poked (Loam)</option>
                  <option value="Clay">Sticky ball, smears (Clay-heavy)</option>
                  <option value="Sand">Falls apart immediately (Sandy)</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-submit-flow" style="background-color: #E76F51;" disabled>Get Recommendations</button>
        </form>
      </div>
    `;
  }
}

export default new DiyFlowView();
