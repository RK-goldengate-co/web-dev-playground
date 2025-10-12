# Code-Prefency - Cấu trúc thư mục đã được tổ chức lại

## 📁 Tổng quan cấu trúc

Bộ sưu tập **Code-Prefency** đã được tổ chức lại thành cấu trúc thư mục rõ ràng để dễ quản lý và tìm kiếm. Tổng cộng có **67 files** được phân loại theo mục đích sử dụng.

```
code-prefency/
├── frontend/                    # Ứng dụng Frontend
│   └── web/                    # Web applications
│       ├── html-css-js/        # Pure HTML/CSS/JavaScript (10 files)
│       ├── react/              # React applications (4 files)
│       └── vanilla-js/         # Vanilla JavaScript (4 files)
├── backend/                    # Ứng dụng Backend
│   ├── php/                    # PHP backend (5 files)
│   ├── java-spring/            # Java Spring Boot (5 files)
│   ├── csharp-dotnet/          # C# .NET Core (5 files)
│   ├── go/                     # Go backend (2 files)
│   └── python/                 # Python backend (7 files)
├── mobile/                     # Ứng dụng Mobile
│   └── kotlin-android/         # Kotlin Android (2 files)
├── desktop/                    # Ứng dụng Desktop
│   └── cpp/                    # C++ desktop applications (2 files)
├── database/                   # Cơ sở dữ liệu
│   ├── schemas/                # Database schemas (1 file)
│   └── seeds/                  # Seed data (1 file)
├── infrastructure/             # Infrastructure as Code
│   ├── docker/                 # Docker containers (2 files)
│   └── terraform/              # Terraform IaC (1 file)
├── config/                     # Cấu hình
│   ├── appsettings.json        # .NET config
│   ├── config.php              # PHP config
│   ├── config.json             # JSON config
│   ├── config.yaml             # YAML config
│   └── .env.example            # Environment template
├── security/                   # Bảo mật
│   └── policies/               # Security policies (1 file)
├── docs/                       # Tài liệu
│   ├── api/                    # API documentation (1 file)
│   ├── deployment/             # Deployment guides (1 file)
│   ├── troubleshooting/        # Troubleshooting (1 file)
│   └── contributing/           # Contributing guidelines (1 file)
├── tests/                      # Testing
│   └── UserServiceTests.cs     # Unit tests (1 file)
├── scripts/                    # Scripts tiện ích
│   └── (automation scripts)
└── tools/                      # Công cụ bổ sung
    ├── user_management.asm     # Assembly code
    ├── user_management.h       # C headers
    └── types.ts                # TypeScript types
```

## 📊 Thống kê tổng hợp

### Tổng số files: **67 files**
### Tổng kích thước: ~1.2MB code

### Phân loại theo loại file:
- **Frontend Files**: 18 files
  - HTML/CSS/JS: 10 files
  - React: 4 files
  - Vanilla JS: 4 files

- **Backend Files**: 24 files
  - PHP: 5 files
  - Java Spring Boot: 5 files
  - C# .NET: 5 files
  - Go: 2 files
  - Python: 7 files

- **Mobile/Desktop**: 4 files
  - Kotlin Android: 2 files
  - C++ Desktop: 2 files

- **Database**: 2 files
  - Schema: 1 file
  - Seed Data: 1 file

- **Infrastructure**: 3 files
  - Docker: 2 files
  - Terraform: 1 file

- **Configuration**: 5 files
  - Various config formats

- **Security**: 1 file
  - Security policy

- **Documentation**: 4 files
  - API, deployment, troubleshooting, contributing

- **Testing**: 1 file
  - Unit tests

- **Tools**: 3 files
  - Assembly, C headers, TypeScript types

## 🎯 Lợi ích của cấu trúc mới

1. **Dễ tìm kiếm**: Files được nhóm theo ngôn ngữ và mục đích
2. **Dễ quản lý**: Cấu trúc phân cấp rõ ràng
3. **Dễ mở rộng**: Có thể thêm files mới vào đúng vị trí
4. **Professional**: Cấu trúc giống project thực tế
5. **Scalable**: Có thể mở rộng cho nhiều dự án hơn

## 🚀 Cách sử dụng

### Để chạy một ứng dụng cụ thể:
```bash
# PHP backend
cd backend/php/
php api.php

# React frontend
cd frontend/web/react/
npm start

# Python application
cd backend/python/
python main.py
```

### Để thêm file mới:
- Frontend: `frontend/web/[technology]/`
- Backend: `backend/[language]/`
- Mobile: `mobile/kotlin-android/`
- Desktop: `desktop/cpp/`
- Database: `database/schemas/` hoặc `database/seeds/`

## 📝 Ghi chú

- Tất cả files giữ nguyên nội dung, chỉ thay đổi vị trí
- Các script tổ chức lại nằm trong thư mục gốc để reference
- Cấu trúc này có thể được điều chỉnh theo nhu cầu cụ thể
- Mỗi thư mục có thể chứa README riêng để hướng dẫn sử dụng

---
**Bộ sưu tập Code-Prefency đã được tổ chức lại thành công! 🎉**
