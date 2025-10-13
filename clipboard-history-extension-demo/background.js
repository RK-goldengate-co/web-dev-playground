// Background script (service worker) để xử lý các tác vụ nền nếu cần
// Hiện tại, content script đã xử lý hầu hết, nhưng có thể mở rộng thêm ở đây
// Background script để mở giao diện web khi nhấn icon
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Clipboard History Extension đã được cài đặt!');
});
