# 🚀 Web Development Playground

Bộ sưu tập toàn diện các template, component, utilities và code samples cho việc phát triển web và phần mềm hiện đại.

## 📁 Cấu trúc dự án

```
web-dev-playground/
├── README.md                    # Tài liệu hướng dẫn này
├── AI-chatbot/                  # Ứng dụng chatbot AI hoàn chỉnh với Hugging Face API
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── README.md
├── countdown-timer/             # Extension Chrome đếm ngược với giao diện tùy chỉnh
│   ├── index.html
│   ├── popup.html
│   ├── styles.css
│   ├── script.js
│   └── manifest.json
├── discord-reaction-role-bot/   # 🤖 Bot Discord cho Reaction Role System
│   ├── bot.py                   # Code chính của bot
│   ├── config.py                # Module cấu hình
│   ├── requirements.txt         # Dependencies Python
│   ├── .env.example             # File cấu hình mẫu
│   ├── README.md                # Hướng dẫn chi tiết
│   ├── run.bat                  # Script chạy trên Windows
│   └── .gitignore               # Git ignore rules
├── youtube-video-downloader-extension/ # 🎥 Chrome Extension tải video YouTube
│   ├── manifest.json            # Cấu hình extension
│   ├── popup.html               # Giao diện popup chính
│   ├── popup.css                # Styling cho popup
│   ├── popup.js                 # Logic xử lý popup
│   ├── background.js            # Background script và API
│   ├── content.js               # Content script cho YouTube
│   ├── icons/                   # Icon files
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── README.md                # Hướng dẫn cài đặt và sử dụng
├── web-dev-prefabs/             # Bộ sưu tập web development
│   ├── README.md
│   ├── html/                    # HTML templates cơ bản
│   ├── css/                     # CSS utilities và components
│   ├── js/                      # JavaScript helpers
│   ├── templates/               # Templates hoàn chỉnh
│   └── programming-languages/   # File định dạng ngôn ngữ
└── code-prefency/               # 📦 Bộ sưu tập code mẫu đã tổ chức
    ├── README_STRUCTURE.md         # 📋 Hướng dẫn cấu trúc thư mục
    ├── frontend/                   # 🌐 Frontend Applications
    │   └── web/                    # Web applications
    │       ├── html-css-js/        # Pure HTML/CSS/JavaScript (10 files)
    │       ├── react/              # React applications (4 files)
    │       └── vanilla-js/         # Vanilla JavaScript (4 files)
    ├── backend/                    # ⚙️ Backend Applications
    │   ├── php/                    # PHP backend (5 files)
    │   ├── java-spring/            # Java Spring Boot (5 files)
    │   ├── csharp-dotnet/          # C# .NET Core (5 files)
    │   ├── go/                     # Go backend (2 files)
    │   └── python/                 # Python backend (7 files)
    ├── mobile/                     # 📱 Mobile Applications
    │   └── kotlin-android/         # Kotlin Android (2 files)
    ├── desktop/                    # 💻 Desktop Applications
    │   └── cpp/                    # C++ desktop (2 files)
    ├── database/                   # 🗄️ Database Files
    │   ├── schemas/                # Database schemas (1 file)
    │   └── seeds/                  # Seed data (1 file)
    ├── infrastructure/             # 🏗️ Infrastructure as Code
    │   ├── docker/                 # Docker containers (2 files)
    │   └── terraform/              # Terraform IaC (1 file)
    ├── config/                     # ⚙️ Configuration Files (5 files)
    ├── security/                   # 🔒 Security & Compliance
    │   └── policies/               # Security policies (1 file)
    ├── docs/                       # 📚 Documentation (4 files)
    ├── tests/                      # 🧪 Testing Files (1 file)
    └── tools/                      # 🔧 Additional Tools (3 files)
```

## 🎯 Mục tiêu dự án

