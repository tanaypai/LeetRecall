# LeetCached

A Chrome extension that helps you retain LeetCode solutions through spaced repetition scheduling. Built with a beautiful **Tokyo Night** color theme.

![LeetCached Banner](screenshots/banner.png)

## ✨ Features

- **🎨 Tokyo Night Theme**: Beautiful dark theme inspired by the popular Tokyo Night color palette
- **🔍 Automatic Detection**: Detects when you successfully submit a LeetCode problem and prompts to add it to your schedule
- **➕ Toolbar Button**: "Add to LeetCached" button in LeetCode's toolbar lets you add any problem anytime
- **📅 Spaced Repetition Scheduling**: Automatically schedules review dates using proven intervals (1, 3, 7, 14, 30 days)
- **🗓️ Calendar View**: Visual calendar showing upcoming problems to review with inline problem sidebar
- **📋 Problem Management**: Edit, reschedule, or remove problems from your review list
- **⚙️ Custom Intervals**: Choose from preset schedules (Standard, Intensive, Relaxed) or set custom intervals

## 🚀 Installation

### From Chrome Web Store
[![Available in the Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png)](https://chromewebstore.google.com/detail/leetcached/blkpkeambbkiljehnlmclemjegnmhakm)

[**Install LeetCached**](https://chromewebstore.google.com/detail/leetcached/blkpkeambbkiljehnlmclemjegnmhakm)

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The LeetCached icon will appear in your toolbar

## 📖 Usage

1. **Install & Pin** - Pin LeetCached to your toolbar for easy access
2. **Add Problems** - Problems are auto-detected when accepted, or click "Add to LeetCached" in the LeetCode toolbar anytime
3. **Choose Schedule** - Select a preset interval (Standard, Intensive, Relaxed) or configure custom review dates
4. **Review Problems** - Click the extension icon to see your calendar and upcoming reviews
5. **Stay on Track** - Check the stats cards to see problems due today and this week

## 📸 Screenshots

### Calendar View
<img src="screenshots/calendar-view.png" alt="Calendar View" width="400">

*Visual calendar with scheduled problems and sidebar showing daily reviews*

### Manage View
<img src="screenshots/manage-view.png" alt="Manage View" width="400">

*Search, sort, and manage all your tracked problems*

### Add to LeetCached Button
<img src="screenshots/toolbar-button.png" alt="Toolbar Button" width="500">

*One-click button in LeetCode's toolbar to add any problem*

### Add Problem Modal
<img src="screenshots/add-modal.png" alt="Add Modal" width="300">

*Choose your spaced repetition schedule when adding problems*

### Help & Support
<img src="screenshots/help-view.png" alt="Help View" width="400">

*Built-in help center with getting started guide and FAQs*

## 🎨 Tokyo Night Theme

LeetCached features a carefully crafted dark theme using the Tokyo Night color palette:

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark Blue | `#1a1b26` |
| Surface | Slate | `#24283b` |
| Primary | Blue | `#7aa2f7` |
| Secondary | Purple | `#bb9af7` |
| Success | Green | `#9ece6a` |
| Warning | Orange | `#ff9e64` |
| Text | Light Blue | `#c0caf5` |

## 📚 How Spaced Repetition Works

Spaced repetition is a learning technique that involves reviewing material at increasing intervals:

### Preset Schedules

| Preset | Intervals (days) | Best For |
|--------|------------------|----------|
| **Standard** | 1, 3, 7, 14, 30 | Balanced retention |
| **Intensive** | 1, 2, 4, 7, 14 | Quick mastery |
| **Relaxed** | 2, 7, 14, 30, 60 | Long-term retention |

This pattern helps transfer knowledge from short-term to long-term memory, making it ideal for retaining coding patterns and problem-solving techniques.

## 🔒 Privacy

LeetCached respects your privacy:
- All data is stored **locally** on your device using Chrome's storage API
- **No data is sent** to external servers
- **No tracking** or analytics
- **No account required**

## 🔐 Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Store your tracked problems and review schedule locally |
| `host_permissions` (leetcode.com) | Detect accepted submissions and inject toolbar button |

## 🛠️ Development

### Project Structure
```
LeetCached/
├── manifest.json          # Extension configuration
├── background/
│   └── background.js      # Service worker for extension events
├── content/
│   ├── content.js         # Submission detection & toolbar button
│   └── content.css        # Modal & button styling (Tokyo Night)
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Calendar and problem management
│   └── popup.css          # Popup styling (Tokyo Night theme)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── screenshots/           # README screenshots
```

### Building
No build step required - the extension runs directly from source.

### Tech Stack
- Vanilla JavaScript (no frameworks)
- CSS3 with CSS Variables for theming
- Chrome Extensions Manifest V3
- JetBrains Mono font
- Material Symbols icons

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use and modify as needed.

---

<p align="center">
  Made with 💜 for the LeetCode community
</p>
