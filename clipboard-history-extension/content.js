// Content script cải tiến để lưu clipboard history với debug
console.log('Content script loaded');

// Lắng nghe sự kiện copy và lưu selected text
document.addEventListener('copy', async (event) => {
  console.log('Copy event triggered');
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    console.log('Selected text:', selectedText);
    await saveToHistory(selectedText);
  } else {
    console.log('No selected text found');
  }
});

// Hàm lưu vào storage (tránh duplicate gần đây)
async function saveToHistory(text) {
  try {
    const { clipboardHistory = [] } = await chrome.storage.local.get(['clipboardHistory']);

    // Tạo object với text và timestamp
    const newItem = {
      text: text,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random() // Unique ID
    };

    // Kiểm tra duplicate dựa trên text
    const isDuplicate = clipboardHistory.some(item => item.text === text);

    if (!isDuplicate) {
      const newHistory = [newItem, ...clipboardHistory.slice(0, 49)];
      await chrome.storage.local.set({ clipboardHistory: newHistory });
      console.log('Saved to history:', text);
    } else {
      console.log('Duplicate text, not saved');
    }
  } catch (err) {
    console.error('Error saving to history:', err);
  }
}

// Thử truy cập clipboard trực tiếp (chỉ hoạt động với user gesture, ví dụ nhấn nút)
async function tryReadClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text.trim()) {
      console.log('Clipboard text:', text);
      await saveToHistory(text);
    }
  } catch (err) {
    console.error('Failed to read clipboard:', err);
  }
}

// Ví dụ: Nếu bạn muốn thêm nút trên trang để trigger, nhưng vì extension, tốt hơn dùng popup
