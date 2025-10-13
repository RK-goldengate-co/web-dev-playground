# 🚀 Web Development Playground

Bộ sưu tập toàn diện các template, component, utilities và code samples cho việc phát triển web và phần mềm hiện đại. Dự án này cung cấp một nền tảng học tập và phát triển với các ví dụ thực tế từ cơ bản đến nâng cao.

## 📁 Cấu trúc dự án đầy đủ

```
web-dev-playground/
├── README.md                          # Tài liệu hướng dẫn chi tiết này
├── AI-chatbot/                        # Ứng dụng chatbot AI hoàn chỉnh với Hugging Face API
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
├── discord-reaction-role-bot/         # 🤖 Bot Discord cho Reaction Role System
│   ├── bot.py                         # Code chính của bot Discord
│   ├── config.py                      # Module cấu hình bot và token
│   ├── requirements.txt               # Dependencies Python cần thiết
│   ├── .env.example                   # File cấu hình mẫu cho biến môi trường
│   ├── README.md                      # Hướng dẫn chi tiết cách chạy bot
│   ├── run.bat                        # Script chạy trên Windows
│   └── .gitignore                     # Git ignore rules cho bảo mật
├── html-scraper-extension/            # 🔍 Chrome Extension lấy HTML của trang web
│   ├── manifest.json                  # Cấu hình extension với permissions
│   ├── popup.html                     # Giao diện popup chính với form nhập URL
│   ├── popup.css                      # Styling với animation gradient đẹp mắt
│   ├── popup.js                       # Logic xử lý popup, phân tích HTML, tương tác
│   ├── background.js                  # Background script cho extension
│   ├── content.js                     # Content script để lấy HTML từ trang web
│   ├── icons/                         # Thư mục chứa icon cho extension
│   │   ├── icon16.png                 # Icon nhỏ cho toolbar
│   │   ├── icon32.png                 # Icon trung bình
│   │   ├── icon48.png                 # Icon lớn cho extension page
│   │   └── icon128.png                # Icon lớn nhất cho store
│   └── README.md                      # Hướng dẫn cài đặt và sử dụng chi tiết
├── youtube-video-downloader-extension/ # 🎥 Chrome Extension tải video YouTube
│   ├── manifest.json                  # Cấu hình extension với permissions
│   ├── popup.html                     # Giao diện popup với form nhập URL YouTube
│   ├── popup.css                      # Styling đẹp mắt cho popup
│   ├── popup.js                       # Logic xử lý tải video và giao diện
│   ├── background.js                  # Background script xử lý API và tải
│   ├── content.js                     # Content script cho trang YouTube
│   ├── icons/                         # Icon files cho extension
│   │   ├── icon16.png                 # Icon nhỏ
│   │   ├── icon32.png                 # Icon trung bình
│   │   ├── icon48.png                 # Icon lớn
│   │   └── icon128.png                # Icon lớn nhất
│   └── README.md                      # Hướng dẫn cài đặt và sử dụng
├── web-dev-prefabs/                   # Bộ sưu tập web development
│   ├── README.md                      # Tài liệu hướng dẫn cho prefabs
│   ├── html/                          # HTML templates cơ bản
│   │   ├── basic-template.html        # Template HTML cơ bản với semantic
│   │   ├── form-template.html         # Template form với validation
│   │   └── responsive-layout.html     # Layout responsive với CSS Grid
│   ├── css/                           # CSS utilities và components
│   │   ├── reset.css                  # CSS reset chuẩn
│   │   ├── utilities.css               # Utilities classes cho margin/padding
│   │   ├── components.css             # Components như buttons, cards
│   │   └── animations.css             # Keyframe animations cho hiệu ứng
│   ├── js/                            # JavaScript helpers và utils
│   │   ├── utils.js                   # Utilities functions chung
│   │   ├── form-validation.js         # Validation cho forms
│   │   └── animations.js              # JS animations helpers
│   ├── templates/                     # Templates hoàn chỉnh sẵn sàng dùng
│   │   ├── landing-page/              # Template landing page hoàn chỉnh
│   │   ├── dashboard/                 # Template dashboard admin
│   │   └── portfolio/                 # Template portfolio cá nhân
│   └── programming-languages/         # File định dạng ngôn ngữ cho syntax highlighting
│       ├── html.lang                  # Định dạng cho HTML
│       ├── css.lang                   # Định dạng cho CSS
│       └── js.lang                    # Định dạng cho JavaScript
└── code-prefency/                     # 📦 Bộ sưu tập code mẫu đa ngôn ngữ
    ├── README_STRUCTURE.md            # Hướng dẫn cấu trúc thư mục chi tiết
    ├── frontend/                      # 🌐 Frontend Applications
    │   └── web/                       # Web applications samples
    │       ├── html-css-js/           # Pure HTML/CSS/JavaScript examples
    │       │   ├── index.html         # Trang chủ với responsive design
    │       │   ├── styles.css         # CSS với Flexbox và Grid
    │       │   └── script.js          # JS với DOM manipulation
    │       ├── react/                 # React applications samples
    │       │   ├── App.jsx            # Component chính với hooks
    │       │   ├── index.js           # Entry point với ReactDOM
    │       │   └── package.json       # Dependencies cho React
    │       └── vanilla-js/            # Vanilla JavaScript examples
    │           ├── todo-app/          # Ứng dụng todo đơn giản
    │           └── calculator/        # Máy tính đơn giản với JS
    ├── backend/                       # ⚙️ Backend Applications
    │   ├── php/                       # PHP backend examples
    │   │   ├── api.php                # REST API đơn giản với CRUD
    │   │   ├── database.php           # Kết nối database với PDO
    │   │   └── auth.php               # Authentication cơ bản
    │   ├── java-spring/               # Java Spring Boot examples
    │   │   ├── UserManagementApplication.java # Ứng dụng quản lý user
    │   │   ├── UserController.java    # Controller cho REST endpoints
    │   │   └── application.properties # Cấu hình ứng dụng
    │   ├── csharp-dotnet/             # C# .NET Core examples
    │   │   ├── Program.cs             # Entry point với ASP.NET Core
    │   │   ├── Startup.cs             # Cấu hình services và middleware
    │   │   └── Controllers/           # Controllers cho API
    │   ├── go/                        # Go backend examples
    │   │   ├── main.go                # Server HTTP đơn giản với Gorilla
    │   │   └── handlers/              # Handlers cho routes
    │   └── python/                    # Python backend examples
    │       ├── main.py                # Flask app với routes cơ bản
    │       ├── models.py              # Models với SQLAlchemy
    │       └── requirements.txt       # Dependencies Python
    ├── mobile/                        # 📱 Mobile Applications
    │   └── kotlin-android/            # Kotlin Android examples
    │       ├── MainActivity.kt        # Activity chính với UI
    │       └── build.gradle           # Gradle build config
    ├── desktop/                       # 💻 Desktop Applications
    │   └── cpp/                       # C++ desktop examples
    │       ├── main.cpp               # Ứng dụng console đơn giản
    │       └── CMakeLists.txt         # CMake config cho build
    ├── database/                      # 🗄️ Database Files
    │   ├── schemas/                   # Database schemas examples
    │   │   └── schema.sql             # SQL schema với tables và relations
    │   └── seeds/                     # Seed data examples
    │       └── seed.sql               # Data mẫu để populate database
    ├── infrastructure/                # 🏗️ Infrastructure as Code
    │   ├── docker/                    # Docker containers examples
    │   │   ├── Dockerfile            # Dockerfile cho app mẫu
    │   │   └── docker-compose.yml     # Compose cho multi-container
    │   └── terraform/                 # Terraform IaC examples
    │       └── main.tf               # Terraform config cho AWS/GCP
    ├── config/                        # ⚙️ Configuration Files
    │   ├── app.json                   # JSON config cho app
    │   ├── config.yaml                # YAML config với nested structures
    │   ├── settings.ini               # INI file cho settings
    │   ├── appsettings.json           # .NET config với connection strings
    │   └── .env                       # Environment variables mẫu
    ├── security/                      # 🔒 Security & Compliance
    │   └── policies/                  # Security policies examples
    │       └── security-policy.md     # Chính sách bảo mật chi tiết
    ├── docs/                          # 📚 Documentation examples
    │   ├── api-docs.md                # API documentation với OpenAPI
    │   ├── deployment-guide.md        # Hướng dẫn deploy lên production
    │   ├── troubleshooting.md         # Troubleshooting common issues
    │   └── architecture.md            # Tài liệu kiến trúc hệ thống
    ├── tests/                         # 🧪 Testing Files
    │   └── unit-tests.py              # Unit tests với pytest/unittest
    └── tools/                         # 🔧 Additional Tools
        ├── script.sh                  # Bash script utility
        ├── powershell.ps1             # PowerShell script
        └── assembly.asm               # Assembly code mẫu
```