1. **Web Development Prefabs**: Bộ sưu tập các template, component và utilities sẵn sàng sử dụng
2. **Programming Language References**: Các file mẫu định dạng cho nhiều ngôn ngữ lập trình khác nhau
3. **Discord Bot Applications**: Các bot Discord chức năng cho cộng đồng và server management
4. **Browser Extensions**: Các extension Chrome tiện ích cho trình duyệt
5. **Code Prefency Collection**: 📦 **Bộ sưu tập 67 files code mẫu thực tế** đã được tổ chức chuyên nghiệp:
   - **Frontend**: 18 files (HTML, CSS, React, JavaScript)
   - **Backend**: 24 files (PHP, Java, C#, Go, Python)
   - **Mobile/Desktop**: 4 files (Kotlin Android, C++ Desktop)
   - **Database**: 2 files (SQL schema & seed data)
   - **Infrastructure**: 3 files (Docker & Terraform)
   - **Configuration**: 5 files (JSON, YAML, .NET config)
   - **Security**: 1 file (Security policies)
   - **Documentation**: 4 files (API, deployment, troubleshooting)
   - **Testing**: 1 file (Unit tests)
   - **Tools**: 3 files (Assembly & utilities)

### Code Prefency Collection - Bộ sưu tập 67 files code mẫu
```bash
# Frontend examples
cp code-prefency/frontend/web/html-css-js/index.html your-project/
cp code-prefency/frontend/web/react/App.jsx your-react-project/

# Backend Development
open code-prefency/backend/php/api.php
open code-prefency/backend/java-spring/UserManagementApplication.java
open code-prefency/backend/csharp-dotnet/Program.cs

# Mobile và Desktop
open code-prefency/mobile/kotlin-android/MainActivity.kt
open code-prefency/desktop/cpp/main.cpp

# Database và Infrastructure
open code-prefency/database/schemas/schema.sql
open code-prefency/infrastructure/docker/Dockerfile
```

### Để xem cấu trúc chi tiết:
```bash
cat code-prefency/README_STRUCTURE.md
```

### Để chạy ứng dụng mẫu:
```bash
# PHP Backend
cd code-prefency/backend/php/
php api.php

# React Frontend
cd code-prefency/frontend/web/react/
npm install && npm start

# Python Application
cd code-prefency/backend/python/
python main.py

# Discord Reaction Role Bot
cd discord-reaction-role-bot/
python bot.py
# hoặc trên Windows:
./run.bat

# YouTube Video Downloader Extension
# Cài đặt vào Chrome qua chrome://extensions/
# Load thư mục youtube-video-downloader-extension/
```

### Programming Language References
```bash
# Xem ví dụ code cho từng ngôn ngữ
# Web Frontend
open code-prefency/index.html
open code-prefency/App.jsx

# Backend Development
open code-prefency/main.py
open code-prefency/api.php

# Mobile Development
open code-prefency/MainActivity.kt

# Desktop Applications
open code-prefency/desktop_app.py
```

## 📋 Nội dung chi tiết

### Web Development Prefabs
- **HTML Templates**: Boilerplate, components, forms
- **CSS Utilities**: Reset, utilities, components, animations
- **JavaScript Helpers**: Utils, animations, form validation
- **Complete Templates**: Landing page, dashboard, portfolio

### Programming Language References
- **Web Frontend**: HTML, CSS, JavaScript, React, TypeScript
- **Web Backend**: Node.js, Python, PHP, Java, C#, Go, Rust
- **Mobile Development**: Kotlin, Swift, Flutter, React Native
- **Desktop Applications**: C/C++, Python, C#, Java, Electron
- **System Programming**: C/C++, Rust, Assembly
- **AI/Data Science**: Python, R, Julia, MATLAB
- **Game Development**: C# (Unity), C++ (Unreal), Godot
- **Scripting**: Python, Bash, PowerShell

### Code Prefency Collection
23 file mẫu thực tế với:
- Code hoàn chỉnh và có thể chạy được
- Ví dụ thực tế cho từng ngôn ngữ/framework
- Cấu trúc dự án chuẩn
- Documentation và comments chi tiết
- Best practices cho từng lĩnh vực

## 🌟 Đặc điểm nổi bật

### Web Development Prefabs
- ✅ **Responsive Design**: Tối ưu mọi thiết bị
- ✅ **Modern CSS**: Flexbox, Grid, CSS Variables
- ✅ **Accessibility**: WCAG compliant
- ✅ **Performance**: Tối ưu tốc độ tải
- ✅ **SEO Friendly**: Meta tags chuẩn

### Programming Language References
- ✅ **Real Examples**: Code mẫu thực tế
- ✅ **Best Practices**: Implementation chuẩn
- ✅ **Complete Projects**: Từ setup đến deployment
- ✅ **Modern Features**: Sử dụng tính năng mới nhất
- ✅ **Cross-Platform**: Code đa nền tảng

### Code Prefency Collection
- ✅ **23 Languages**: Từ web đến system programming
- ✅ **Complete Examples**: Code có thể chạy được ngay
- ✅ **Modern Stack**: Công nghệ hiện đại
- ✅ **Production Ready**: Code chất lượng cao
- ✅ **Educational**: Dễ học và hiểu

## 🎓 Học tập và Phát triển

### Bắt đầu với Web Development
1. Học HTML/CSS/JavaScript cơ bản
2. Thử nghiệm với các template có sẵn
3. Tùy chỉnh và mở rộng tính năng
4. Deploy lên production

### Khám phá các Ngôn ngữ Lập trình
1. Chọn lĩnh vực quan tâm
2. Xem ví dụ code mẫu
3. Thử nghiệm và chỉnh sửa
4. Áp dụng vào dự án thực tế

### Best Practices
- Luôn đọc documentation chính thức
- Thử nghiệm code trong môi trường local
- Sử dụng version control (Git)
- Viết test cho code quan trọng
- Theo dõi security updates

## 📚 Tài nguyên tham khảo

### Web Development
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Tricks](https://css-tricks.com/)
- [Can I Use](https://caniuse.com/)
- [Web.dev](https://web.dev/)

### Programming Languages
- [Python.org](https://python.org/) - Python documentation
- [React.dev](https://react.dev/) - React documentation
- [TypeScript](https://typescriptlang.org/) - TypeScript handbook
- [Node.js](https://nodejs.org/) - Node.js documentation
- [Django](https://djangoproject.com/) - Django framework
- [Spring Boot](https://spring.io/) - Spring Boot framework

### Tools & IDEs
- [Visual Studio Code](https://code.visualstudio.com/) - Free editor
- [PyCharm](https://www.jetbrains.com/pycharm/) - Python IDE
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) - Java IDE
- [Android Studio](https://developer.android.com/studio) - Android development

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy:
1. Fork dự án
2. Tạo branch mới cho tính năng của bạn
3. Commit changes
4. Push lên branch
5. Tạo Pull Request

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 🙏 Lời cảm ơn

Cảm ơn tất cả contributors và cộng đồng developer đã hỗ trợ dự án này!

---

**Happy Coding! 🎉**

*Built with ❤️ by the Code Prefency Team*
