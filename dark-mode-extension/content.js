// Content script để áp dụng dark mode trên mọi trang web
let darkModeEnabled = false;
let darkModeStyle = null;

// Hàm áp dụng dark mode
function applyDarkMode() {
  if (darkModeStyle) {
    darkModeStyle.remove();
  }

  darkModeStyle = document.createElement('style');
  darkModeStyle.id = 'dark-mode-extension-styles';
  darkModeStyle.textContent = `
    /* Dark Mode Extension Styles */
    * {
      background-color: #1a1a1a !important;
      color: #ffffff !important;
      border-color: #444444 !important;
    }

    /* Loại trừ các elements không nên đổi màu */
    img, video, canvas, svg, [style*="background-image"], .dark-mode-exclude {
      background-color: inherit !important;
      color: inherit !important;
    }

    /* Đảm bảo các input và textarea có màu phù hợp */
    input, textarea, select {
      background-color: #333333 !important;
      color: #ffffff !important;
      border: 1px solid #555555 !important;
    }

    /* Đảm bảo các nút có màu phù hợp */
    button, [role="button"] {
      background-color: #444444 !important;
      color: #ffffff !important;
      border: 1px solid #666666 !important;
    }

    /* Đảm bảo các liên kết có màu phù hợp */
    a {
      color: #66b3ff !important;
    }

    a:visited {
      color: #cc99ff !important;
    }

    /* Đảm bảo các bảng có màu phù hợp */
    table, th, td {
      background-color: #2a2a2a !important;
      border: 1px solid #555555 !important;
    }

    /* Đảm bảo các dropdown menu có màu phù hợp */
    option {
      background-color: #333333 !important;
      color: #ffffff !important;
    }

    /* Đảm bảo các shadow và overlay có màu phù hợp */
    [style*="box-shadow"], [style*="text-shadow"] {
      box-shadow: none !important;
      text-shadow: none !important;
    }

    /* Đảm bảo các iframe giữ nguyên màu gốc nếu cần */
    iframe {
      background-color: white !important;
      color: black !important;
    }
  `;

  document.head.appendChild(darkModeStyle);
  console.log('Dark mode đã được áp dụng');
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
  chrome.storage.local.get(['darkMode'], (result) => {
    darkModeEnabled = result.darkMode || false;
    if (darkModeEnabled) {
      applyDarkMode();
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
      applyDarkMode();
    } else {
      removeDarkMode();
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
