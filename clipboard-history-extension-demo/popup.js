// Popup script để hiển thị và quản lý lịch sử
document.addEventListener('DOMContentLoaded', async () => {
  const historyList = document.getElementById('historyList');
  const clearButton = document.getElementById('clearHistory');

  // Lấy lịch sử từ storage
  const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);

  // Hiển thị lịch sử
  historyList.innerHTML = '';
  clipboardHistory.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = item.length > 50 ? item.substring(0, 50) + '...' : item;
    li.title = item; // Hiển thị đầy đủ khi hover
    li.addEventListener('click', () => {
      // Copy lại vào clipboard khi nhấn
      navigator.clipboard.writeText(item).then(() => {
        li.style.background = '#c8e6c9'; // Đổi màu để xác nhận
        setTimeout(() => li.style.background = '#f0f0f0', 1000);
      });
    });
    historyList.appendChild(li);
  });

  // Xóa lịch sử
  clearButton.addEventListener('click', async () => {
    await chrome.storage.local.set({ clipboardHistory: [] });
    historyList.innerHTML = '';
  });
});
