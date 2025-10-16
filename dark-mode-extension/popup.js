// Popup script cho Dark Mode Extension với nhiều theme
document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById('darkModeToggle');
  const status = document.getElementById('status');
  const themeButtons = document.querySelectorAll('.theme-btn');

  let currentTheme = 'classic';

  // Lấy trạng thái dark mode và theme hiện tại từ storage
  const { darkMode = false, theme = 'classic' } = await chrome.storage.local.get(['darkMode', 'theme']);

  // Cập nhật UI dựa trên trạng thái hiện tại
  updateUI(darkMode);
  updateThemeButtons(theme);

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

  // Lắng nghe sự kiện click trên các nút theme
  themeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const newTheme = button.dataset.theme;

      // Cập nhật trạng thái trong storage
      await chrome.storage.local.set({ theme: newTheme });
      currentTheme = newTheme;

      // Cập nhật UI
      updateThemeButtons(newTheme);

      // Gửi message đến background script để áp dụng theme mới
      await chrome.runtime.sendMessage({ action: 'changeTheme', theme: newTheme });

      console.log('Theme changed to:', newTheme);
    });
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

// Hàm cập nhật trạng thái các nút theme
function updateThemeButtons(activeTheme) {
  const themeButtons = document.querySelectorAll('.theme-btn');

  themeButtons.forEach(button => {
    if (button.dataset.theme === activeTheme) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}
