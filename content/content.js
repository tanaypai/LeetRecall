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
      
      // Look for indicators that only appear for ACCEPTED submissions:
      // 1. "Runtime" and "Memory" stats with "Beats X%" - these only show for accepted
      // 2. Green "Accepted" text with class containing "text-green"
      
      // Method 1: Check for Runtime/Memory beats percentage (only shows on accepted)
      const pageText = document.body.innerText;
      const hasRuntimeBeats = pageText.includes('Runtime') && pageText.includes('Beats');
      const hasMemoryBeats = pageText.includes('Memory') && pageText.includes('Beats');
      
      if (hasRuntimeBeats && hasMemoryBeats) {
        // Found runtime and memory stats - this is an accepted submission
        // But make sure it's a fresh result (check for "Accepted" text too)
        const acceptedEl = document.querySelector('[class*="text-green-s"], [class*="text-green"]');
        if (acceptedEl && acceptedEl.textContent?.trim() === 'Accepted') {
          console.log('[LeetCode SR] Found Accepted with Runtime/Memory stats!');
          this.showModal();
          return;
        }
      }
      
      // Method 2: Look for the specific result panel structure
      // Check for "X / X testcases passed" combined with green Accepted
      const testcasesPassed = pageText.match(/(\d+)\s*\/\s*(\d+)\s*testcases passed/);
      if (testcasesPassed && testcasesPassed[1] === testcasesPassed[2]) {
        // All testcases passed - check for Accepted
        const greenElements = document.querySelectorAll('[class*="text-green"]');
        for (const el of greenElements) {
          if (el.textContent?.trim() === 'Accepted') {
            console.log('[LeetCode SR] Found Accepted with all testcases passed!');
            this.showModal();
            return;
          }
        }
      }
      
      // Keep polling
      setTimeout(checkResult, 500);
    };
    
    // Start checking after a short delay
    setTimeout(checkResult, 1000);
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
            
            <div class="lsr-option-group">
              <label>Number of Repetitions:</label>
              <select id="lsr-rep-count">
                <option value="3">3 repetitions</option>
                <option value="5" selected>5 repetitions</option>
                <option value="7">7 repetitions</option>
                <option value="10">10 repetitions</option>
              </select>
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
    
    const closeModal = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    skipBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    intervalSelect.addEventListener('change', () => this.updateDatesPreview());
    repCountSelect.addEventListener('change', () => this.updateDatesPreview());
    
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
      relaxed: [1, 7, 14, 30, 60, 90, 120],
      custom: [1, 3, 7, 14, 30, 60, 90]
    };
    
    return intervals[preset].slice(0, count);
  }
  
  calculateScheduledDates() {
    const intervalSelect = document.querySelector('#lsr-interval-preset');
    const repCountSelect = document.querySelector('#lsr-rep-count');
    
    const preset = intervalSelect.value;
    const count = parseInt(repCountSelect.value);
    const intervals = this.getIntervalDays(preset, count);
    
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
