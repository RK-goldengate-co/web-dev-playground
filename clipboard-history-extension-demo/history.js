// Script cho giao diện web lịch sử copy
document.addEventListener('DOMContentLoaded', () => {
  const historyList = document.getElementById('historyList');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearBtn = document.getElementById('clearBtn');
  const searchInput = document.getElementById('searchInput');

  // Hàm tải và hiển thị lịch sử với bộ lọc tìm kiếm
  async function loadHistory(filter = '') {
    const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);
    historyList.innerHTML = '';
    const filteredHistory = clipboardHistory.filter(item => item.text.toLowerCase().includes(filter.toLowerCase()));
    if (filteredHistory.length === 0) {
      historyList.innerHTML = filter ? '<li>Không tìm thấy kết quả nào.</li>' : '<li>Chưa có lịch sử copy nào.</li>';
      return;
    }
    filteredHistory.forEach((item, index) => {
      const li = document.createElement('li');
      const timestamp = new Date(item.timestamp).toLocaleString('vi-VN');
      li.innerHTML = `
        <div class="text">${escapeHtml(item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text)}</div>
        <small style="color: #666;">${timestamp}</small>
        <button class="copy-btn" data-text="${escapeHtml(item.text)}">Copy lại</button>
      `;
      li.querySelector('.copy-btn').addEventListener('click', (e) => {
        const text = e.target.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(() => {
          e.target.textContent = 'Đã copy!';
          e.target.style.background = '#4CAF50';
          setTimeout(() => {
            e.target.textContent = 'Copy lại';
            e.target.style.background = '#2196F3';
          }, 1000);
        });
      });
      historyList.appendChild(li);
    });
  }

  // Hàm escape HTML để tránh lỗi hiển thị
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Sự kiện tìm kiếm
  searchInput.addEventListener('input', (e) => {
    loadHistory(e.target.value);
  });

  // Nút làm mới: Đọc clipboard hiện tại và thêm vào lịch sử nếu khác
  refreshBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);
        const isDuplicate = clipboardHistory.some(item => item.text === text);
        if (!isDuplicate) {
          const newItem = {
            text: text,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
          };
          const newHistory = [newItem, ...clipboardHistory.slice(0, 49)];
          await chrome.storage.local.set({ clipboardHistory: newHistory });
          loadHistory(searchInput.value); // Reload với bộ lọc hiện tại
        }
      }
    } catch (err) {
      console.error('Không thể đọc clipboard:', err);
    }
  });

  // Nút xóa lịch sử
  clearBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ clipboardHistory: [] });
    loadHistory(searchInput.value);
  });

  // Tải lịch sử khi mở trang
  loadHistory();
});
