// Popup script để hiển thị và quản lý lịch sử với tìm kiếm
document.addEventListener('DOMContentLoaded', async () => {
  const historyList = document.getElementById('historyList');
  const clearButton = document.getElementById('clearHistory');
  const searchInput = document.getElementById('searchInput');
  const visibleCount = document.getElementById('visibleCount');
  const totalCount = document.getElementById('totalCount');

  let allHistoryItems = [];

  // Lấy lịch sử từ storage
  const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);

  // Hiển thị lịch sử
  displayHistory(clipboardHistory);

  // Lắng nghe sự kiện tìm kiếm
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterHistory(searchTerm);
  });

  // Xóa lịch sử
  clearButton.addEventListener('click', async () => {
    await chrome.storage.local.set({ clipboardHistory: [] });
    historyList.innerHTML = '';
    allHistoryItems = [];
    updateStats();
  });

  function displayHistory(history) {
    historyList.innerHTML = '';
    allHistoryItems = [];

    history.forEach((item, index) => {
      const li = document.createElement('li');
      const timestamp = new Date(item.timestamp);
      const timeString = timestamp.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });

      li.innerHTML = `
        <div class="history-item">
          <div class="history-text">${item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text}</div>
          <div class="history-time">${timeString}</div>
        </div>
      `;
      li.title = item.text; // Hiển thị đầy đủ khi hover
      li.dataset.index = index;
      li.dataset.text = item.text.toLowerCase();

      li.addEventListener('click', () => {
        // Copy lại vào clipboard khi nhấn
        navigator.clipboard.writeText(item.text).then(() => {
          li.style.background = '#c8e6c9'; // Đổi màu để xác nhận
          setTimeout(() => li.style.background = '#f0f0f0', 1000);
        });
      });

      historyList.appendChild(li);
      allHistoryItems.push(li);
    });

    updateStats();
  }

  function filterHistory(searchTerm) {
    let visibleItems = 0;

    allHistoryItems.forEach(item => {
      const text = item.dataset.text;
      const isVisible = searchTerm === '' || text.includes(searchTerm);

      if (isVisible) {
        item.classList.add('visible');
        visibleItems++;
      } else {
        item.classList.remove('visible');
      }
    });

    visibleCount.textContent = visibleItems;
  }

  function updateStats() {
    totalCount.textContent = allHistoryItems.length;
    visibleCount.textContent = allHistoryItems.length;
  }
});
