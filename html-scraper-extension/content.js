// Content Script để lấy HTML tự động khi trang tải
function autoScrapeHTML() {
  const html = document.documentElement.outerHTML;
  chrome.runtime.sendMessage({ action: 'autoSaveHTML', html: html });
}

// Chạy tự động khi DOM tải xong
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoScrapeHTML);
} else {
  autoScrapeHTML();
}
