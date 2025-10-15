# 🚀 Web Development Playground

Bộ sưu tập toàn diện các template, component, utilities và code samples cho việc phát triển web và phần mềm hiện đại. Dự án này cung cấp một nền tảng học tập và phát triển với các ví dụ thực tế từ cơ bản đến nâng cao.

## 📁 Cấu trúc dự án

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

## 🎯 Mục tiêu dự án

- **Web Development Prefabs**: Template và utilities cho phát triển web nhanh.
- **Programming Language References**: File mẫu cho nhiều ngôn ngữ lập trình.
- **Discord Bot Applications**: Bot cho cộng đồng và quản lý server.
- **Browser Extensions**: Extension Chrome tiện ích (đếm ngược, tải video, scrape HTML).
- **Code Prefency Collection**: 67 file code mẫu đa lĩnh vực (Frontend, Backend, Mobile, v.v.).

## 🔍 Chi tiết các dự án

### 🤖 AI Chatbot
Ứng dụng chatbot AI tích hợp Hugging Face API. Tính năng: giao diện đẹp, xử lý ngôn ngữ tự nhiên, responsive. Cách chạy: Mở index.html, nhập API key.

### ⏰ Countdown Timer Extension
Extension Chrome đếm ngược với thông báo. Tính năng: đặt thời gian, giao diện tùy chỉnh. Cách cài: Load vào Chrome Extensions.

### 🤖 Discord Reaction Role Bot
Bot Discord cho hệ thống Reaction Role. Tính năng: gán role tự động, quản lý server. Cách chạy: Cài dependencies, cấu hình token, chạy bot.py.

### 🔍 HTML Scraper Extension
Extension Chrome lấy và phân tích HTML trang web. Tính năng: lấy HTML từ URL, tải file, phân tích thống kê. Cách cài: Load vào Chrome.

### 🎥 YouTube Video Downloader Extension
Extension tải video/audio từ YouTube. Tính năng: tải MP4/MP3 với thumbnail. Cách cài: Load vào Chrome, sử dụng trên YouTube.

### 🛠️ Web Dev Prefabs
Bộ sưu tập template và utilities cho web. Bao gồm HTML templates, CSS utilities, JS helpers, templates hoàn chỉnh (landing page, dashboard, portfolio).

### 📦 Code Prefency Collection
Bộ sưu tập 67 file code mẫu đa lĩnh vực: Frontend (HTML/CSS/React), Backend (PHP/Java/C#/Go/Python), Mobile/Desktop (Kotlin/C++), Database, Infrastructure, Config, Security, Docs, Testing, Tools. Mỗi file hoàn chỉnh và có thể chạy ngay.

## 🚀 Hướng dẫn chạy và sử dụng

### Cài đặt Browser Extensions
1. Mở `chrome://extensions/` trong Chrome, bật Developer mode.
2. Nhấn "Load unpacked" và chọn thư mục extension (countdown-timer, html-scraper-extension, youtube-video-downloader-extension).
3. Extension sẽ xuất hiện để sử dụng.

### Chạy Ứng dụng Web
- **AI Chatbot**: Mở `AI-chatbot/index.html` trong trình duyệt, nhập API key.
- **Web Prefabs**: Copy templates từ `web-dev-prefabs/` vào dự án.

### Chạy Backend và Bot
- **Discord Bot**: Cài dependencies từ requirements.txt, cấu hình token, chạy `python bot.py`.
- **Python Backend**: Cài requirements, chạy `python main.py` trong thư mục tương ứng.

### Sử dụng Code Samples
- Copy file từ `code-prefency/` và chạy theo ngôn ngữ (npm start cho React, python main.py cho Python, v.v.).

## 📚 Tài nguyên học tập và tham khảo

### Web Development
- [MDN Web Docs](https://developer.mozilla.org/) - Tài liệu web chuẩn
- [CSS Tricks](https://css-tricks.com/) - Thủ thuật CSS
- [Web.dev](https://web.dev/) - Best practices

### Programming Languages và Frameworks
- [React.dev](https://react.dev/) - Hướng dẫn React
- [Python.org](https://python.org/) - Tài liệu Python
- [Node.js Docs](https://nodejs.org/) - Node.js

### Development Tools
- [Visual Studio Code](https://code.visualstudio.com/) - Editor miễn phí
- [GitHub](https://github.com/) - Quản lý mã nguồn

## 🤝 Đóng góp vào dự án

Mọi đóng góp đều được chào đón! Fork dự án, tạo branch, commit và tạo Pull Request trên GitHub. Các loại đóng góp: bug fixes, tính năng mới, cải thiện docs, UI/UX, refactoring.

## 📄 Giấy phép

Dự án dưới giấy phép MIT License. Xem file `LICENSE` để biết chi tiết.

## 🙏 Lời cảm ơn

Cảm ơn tất cả contributors và cộng đồng developer! Dự án xây dựng với mục tiêu học tập và chia sẻ kiến thức.

Nếu có câu hỏi, tạo issue trên GitHub.

---

## Mẫu Form Tải Ảnh từ URL

Để giúp bạn dễ dàng tải ảnh từ URL, dưới đây là một form HTML mẫu đơn giản. Bạn có thể sao chép và sử dụng trong dự án của mình.

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tải Ảnh từ URL</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        form { max-width: 400px; margin: 0 auto; }
        input, button { display: block; width: 100%; margin: 10px 0; padding: 10px; }
        button { background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h2>Tải Ảnh từ URL</h2>
    <form id="imageForm">
        <input type="url" id="imageUrl" placeholder="Nhập URL của ảnh (ví dụ: https://example.com/image.jpg)" required>
        <button type="submit">Tải Ảnh</button>
    </form>

    <script>
        document.getElementById('imageForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const url = document.getElementById('imageUrl').value;
            if (url) {
                // Tạo link tải ảnh
                const link = document.createElement('a');
                link.href = url;
                link.download = 'downloaded-image.jpg'; // Tên file mặc định
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                alert('Đang tải ảnh...');
            }
        });
    </script>
</body>
</html>
```

### Cách sử dụng:
1. Sao chép code trên vào một file HTML mới (ví dụ: `download-image.html`).
2. Mở file trong trình duyệt.
3. Nhập URL của ảnh vào ô input.
4. Nhấn nút "Tải Ảnh" để tải về máy.

Nếu bạn cần tùy chỉnh thêm (như xử lý lỗi hoặc hỗ trợ nhiều định dạng), hãy mở rộng code theo ý mình!

---

**Happy Coding! 🎉**  
*Built with ❤️ by the Code Prefency Team*
