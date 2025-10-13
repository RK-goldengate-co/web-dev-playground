// Script cho giao diện web lịch sử copy
document.addEventListener('DOMContentLoaded', () => {
  const historyList = document.getElementById('historyList');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Hàm tải và hiển thị lịch sử
  async function loadHistory() {
    const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);
    historyList.innerHTML = '';
    if (clipboardHistory.length === 0) {
      historyList.innerHTML = '<li>Chưa có lịch sử copy nào.</li>';
      return;
    }
    clipboardHistory.forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="text">${escapeHtml(item.length > 100 ? item.substring(0, 100) + '...' : item)}</div>
        <button class="copy-btn" data-text="${escapeHtml(item)}">Copy lại</button>
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

  // Nút làm mới: Đọc clipboard hiện tại và thêm vào lịch sử nếu khác
  refreshBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);
        if (clipboardHistory[0] !== text) {
          const newHistory = [text, ...clipboardHistory.slice(0, 49)];
          await chrome.storage.local.set({ clipboardHistory: newHistory });
          loadHistory(); // Reload danh sách
        }
      }
    } catch (err) {
      console.error('Không thể đọc clipboard:', err);
    }
  });

  // Nút xóa lịch sử
  clearBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ clipboardHistory: [] });
    loadHistory();
  });

  // Tải lịch sử khi mở trang
  loadHistory();
});
