// Popup script cho Dark Mode Extension
document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById('darkModeToggle');
  const status = document.getElementById('status');

  // Lấy trạng thái dark mode hiện tại từ storage
  const { darkMode = false } = await chrome.storage.local.get(['darkMode']);

  // Cập nhật UI dựa trên trạng thái hiện tại
  updateUI(darkMode);

  // Lắng nghe sự kiện click trên toggle switch
  toggleSwitch.addEventListener('click', async () => {
    try {
      // Lấy trạng thái hiện tại
      const { darkMode: currentDarkMode = false } = await chrome.storage.local.get(['darkMode']);
      const newDarkMode = !currentDarkMode;

      // Cập nhật trạng thái trong storage
      await chrome.storage.local.set({ darkMode: newDarkMode });

      // Gửi message đến background script để áp dụng cho tất cả các tab
      await chrome.runtime.sendMessage({ action: 'toggleDarkMode' });

      // Cập nhật UI
      updateUI(newDarkMode);

      console.log('Dark mode toggled:', newDarkMode);
    } catch (error) {
      console.error('Lỗi khi toggle dark mode:', error);
      // Đảm bảo UI được cập nhật ngay cả khi có lỗi
      const { darkMode: currentDarkMode = false } = await chrome.storage.local.get(['darkMode']);
      updateUI(currentDarkMode);
    }
  });
});

// Hàm cập nhật giao diện người dùng
function updateUI(isDarkMode) {
  const toggleSwitch = document.getElementById('darkModeToggle');
  const status = document.getElementById('status');

  if (isDarkMode) {
    toggleSwitch.classList.add('active');
    status.textContent = 'Đã bật';
    status.className = 'status enabled';
  } else {
    toggleSwitch.classList.remove('active');
    status.textContent = 'Đã tắt';
    status.className = 'status disabled';
  }
}
