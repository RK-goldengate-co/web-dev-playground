# 🌟 Web Development Playground

Chào mừng đến với **Web Development Playground** – một bộ sưu tập vui vẻ và toàn diện các công cụ, template và ví dụ code để giúp bạn học tập và phát triển ứng dụng web hiện đại! Từ chatbot AI đến extension Chrome, từ bot Discord đến code samples đa ngôn ngữ, dự án này là sân chơi lý tưởng cho developer mọi cấp độ.

## 📂 Cấu trúc dự án

Dưới đây là cây thư mục chi tiết của dự án:

```
web-dev-playground/
├── README.md                          # Tài liệu hướng dẫn này
├── AI-chatbot/                        # Chatbot AI với Hugging Face API
│   ├── index.html                     # Giao diện chính của chatbot
│   ├── styles.css                     # Styling cho chatbot với responsive design
│   ├── script.js                      # Logic xử lý trò chuyện và API calls
│   └── README.md                      # Hướng dẫn cài đặt và sử dụng chatbot
├── countdown-timer/                   # Extension Chrome đếm ngược với giao diện tùy chỉnh
│   ├── index.html                     # Trang chính cho extension
│   ├── popup.html                     # Popup giao diện đếm ngược
│   ├── styles.css                     # CSS cho giao diện đẹp mắt
│   ├── script.js                      # JavaScript xử lý logic đếm ngược
│   └── manifest.json                  # Cấu hình Chrome extension
├── discord-reaction-role-bot/         # Bot Discord cho Reaction Role System
│   ├── bot.py                         # Code chính của bot Discord
│   ├── config.py                      # Module cấu hình bot và token
│   ├── requirements.txt               # Dependencies Python cần thiết
│   ├── README.md                      # Hướng dẫn chi tiết cách chạy bot
│   └── .gitignore                     # Git ignore rules cho bảo mật
├── html-scraper-extension/            # Extension Chrome lấy HTML của trang web
│   ├── manifest.json                  # Cấu hình extension với permissions
│   ├── popup.html                     # Giao diện popup chính với form nhập URL
│   ├── popup.js                       # Logic xử lý popup và phân tích HTML
│   ├── background.js                  # Background script cho extension
│   └── content.js                     # Content script để lấy HTML từ trang web
├── youtube-video-downloader-extension/ # Extension Chrome tải video YouTube
│   ├── manifest.json                  # Cấu hình extension với permissions
│   ├── popup.html                     # Giao diện popup với form nhập URL YouTube
│   ├── popup.js                       # Logic xử lý tải video và giao diện
│   ├── background.js                  # Background script xử lý API và tải
│   └── content.js                     # Content script cho trang YouTube
├── web-dev-prefabs/                   # Bộ sưu tập web development
│   ├── README.md                      # Tài liệu hướng dẫn cho prefabs
│   ├── html/                          # HTML templates cơ bản
│   │   ├── basic-template.html        # Template HTML cơ bản với semantic
│   │   └── responsive-layout.html     # Layout responsive với CSS Grid
│   ├── css/                           # CSS utilities và components
│   │   ├── reset.css                  # CSS reset chuẩn
│   │   └── utilities.css               # Utilities classes cho margin/padding
│   └── js/                            # JavaScript helpers và utils
│       └── utils.js                   # Utilities functions chung
└── code-prefency/                     # Bộ sưu tập code mẫu đa ngôn ngữ
    ├── README_STRUCTURE.md            # Hướng dẫn cấu trúc thư mục chi tiết
    ├── frontend/                      # Frontend Applications
    │   └── web/                       # Web applications samples
    │       ├── html-css-js/           # Pure HTML/CSS/JavaScript examples
    │       │   ├── index.html         # Trang chủ với responsive design
    │       │   └── styles.css         # CSS với Flexbox và Grid
    │       └── react/                 # React applications samples
    │           ├── App.jsx            # Component chính với hooks
    │           └── index.js           # Entry point với ReactDOM
    └── backend/                       # Backend Applications
        └── python/                    # Python backend examples
            ├── main.py                # Flask app với routes cơ bản
            └── requirements.txt       # Dependencies Python
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
