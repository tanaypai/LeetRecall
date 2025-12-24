// Background service worker for LeetCode Spaced Repetition extension

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROBLEM_ADDED') {
    console.log('Problem added to spaced rep:', message.problem);
    
    // Could add notification here
    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: 'icons/icon48.png',
    //   title: 'Problem Added',
    //   message: `${message.problem.title} added to your spaced repetition schedule!`
    // });
  }
  
  return true;
});

// Check for due problems daily
chrome.alarms.create('checkDueProblems', {
  periodInMinutes: 60 // Check every hour
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkDueProblems') {
    await checkAndNotifyDueProblems();
  }
});

async function checkAndNotifyDueProblems() {
  const result = await chrome.storage.local.get(['spacedRepProblems', 'lastNotificationDate']);
  const problems = result.spacedRepProblems || {};
  const today = new Date().toISOString().split('T')[0];
  
  // Only notify once per day
  if (result.lastNotificationDate === today) {
    return;
  }
  
  let dueCount = 0;
  for (const problem of Object.values(problems)) {
    if (problem.scheduledDates && problem.scheduledDates.includes(today)) {
      dueCount++;
    }
  }
  
  if (dueCount > 0) {
    // Update badge
    chrome.action.setBadgeText({ text: dueCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ffa116' });
    
    // Save notification date
    await chrome.storage.local.set({ lastNotificationDate: today });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Initial check on install/update
chrome.runtime.onInstalled.addListener(() => {
  checkAndNotifyDueProblems();
});

// Check on startup
chrome.runtime.onStartup.addListener(() => {
  checkAndNotifyDueProblems();
});
