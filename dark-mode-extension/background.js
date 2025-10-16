// Background script cho dark mode extension với nhiều theme
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dark Mode Extension đã được cài đặt');

  // Khởi tạo trạng thái dark mode và theme mặc định
  chrome.storage.local.set({ darkMode: false, theme: 'classic' });
});

// Lắng nghe messages từ popup hoặc content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleDarkMode') {
    // Lấy trạng thái hiện tại và đảo ngược nó
    chrome.storage.local.get(['darkMode'], (result) => {
      const newDarkMode = !result.darkMode;
      chrome.storage.local.set({ darkMode: newDarkMode });

      // Gửi message đến tất cả các tab đang mở
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'toggleDarkMode',
            darkMode: newDarkMode
          });
        });
      });

      sendResponse({ success: true, darkMode: newDarkMode });
    });
    return true; // Giữ message channel mở cho async response
  } else if (request.action === 'changeTheme') {
    // Cập nhật theme trong storage
    chrome.storage.local.set({ theme: request.theme });

    // Gửi message đến tất cả các tab đang mở để áp dụng theme mới
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'changeTheme',
          theme: request.theme
        });
      });
    });

    sendResponse({ success: true, theme: request.theme });
    return true;
  }
});
