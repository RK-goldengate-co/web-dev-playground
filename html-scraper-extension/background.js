// Background Script để xử lý tự động
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'autoSaveHTML') {
    // Lưu HTML vào chrome.storage (có thể truy cập từ popup sau)
    chrome.storage.local.set({ 'lastHTML': request.html }, function() {
      console.log('HTML đã lưu tự động.');
      // Thông báo cho người dùng
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'HTML Scraper',
        message: 'HTML của trang đã được lưu tự động!'
      });
    });
  }
});
