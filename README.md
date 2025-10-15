# 🌟 Web Development Playground

Chào mừng đến với **Web Development Playground** – một bộ sưu tập vui vẻ và toàn diện các công cụ, template và ví dụ code để giúp bạn học tập và phát triển ứng dụng web hiện đại! Từ chatbot AI đến extension Chrome, từ bot Discord đến code samples đa ngôn ngữ, dự án này là sân chơi lý tưởng cho developer mọi cấp độ.

## 📂 Cấu trúc dự án

Dự án được tổ chức gọn gàng để dễ khám phá:

```
web-dev-playground/
├── AI-chatbot/                    # 🤖 Chatbot AI tích hợp Hugging Face
├── countdown-timer/               # ⏰ Extension đếm ngược Chrome
├── discord-reaction-role-bot/     # 🤖 Bot Discord quản lý role
├── html-scraper-extension/        # 🔍 Extension lấy HTML trang web
├── youtube-video-downloader/      # 🎥 Extension tải video YouTube
├── web-dev-prefabs/               # 🛠️ Template và utilities web
└── code-prefency/                 # 📦 67 code samples đa lĩnh vực
```

## 🚀 Các dự án nổi bật

- **🤖 AI Chatbot**: Trò chuyện với AI thông minh, giao diện đẹp mắt và dễ tùy chỉnh. Chỉ cần nhập API key là chạy ngay!
- **⏰ Countdown Timer Extension**: Đếm ngược thời gian với thông báo, hoàn hảo cho công việc hoặc học tập.
- **🤖 Discord Reaction Role Bot**: Quản lý server Discord tự động, gán role dựa trên reaction – siêu tiện!
- **🔍 HTML Scraper Extension**: Lấy và phân tích HTML từ bất kỳ URL nào, hữu ích cho scraping dữ liệu.
- **🎥 YouTube Video Downloader Extension**: Tải video hoặc audio từ YouTube nhanh chóng và dễ dàng.
- **🛠️ Web Dev Prefabs**: Bộ sưu tập template HTML/CSS/JS, utilities và mẫu trang hoàn chỉnh để khởi đầu dự án.
- **📦 Code Prefency Collection**: Hơn 67 file code mẫu cho Frontend, Backend, Mobile và nhiều lĩnh vực khác – sẵn sàng chạy!

## 🚀 Dự án Extension Phát Triển

Hai extension đã được cải tiến đặc biệt để nâng cao trải nghiệm người dùng:

- **📋 Clipboard History Extension**: Quản lý lịch sử clipboard với tìm kiếm thời gian thực, timestamps và giao diện popup hiện đại. Dễ dàng sao chép lại văn bản đã lưu!
- **🌙 Dark Mode Extension**: Chuyển mọi trang web sang chế độ tối với nhiều theme tùy chọn (Classic, Blue, Purple, Green). Áp dụng toàn diện và dễ bật/tắt.

Những extension này là ví dụ thực tế về phát triển Chrome extension, sẵn sàng để học tập và mở rộng.

## 📂 Cấu trúc chi tiết các extension

Dưới đây là cây thư mục chi tiết của hai extension đã phát triển:

### Clipboard History Extension Demo (`clipboard-history-extension-demo/`)
```
clipboard-history-extension-demo/
├── manifest.json                  # Cấu hình extension với permissions
├── background.js                  # Background script để mở giao diện
├── content.js                     # Content script lưu clipboard history
├── popup.html                     # Giao diện popup chính với tìm kiếm
├── popup.js                       # Logic xử lý popup và tìm kiếm
├── history.html                   # Trang web hiển thị lịch sử đầy đủ
└── history.js                     # JavaScript xử lý giao diện lịch sử
```

### Dark Mode Extension (`dark-mode-extension/`)
```
dark-mode-extension/
├── manifest.json                  # Cấu hình extension với permissions
├── background.js                  # Background script xử lý messages
├── content.js                     # Content script áp dụng dark mode
├── popup.html                     # Giao diện popup chọn theme
├── popup.js                       # Logic xử lý popup và theme
├── dark-mode.css                  # CSS tùy chỉnh cho dark mode
└── icons/                         # Thư mục chứa icon extension
    ├── icon16.svg
    ├── icon32.svg
    ├── icon48.svg
    └── icon128.svg
```

## 🛠️ Cách chạy nhanh

### Browser Extensions (Chrome)
1. Mở `chrome://extensions/`, bật Developer mode.
2. Nhấn "Load unpacked" và chọn thư mục extension (ví dụ: `countdown-timer/`).
3. Extension sẵn sàng sử dụng!

### Ứng dụng Web và Bot
- **AI Chatbot**: Mở `AI-chatbot/index.html` trong trình duyệt, nhập API key và bắt đầu chat.
- **Discord Bot**: Cài dependencies từ `requirements.txt`, cấu hình token trong `config.py`, chạy `python bot.py`.
- **Code Samples**: Copy file từ `code-prefency/` và chạy theo ngôn ngữ (ví dụ: `npm start` cho React, `python main.py` cho Python).

### Web Prefabs
- Copy template từ `web-dev-prefabs/` vào dự án của bạn để bắt đầu nhanh chóng.

## 📚 Tài nguyên hữu ích

- **Web Dev**: [MDN Web Docs](https://developer.mozilla.org/), [CSS Tricks](https://css-tricks.com/), [Web.dev](https://web.dev/)
- **Languages**: [React.dev](https://react.dev/), [Python.org](https://python.org/), [Node.js Docs](https://nodejs.org/)
- **Tools**: [Visual Studio Code](https://code.visualstudio.com/), [GitHub](https://github.com/)

## 🤝 Đóng góp

Bạn muốn thêm tính năng mới hoặc sửa lỗi? Tuyệt vời! Fork dự án, tạo branch, commit thay đổi và gửi Pull Request trên GitHub. Chúng tôi chào đón mọi đóng góp từ cộng đồng!

## 📜 Giấy phép

Dự án này sử dụng giấy phép MIT License. Xem file `LICENSE` để biết chi tiết.

## 🙏 Lời cảm ơn

Cảm ơn bạn đã ghé thăm! Dự án này được xây dựng với mục tiêu học tập và chia sẻ kiến thức. Nếu có câu hỏi, hãy tạo issue trên GitHub hoặc liên hệ chúng tôi.

---

**Happy Coding! 🎉**  
*Được tạo với ❤️ bởi đội ngũ Code Prefency*
