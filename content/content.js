// Content script to detect accepted submissions on LeetCode

class LeetCodeSubmissionDetector {
  constructor() {
    this.modalShown = false;
    this.init();
  }
  
  init() {
    // Watch for Submit button clicks
    this.observeSubmitButton();
    
    // Reset state on URL changes
    this.observeUrlChanges();
  }
  
  observeSubmitButton() {
    // Use event delegation to catch submit button clicks
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Check if clicked element is the Submit button
      const isSubmitButton = 
        target.closest('[data-e2e-locator="console-submit-button"]') ||
        (target.closest('button') && target.closest('button').textContent?.trim().toLowerCase() === 'submit') ||
        (target.tagName === 'BUTTON' && target.textContent?.trim().toLowerCase() === 'submit');
      
      if (isSubmitButton) {
        console.log('[LeetCode SR] Submit button clicked');
        this.modalShown = false;
        
        // Wait for result and show modal
        this.waitForResultAndShowModal();
      }
    }, true);
  }
  
  waitForResultAndShowModal() {
    // Poll for accepted submission result
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds max
    
    const checkResult = () => {
      attempts++;
      
      if (this.modalShown || attempts > maxAttempts) {
        return;
      }
      
      // Log current state for debugging
      console.log(`[LeetCode SR] Checking for accepted result (attempt ${attempts})...`);
      
      const isAccepted = this.isAcceptedSubmission();
      
      if (isAccepted) {
        console.log('[LeetCode SR] Accepted submission detected!');
        this.showModal();
        return;
      }
      
      // Check if we got a failure result (Wrong Answer, TLE, MLE, etc)
      // If so, don't stop polling - user might resubmit
      const isFailure = this.isFailedSubmission();
      if (isFailure) {
        console.log('[LeetCode SR] Failed submission detected, continuing to watch for resubmit...');
      }
      
      // Keep polling
      setTimeout(checkResult, 500);
    };
    
    // Start checking after a short delay
    setTimeout(checkResult, 1000);
  }
  
  isAcceptedSubmission() {
    // First, check if there's a failure indicator - if so, definitely NOT accepted
    const failureIndicators = [
      'Wrong Answer',
      'Time Limit Exceeded', 
      'Memory Limit Exceeded',
      'Runtime Error',
      'Compile Error',
      'Output Limit Exceeded'
    ];
    
    // Check for red failure text (text-red-60 class is used for failures)
    const redElements = document.querySelectorAll('[class*="text-red"]');
    for (const el of redElements) {
      const text = el.textContent?.trim() || '';
      for (const failure of failureIndicators) {
        if (text.includes(failure)) {
          console.log('[LeetCode SR] Found failure indicator:', failure);
          return false;
        }
      }
    }
    
    // Check for "X / Y testcases passed" where X !== Y (failure case)
    const pageText = document.body.innerText;
    const testcaseMatch = pageText.match(/(\d+)\s*\/\s*(\d+)\s*testcases passed/i);
    if (testcaseMatch && testcaseMatch[1] !== testcaseMatch[2]) {
      console.log('[LeetCode SR] Found failed testcases:', testcaseMatch[0]);
      return false;
    }
    
    // Now check for accepted: look for the specific result panel structure
    // The accepted panel has "Runtime X ms Beats Y%" AND "Memory X MB Beats Y%"
    // These must be in close proximity (same container)
    const resultPanels = document.querySelectorAll('[class*="border-border-tertiary"], [class*="rounded-lg"][class*="border"]');
    for (const panel of resultPanels) {
      const text = panel.innerText || '';
      const hasRuntimeBeats = /Runtime[\s\S]{0,50}ms[\s\S]{0,50}Beats[\s\S]{0,20}%/.test(text);
      const hasMemoryBeats = /Memory[\s\S]{0,50}MB[\s\S]{0,50}Beats[\s\S]{0,20}%/.test(text);
      
      if (hasRuntimeBeats && hasMemoryBeats) {
        console.log('[LeetCode SR] Found accepted result panel with Runtime/Memory Beats');
        return true;
      }
    }
    
    return false;
  }
  
  isFailedSubmission() {
    const pageText = document.body.innerText;
    
    // Check for failure indicators
    const failurePatterns = [
      'Wrong Answer',
      'Time Limit Exceeded',
      'Memory Limit Exceeded', 
      'Runtime Error',
      'Compile Error',
      'Output Limit Exceeded'
    ];
    
    // Also check the submission tab for these
    const submissionTab = document.querySelector('#submission-detail_tab');
    const tabText = submissionTab?.textContent?.trim() || '';
    
    for (const pattern of failurePatterns) {
      if (tabText.includes(pattern) || pageText.includes(pattern)) {
        // Make sure we're not just seeing these words in the problem description
        // Check if they're in a red/failure context
        const redElements = document.querySelectorAll('[class*="text-red"], [class*="text-yellow"], [class*="text-orange"]');
        for (const el of redElements) {
          if (el.textContent?.includes(pattern)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  showModal() {
    if (this.modalShown) return;
    this.modalShown = true;
    
    const problemInfo = this.extractProblemInfo();
    if (problemInfo) {
      this.showAddToSpacedRepModal(problemInfo);
    }
  }
  
  observeUrlChanges() {
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.modalShown = false;
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  extractProblemInfo() {
    // Extract problem title from the page
    const titleSelectors = [
      '[data-cy="question-title"]',
      'a[href*="/problems/"][class*="title"]',
      'div[class*="title"] a[href*="/problems/"]',
      '[class*="text-title"]',
      'h4 a[href*="/problems/"]'
    ];
    
    let title = null;
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        title = el.textContent.trim();
        // Clean up title - remove problem number prefix if present
        title = title.replace(/^\d+\.\s*/, '');
        break;
      }
    }
    
    // Fallback: extract from URL
    if (!title) {
      const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
      if (match) {
        title = match[1].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    // Extract difficulty
    let difficulty = 'Medium';
    const difficultyEl = document.querySelector('[class*="difficulty"], [diff], .text-olive, .text-yellow, .text-pink, [class*="easy"], [class*="medium"], [class*="hard"]');
    if (difficultyEl) {
      const text = difficultyEl.textContent?.toLowerCase() || '';
      const className = difficultyEl.className?.toLowerCase() || '';
      if (text.includes('easy') || className.includes('easy') || className.includes('olive')) {
        difficulty = 'Easy';
      } else if (text.includes('hard') || className.includes('hard') || className.includes('pink')) {
        difficulty = 'Hard';
      }
    }
    
    // Extract problem ID from URL
    const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    const problemSlug = urlMatch ? urlMatch[1] : null;
    
    return {
      title: title || 'Unknown Problem',
      difficulty,
      url: window.location.href.split('?')[0].split('/description')[0],
      slug: problemSlug
    };
  }
  
  showAddToSpacedRepModal(problemInfo) {
    // Remove existing modal if any
    const existingModal = document.getElementById('leetcode-spaced-rep-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'leetcode-spaced-rep-modal';
    modal.className = 'lsr-modal-overlay';
    modal.innerHTML = `
      <div class="lsr-modal">
        <div class="lsr-modal-header">
          <h2>🎉 Problem Accepted!</h2>
          <button class="lsr-close-btn">&times;</button>
        </div>
        <div class="lsr-modal-body">
          <div class="lsr-problem-info">
            <h3>${problemInfo.title}</h3>
            <span class="lsr-difficulty lsr-${problemInfo.difficulty.toLowerCase()}">${problemInfo.difficulty}</span>
          </div>
          
          <p class="lsr-prompt">Add to spaced repetition schedule?</p>
          
          <div class="lsr-options">
            <div class="lsr-option-group">
              <label>Repetition Intervals:</label>
              <select id="lsr-interval-preset">
                <option value="standard">Standard (1d, 3d, 1w, 2w, 1m)</option>
                <option value="intensive">Intensive (1d, 2d, 4d, 1w, 2w)</option>
                <option value="relaxed">Relaxed (1d, 1w, 2w, 1m, 2m)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div class="lsr-option-group" id="lsr-rep-count-group">
              <label>Number of Repetitions:</label>
              <select id="lsr-rep-count">
                <option value="3">3 repetitions</option>
                <option value="5" selected>5 repetitions</option>
                <option value="7">7 repetitions</option>
                <option value="10">10 repetitions</option>
              </select>
            </div>
            
            <div class="lsr-option-group lsr-custom-intervals" id="lsr-custom-intervals" style="display: none;">
              <label>Custom Intervals (comma-separated days):</label>
              <input type="text" id="lsr-custom-input" placeholder="e.g., 1, 3, 7, 14, 30" value="1, 3, 7, 14, 30">
              <small class="lsr-hint">Enter days from today, separated by commas</small>
            </div>
          </div>
          
          <div class="lsr-preview">
            <label>Scheduled Review Dates:</label>
            <div id="lsr-dates-preview" class="lsr-dates-list"></div>
          </div>
        </div>
        <div class="lsr-modal-footer">
          <button class="lsr-btn lsr-btn-secondary" id="lsr-skip-btn">Skip</button>
          <button class="lsr-btn lsr-btn-primary" id="lsr-add-btn">Add to Schedule</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    this.setupModalListeners(modal, problemInfo);
    
    // Initial preview
    this.updateDatesPreview();
  }
  
  setupModalListeners(modal, problemInfo) {
    const closeBtn = modal.querySelector('.lsr-close-btn');
    const skipBtn = modal.querySelector('#lsr-skip-btn');
    const addBtn = modal.querySelector('#lsr-add-btn');
    const intervalSelect = modal.querySelector('#lsr-interval-preset');
    const repCountSelect = modal.querySelector('#lsr-rep-count');
    const customIntervalsDiv = modal.querySelector('#lsr-custom-intervals');
    const repCountGroup = modal.querySelector('#lsr-rep-count-group');
    const customInput = modal.querySelector('#lsr-custom-input');
    
    const closeModal = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    skipBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    intervalSelect.addEventListener('change', () => {
      const isCustom = intervalSelect.value === 'custom';
      customIntervalsDiv.style.display = isCustom ? 'block' : 'none';
      repCountGroup.style.display = isCustom ? 'none' : 'block';
      this.updateDatesPreview();
    });
    
    repCountSelect.addEventListener('change', () => this.updateDatesPreview());
    customInput.addEventListener('input', () => this.updateDatesPreview());
    
    addBtn.addEventListener('click', async () => {
      const dates = this.calculateScheduledDates();
      await this.saveProblem(problemInfo, dates);
      
      // Show success feedback
      addBtn.textContent = '✓ Added!';
      addBtn.disabled = true;
      
      setTimeout(closeModal, 1000);
    });
  }
  
  getIntervalDays(preset, count) {
    const intervals = {
      standard: [1, 3, 7, 14, 30, 60, 90],
      intensive: [1, 2, 4, 7, 14, 21, 30],
      relaxed: [1, 7, 14, 30, 60, 90, 120]
    };
    
    return intervals[preset].slice(0, count);
  }
  
  getCustomIntervalDays() {
    const customInput = document.querySelector('#lsr-custom-input');
    const inputValue = customInput?.value || '1, 3, 7, 14, 30';
    
    // Parse comma-separated values and filter valid numbers
    const intervals = inputValue
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
    
    return intervals.length > 0 ? intervals : [1, 3, 7, 14, 30];
  }
  
  calculateScheduledDates() {
    const intervalSelect = document.querySelector('#lsr-interval-preset');
    const repCountSelect = document.querySelector('#lsr-rep-count');
    
    const preset = intervalSelect.value;
    let intervals;
    
    if (preset === 'custom') {
      intervals = this.getCustomIntervalDays();
    } else {
      const count = parseInt(repCountSelect.value);
      intervals = this.getIntervalDays(preset, count);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return intervals.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    });
  }
  
  updateDatesPreview() {
    const previewEl = document.querySelector('#lsr-dates-preview');
    const dates = this.calculateScheduledDates();
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    previewEl.innerHTML = dates.map((date, i) => `
      <div class="lsr-date-item">
        <span class="lsr-rep-num">Rep ${i + 1}</span>
        <span class="lsr-date">${formatDate(date)}</span>
      </div>
    `).join('');
  }
  
  async saveProblem(problemInfo, scheduledDates) {
    const result = await chrome.storage.local.get(['spacedRepProblems']);
    const problems = result.spacedRepProblems || {};
    
    const problemId = problemInfo.slug || problemInfo.title.toLowerCase().replace(/\s+/g, '-');
    
    problems[problemId] = {
      title: problemInfo.title,
      difficulty: problemInfo.difficulty,
      url: problemInfo.url,
      addedDate: new Date().toISOString().split('T')[0],
      scheduledDates: scheduledDates,
      completedDates: []
    };
    
    await chrome.storage.local.set({ spacedRepProblems: problems });
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'PROBLEM_ADDED',
      problem: problems[problemId]
    });
  }
}

// Initialize the detector
new LeetCodeSubmissionDetector();
