class SpacedRepCalendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.problems = {};
    
    this.init();
  }
  
  async init() {
    await this.loadProblems();
    this.renderCalendar();
    this.updateStats();
    this.setupEventListeners();
  }
  
  async loadProblems() {
    const result = await chrome.storage.local.get(['spacedRepProblems']);
    this.problems = result.spacedRepProblems || {};
  }
  
  setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
    
    document.getElementById('close-details').addEventListener('click', () => {
      document.getElementById('day-details').classList.add('hidden');
      this.selectedDate = null;
    });
  }
  
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Calculate calendar days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month trailing days
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateStr = this.formatDate(new Date(year, month - 1, day));
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, true, false, problemsForDay.length);
      calendarDays.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const isToday = date.getTime() === today.getTime();
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, false, isToday, problemsForDay.length);
      calendarDays.appendChild(dayEl);
    }
    
    // Next month leading days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = this.formatDate(new Date(year, month + 1, day));
      const problemsForDay = this.getProblemsForDate(dateStr);
      
      const dayEl = this.createDayElement(day, dateStr, true, false, problemsForDay.length);
      calendarDays.appendChild(dayEl);
    }
  }
  
  createDayElement(day, dateStr, isOtherMonth, isToday, problemCount) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.dataset.date = dateStr;
    
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (problemCount > 0) dayEl.classList.add('has-problems');
    
    dayEl.innerHTML = `
      <span>${day}</span>
      ${problemCount > 0 ? `<span class="problem-count">${problemCount}</span>` : ''}
    `;
    
    dayEl.addEventListener('click', () => this.showDayDetails(dateStr));
    
    return dayEl;
  }
  
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  getProblemsForDate(dateStr) {
    const problems = [];
    
    for (const [problemId, problem] of Object.entries(this.problems)) {
      if (problem.scheduledDates && problem.scheduledDates.includes(dateStr)) {
        const repIndex = problem.scheduledDates.indexOf(dateStr);
        problems.push({
          ...problem,
          id: problemId,
          repetitionNumber: repIndex + 1,
          totalRepetitions: problem.scheduledDates.length
        });
      }
    }
    
    return problems;
  }
  
  showDayDetails(dateStr) {
    this.selectedDate = dateStr;
    const problems = this.getProblemsForDate(dateStr);
    
    const detailsEl = document.getElementById('day-details');
    const dateDisplay = document.getElementById('selected-date');
    const problemsList = document.getElementById('problems-list');
    
    const date = new Date(dateStr + 'T00:00:00');
    dateDisplay.textContent = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (problems.length === 0) {
      problemsList.innerHTML = '<div class="no-problems">No problems scheduled for this day</div>';
    } else {
      problemsList.innerHTML = problems.map(problem => `
        <div class="problem-item">
          <div class="problem-info">
            <a href="${problem.url}" target="_blank" class="problem-title">${problem.title}</a>
            <div class="problem-meta">
              <span class="difficulty-${problem.difficulty?.toLowerCase() || 'medium'}">${problem.difficulty || 'Medium'}</span>
            </div>
          </div>
          <span class="repetition-badge">Rep ${problem.repetitionNumber}/${problem.totalRepetitions}</span>
        </div>
      `).join('');
    }
    
    detailsEl.classList.remove('hidden');
  }
  
  updateStats() {
    const today = this.formatDate(new Date());
    const todayProblems = this.getProblemsForDate(today);
    
    document.getElementById('today-count').textContent = todayProblems.length;
    document.getElementById('total-count').textContent = Object.keys(this.problems).length;
  }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
  new SpacedRepCalendar();
});