## 🎯 Mục tiêu dự án

1. **Web Development Prefabs**: Bộ sưu tập các template, component và utilities sẵn sàng sử dụng cho việc phát triển web nhanh chóng
2. **Programming Language References**: Các file mẫu định dạng cho nhiều ngôn ngữ lập trình khác nhau để học và tham khảo
3. **Discord Bot Applications**: Các bot Discord chức năng cho cộng đồng và server management với tính năng reaction roles
4. **Browser Extensions**: Các extension Chrome tiện ích cho trình duyệt, từ đếm ngược đến tải video và scrape HTML
5. **Code Prefency Collection**: 📦 Bộ sưu tập 67 files code mẫu thực tế đã được tổ chức chuyên nghiệp theo lĩnh vực:
   - **Frontend**: 18 files (HTML, CSS, React, JavaScript) - Ví dụ ứng dụng web hiện đại
   - **Backend**: 24 files (PHP, Java, C#, Go, Python) - Server-side applications và APIs
   - **Mobile/Desktop**: 4 files (Kotlin Android, C++ Desktop) - Ứng dụng di động và desktop
   - **Database**: 2 files (SQL schema & seed data) - Cơ sở dữ liệu và dữ liệu mẫu
   - **Infrastructure**: 3 files (Docker & Terraform) - Infrastructure as Code
   - **Configuration**: 5 files (JSON, YAML, .NET config) - Files cấu hình đa dạng
   - **Security**: 1 file (Security policies) - Chính sách bảo mật
   - **Documentation**: 4 files (API, deployment, troubleshooting) - Tài liệu kỹ thuật
   - **Testing**: 1 file (Unit tests) - Test cases mẫu
   - **Tools**: 3 files (Assembly & utilities) - Công cụ bổ sung

## 🔍 Chi tiết các dự án

### 🤖 AI Chatbot
Ứng dụng chatbot AI hoàn chỉnh tích hợp với Hugging Face API để trò chuyện thông minh.
- **Tính năng nổi bật**: Giao diện chat đẹp mắt, xử lý ngôn ngữ tự nhiên, responsive trên mọi thiết bị
- **Công nghệ sử dụng**: HTML5, CSS3 với Flexbox/Grid, JavaScript ES6+, Hugging Face Transformers API
- **Cách chạy**: Mở index.html trong trình duyệt, nhập API key và bắt đầu trò chuyện
- **Mục đích học tập**: Học cách tích hợp AI vào web app, xử lý async API calls, UI/UX design

### ⏰ Countdown Timer Extension
Extension Chrome tiện ích để đếm ngược thời gian với giao diện tùy chỉnh và thông báo.
- **Tính năng nổi bật**: Đặt thời gian đếm ngược, thông báo desktop khi hết giờ, giao diện tối giản
- **Công nghệ sử dụng**: Chrome Extension Manifest V3, HTML/CSS/JS, Chrome Notifications API
- **Cách cài đặt**: Load thư mục vào Chrome Extensions, pin lên toolbar để sử dụng nhanh
- **Mục đích học tập**: Phát triển Chrome Extension, quản lý state, tương tác với browser APIs

### 🤖 Discord Reaction Role Bot
Bot Discord mạnh mẽ cho hệ thống Reaction Role, giúp quản lý quyền thành viên tự động.
- **Tính năng nổi bật**: Tự động gán role dựa trên reaction, quản lý server, logging hoạt động
- **Công nghệ sử dụng**: Python 3.8+, Discord.py library, AsyncIO cho xử lý bất đồng bộ
- **Cách chạy**: Cài đặt dependencies từ requirements.txt, cấu hình token trong config.py, chạy bot.py
- **Mục đích học tập**: Phát triển bot Discord, xử lý events, tương tác với Discord API

### 🔍 HTML Scraper Extension
Extension Chrome chuyên nghiệp để lấy và phân tích HTML của bất kỳ trang web nào.
- **Tính năng nổi bật**: Lấy HTML từ tab hiện tại hoặc URL tùy chỉnh, tải xuống file, phân tích thống kê (số elements, links, scripts), giao diện đẹp với animation gradient
- **Công nghệ sử dụng**: Manifest V3, JavaScript ES6+, DOM manipulation, File API cho tải xuống
- **Cách cài đặt**: Load thư mục vào Chrome Extensions, truy cập popup để sử dụng
- **Mục đích học tập**: Scrape web data, phân tích cấu trúc trang, phát triển extension phức tạp

### 🎥 YouTube Video Downloader Extension
Extension Chrome cho phép tải video và audio từ YouTube một cách dễ dàng.
- **Tính năng nổi bật**: Tải MP4 720p/480p, audio MP3, giao diện đẹp với thumbnail preview
- **Công nghệ sử dụng**: Chrome Extension API, YouTube Data API v3, ytdl-core hoặc tương tự
- **Cách cài đặt**: Load thư mục vào Chrome, truy cập trên trang YouTube để sử dụng
- **Mục đích học tập**: Tích hợp với APIs bên thứ 3, xử lý media, phát triển extension thương mại

### 🛠️ Web Dev Prefabs
Bộ sưu tập các template và utilities sẵn sàng sử dụng cho web development nhanh chóng.
- **HTML Templates**: Boilerplate với semantic HTML, forms với validation, layouts responsive
- **CSS Utilities**: CSS reset chuẩn, utility classes, component styles, animations
- **JavaScript Helpers**: Utilities cho DOM, form validation, animation helpers
- **Complete Templates**: Landing page hoàn chỉnh, dashboard admin, portfolio cá nhân
- **Programming Languages**: Files định dạng cho syntax highlighting trong editors

### 📦 Code Prefency Collection
Bộ sưu tập 67 files code mẫu thực tế, tổ chức chuyên nghiệp theo lĩnh vực và công nghệ.
- **Đặc điểm**: Mỗi file đều hoàn chỉnh, có thể chạy được ngay, với documentation chi tiết, best practices
- **Phân loại chi tiết**:
  - Frontend: 18 files bao gồm HTML/CSS/JS thuần, React apps với hooks, vanilla JS projects
  - Backend: 24 files với PHP APIs, Java Spring Boot apps, C# .NET Core services, Go servers, Python Flask/Django
  - Mobile/Desktop: 4 files với Kotlin Android apps và C++ desktop applications
  - Database: 2 files với SQL schemas và seed data mẫu
  - Infrastructure: 3 files với Docker containers và Terraform configs
  - Configuration: 5 files với JSON/YAML/INI configs cho nhiều framework
  - Security: 1 file với security policies mẫu
  - Documentation: 4 files với API docs, deployment guides, troubleshooting
  - Testing: 1 file với unit tests mẫu
  - Tools: 3 files với bash scripts, PowerShell, assembly code

## 🚀 Hướng dẫn chạy và sử dụng

### Cài đặt Browser Extensions
1. Mở `chrome://extensions/` trong Chrome
2. Bật "Developer mode" ở góc phải trên
3. Nhấn "Load unpacked" và chọn thư mục extension tương ứng:
   - `countdown-timer/` cho đếm ngược
   - `html-scraper-extension/` cho lấy HTML
   - `youtube-video-downloader-extension/` cho tải video YouTube
4. Extension sẽ xuất hiện trong toolbar hoặc extensions page

### Chạy Ứng dụng Web
- **AI Chatbot**: Mở `AI-chatbot/index.html` trong trình duyệt, nhập Hugging Face API key để bắt đầu
- **Web Prefabs**: Copy templates từ `web-dev-prefabs/` vào dự án của bạn

### Chạy Backend và Bot
- **Discord Bot**: 
  ```bash
  cd discord-reaction-role-bot/
  pip install -r requirements.txt
  # Cấu hình token trong config.py
  python bot.py
  ```
- **Python Backend Examples**:
  ```bash
  cd code-prefency/backend/python/
  pip install -r requirements.txt
  python main.py
  ```

### Sử dụng Code Samples
- Copy file từ `code-prefency/` vào dự án của bạn
- Chạy lệnh tương ứng với ngôn ngữ (npm start cho React, python main.py cho Python, v.v.)

## 📚 Tài nguyên học tập và tham khảo

### Web Development
- [MDN Web Docs](https://developer.mozilla.org/) - Tài liệu web chuẩn
- [CSS Tricks](https://css-tricks.com/) - Thủ thuật CSS nâng cao
- [Can I Use](https://caniuse.com/) - Kiểm tra hỗ trợ trình duyệt
- [Web.dev](https://web.dev/) - Best practices cho web performance

### Programming Languages và Frameworks
- [Python.org](https://python.org/) - Tài liệu Python chính thức
- [React.dev](https://react.dev/) - Hướng dẫn React mới nhất
- [TypeScript Handbook](https://typescriptlang.org/) - TypeScript chi tiết
- [Node.js Docs](https://nodejs.org/) - Node.js documentation
- [Django Project](https://djangoproject.com/) - Django framework
- [Spring Boot](https://spring.io/) - Spring Boot guides

### Development Tools và IDEs
- [Visual Studio Code](https://code.visualstudio.com/) - Editor miễn phí mạnh mẽ
- [PyCharm](https://www.jetbrains.com/pycharm/) - IDE Python chuyên nghiệp
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) - IDE Java hàng đầu
- [Android Studio](https://developer.android.com/studio) - Phát triển Android

## 🤝 Đóng góp vào dự án

Mọi đóng góp đều được chào đón và đánh giá cao! Để đóng góp:

1. **Fork dự án** từ GitHub repository
2. **Tạo branch mới** cho tính năng hoặc bug fix của bạn (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** với message rõ ràng (`git commit -m 'Add some AmazingFeature'`)
4. **Push lên branch** (`git push origin feature/AmazingFeature`)
5. **Tạo Pull Request** trên GitHub với mô tả chi tiết

### Các loại đóng góp được chấp nhận:
- 🐛 Bug fixes và cải thiện performance
- ✨ Tính năng mới và enhancements
- 📚 Cải thiện documentation
- 🎨 Cải thiện UI/UX
- 🔧 Refactoring code để dễ maintain

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép **MIT License**. Điều này có nghĩa là bạn có thể sử dụng, chỉnh sửa và phân phối code miễn phí với điều kiện giữ nguyên thông tin bản quyền.

Xem file `LICENSE` để biết chi tiết đầy đủ về giấy phép.

## 🙏 Lời cảm ơn

Cảm ơn tất cả contributors, testers và cộng đồng developer đã hỗ trợ dự án này phát triển. Dự án này được xây dựng với mục tiêu học tập và chia sẻ kiến thức, hy vọng sẽ hữu ích cho hành trình coding của bạn!

Nếu bạn có câu hỏi hoặc cần hỗ trợ, hãy tạo issue trên GitHub hoặc liên hệ qua các kênh hỗ trợ.

---

**Happy Coding! 🎉**

*Built with ❤️ by the Code Prefency Team*
