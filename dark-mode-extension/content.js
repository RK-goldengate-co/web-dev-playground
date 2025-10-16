// Content script để áp dụng dark mode trên mọi trang web với nhiều theme
let darkModeEnabled = false;
let currentTheme = 'classic';
let darkModeStyle = null;

// Các theme dark mode khác nhau
const themes = {
  classic: {
    name: 'Cổ điển',
    styles: `
      * {
        background-color: #1a1a1a !important;
        color: #ffffff !important;
        border-color: #444444 !important;
      }

      img, video, canvas, svg, [style*="background-image"], .dark-mode-exclude {
        background-color: inherit !important;
        color: inherit !important;
      }

      input, textarea, select {
        background-color: #333333 !important;
        color: #ffffff !important;
        border: 1px solid #555555 !important;
      }

      button, [role="button"] {
        background-color: #444444 !important;
        color: #ffffff !important;
        border: 1px solid #666666 !important;
      }

      a {
        color: #66b3ff !important;
      }

      a:visited {
        color: #cc99ff !important;
      }

      table, th, td {
        background-color: #2a2a2a !important;
        border: 1px solid #555555 !important;
      }

      option {
        background-color: #333333 !important;
        color: #ffffff !important;
      }

      [style*="box-shadow"], [style*="text-shadow"] {
        box-shadow: none !important;
        text-shadow: none !important;
      }

      iframe {
        background-color: white !important;
        color: black !important;
      }
    `
  },
  blue: {
    name: 'Xanh dương',
    styles: `
      * {
        background-color: #0f1419 !important;
        color: #e6edf3 !important;
        border-color: #30363d !important;
      }

      img, video, canvas, svg, [style*="background-image"], .dark-mode-exclude {
        background-color: inherit !important;
        color: inherit !important;
      }

      input, textarea, select {
        background-color: #21262d !important;
        color: #e6edf3 !important;
        border: 1px solid #30363d !important;
      }

      button, [role="button"] {
        background-color: #238636 !important;
        color: #ffffff !important;
        border: 1px solid #2ea043 !important;
      }

      a {
        color: #58a6ff !important;
      }

      a:visited {
        color: #bc8cff !important;
      }

      table, th, td {
        background-color: #161b22 !important;
        border: 1px solid #30363d !important;
      }

      option {
        background-color: #21262d !important;
        color: #e6edf3 !important;
      }

      [style*="box-shadow"], [style*="text-shadow"] {
        box-shadow: none !important;
        text-shadow: none !important;
      }

      iframe {
        background-color: white !important;
        color: black !important;
      }
    `
  },
  purple: {
    name: 'Tím',
    styles: `
      * {
        background-color: #1a1625 !important;
        color: #e9e9e9 !important;
        border-color: #443d5a !important;
      }

      img, video, canvas, svg, [style*="background-image"], .dark-mode-exclude {
        background-color: inherit !important;
        color: inherit !important;
      }

      input, textarea, select {
        background-color: #2d2640 !important;
        color: #e9e9e9 !important;
        border: 1px solid #443d5a !important;
      }

      button, [role="button"] {
        background-color: #8b5cf6 !important;
        color: #ffffff !important;
        border: 1px solid #a855f7 !important;
      }

      a {
        color: #c084fc !important;
      }

      a:visited {
        color: #ddd6fe !important;
      }

      table, th, td {
        background-color: #252040 !important;
        border: 1px solid #443d5a !important;
      }

      option {
        background-color: #2d2640 !important;
        color: #e9e9e9 !important;
      }

      [style*="box-shadow"], [style*="text-shadow"] {
        box-shadow: none !important;
        text-shadow: none !important;
      }

      iframe {
        background-color: white !important;
        color: black !important;
      }
    `
  },
  green: {
    name: 'Xanh lá',
    styles: `
      * {
        background-color: #0f1720 !important;
        color: #e6f3e6 !important;
        border-color: #2d4a3d !important;
      }

      img, video, canvas, svg, [style*="background-image"], .dark-mode-exclude {
        background-color: inherit !important;
        color: inherit !important;
      }

      input, textarea, select {
        background-color: #1e2f26 !important;
        color: #e6f3e6 !important;
        border: 1px solid #2d4a3d !important;
      }

      button, [role="button"] {
        background-color: #16a34a !important;
        color: #ffffff !important;
        border: 1px solid #22c55e !important;
      }

      a {
        color: #4ade80 !important;
      }

      a:visited {
        color: #86efac !important;
      }

      table, th, td {
        background-color: #1a2e25 !important;
        border: 1px solid #2d4a3d !important;
      }

      option {
        background-color: #1e2f26 !important;
        color: #e6f3e6 !important;
      }

      [style*="box-shadow"], [style*="text-shadow"] {
        box-shadow: none !important;
        text-shadow: none !important;
      }

      iframe {
        background-color: white !important;
        color: black !important;
      }
    `
  }
};

// Hàm áp dụng dark mode với theme được chọn
function applyDarkMode(theme = currentTheme) {
  if (darkModeStyle) {
    darkModeStyle.remove();
  }

  darkModeStyle = document.createElement('style');
  darkModeStyle.id = 'dark-mode-extension-styles';
  darkModeStyle.textContent = themes[theme].styles;

  document.head.appendChild(darkModeStyle);
  console.log(`Dark mode đã được áp dụng với theme: ${themes[theme].name}`);
}

// Hàm loại bỏ dark mode
function removeDarkMode() {
  if (darkModeStyle) {
    darkModeStyle.remove();
    darkModeStyle = null;
    console.log('Dark mode đã được tắt');
  }
}

// Hàm kiểm tra và áp dụng trạng thái dark mode từ storage
function checkAndApplyDarkMode() {
  chrome.storage.local.get(['darkMode', 'theme'], (result) => {
    darkModeEnabled = result.darkMode || false;
    currentTheme = result.theme || 'classic';
    if (darkModeEnabled) {
      applyDarkMode(currentTheme);
    } else {
      removeDarkMode();
    }
  });
}

// Lắng nghe messages từ background script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleDarkMode') {
    darkModeEnabled = request.darkMode;
    if (darkModeEnabled) {
      applyDarkMode(currentTheme);
    } else {
      removeDarkMode();
    }
    sendResponse({ success: true });
  } else if (request.action === 'changeTheme') {
    currentTheme = request.theme;
    if (darkModeEnabled) {
      applyDarkMode(currentTheme);
    }
    sendResponse({ success: true });
  }
});

// Áp dụng dark mode khi trang được load
document.addEventListener('DOMContentLoaded', checkAndApplyDarkMode);

// Áp dụng dark mode ngay lập tức nếu DOM đã sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndApplyDarkMode);
} else {
  checkAndApplyDarkMode();
}

console.log('Dark Mode Extension content script đã được load');
