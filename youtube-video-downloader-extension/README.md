# 🎥 YouTube Video Downloader Extension

Extension Chrome mạnh mẽ để tải video từ YouTube một cách dễ dàng với giao diện đẹp và chức năng phong phú.

## ✨ Tính năng nổi bật

- 🎯 **Giao diện trực quan**: Popup đẹp mắt với gradient background
- 🔗 **Nhiều cách nhập URL**: Nhập thủ công hoặc lấy từ tab hiện tại
- 📋 **Thông tin chi tiết**: Hiển thị thumbnail, tiêu đề, kênh, lượt xem, ngày đăng
- 📥 **Định dạng đa dạng**: Hỗ trợ MP4, WebM, MP3 với chất lượng khác nhau
- ⏳ **Theo dõi tiến trình**: Thanh tiến trình thời gian thực khi tải
- 🎨 **Tích hợp YouTube**: Nút tải trực tiếp trên trang video YouTube
- ⚡ **Nhanh chóng**: Xử lý nhanh với API tối ưu

## 🚀 Cài đặt

### Bước 1: Tải mã nguồn

```bash
# Clone hoặc tải thư mục youtube-video-downloader-extension
git clone https://github.com/your-repo/youtube-video-downloader-extension.git
# hoặc tải trực tiếp từ GitHub
```

### Bước 2: Mở Chrome Extensions

1. Mở Chrome và nhập `chrome://extensions/` vào thanh địa chỉ
2. Bật **Developer mode** (công tắc ở góc phải trên)
3. Click **Load unpacked**
4. Chọn thư mục `youtube-video-downloader-extension`

### Bước 3: Cấp quyền (nếu cần)

Extension sẽ yêu cầu các quyền:
- `downloads`: Để tải file về máy
- `storage`: Để lưu cài đặt
- `activeTab`: Để truy cập tab hiện tại
- `scripting`: Để chạy script trên trang

## 📖 Cách sử dụng

### Phương pháp 1: Sử dụng Popup

1. **Click icon extension** trên toolbar Chrome
2. **Nhập URL YouTube** vào ô input
3. **Click "Lấy thông tin"** để xem thông tin video
4. **Chọn định dạng** muốn tải (MP4 720p, MP3, v.v.)
5. **Đợi tải xong** - file sẽ được lưu vào thư mục Downloads

### Phương pháp 2: Từ tab hiện tại

1. **Mở video YouTube** trong tab bất kỳ
2. **Click "Dán từ tab hiện tại"** trong popup
3. **Thực hiện các bước 3-5** như trên

### Phương pháp 3: Trên trang YouTube

1. **Mở video YouTube** bất kỳ
2. **Tìm nút "Tải xuống"** màu đỏ bên cạnh các nút Like/Share
3. **Click nút đó** để tải trực tiếp

## 🎨 Giao diện

### Popup Interface
- **Header gradient** với thông tin phiên bản
- **Input field** để nhập URL với validation
- **Loading spinner** khi xử lý
- **Video preview** với thumbnail và thông tin chi tiết
- **Format buttons** với icon trực quan
- **Progress bar** thời gian thực
- **Error messages** với thông báo rõ ràng

### YouTube Integration
- **Download button** tích hợp vào giao diện YouTube
- **Matching design** với style của YouTube
- **Hover effects** và animations mượt mà

## ⚙️ Cấu trúc dự án

```
youtube-video-downloader-extension/
├── manifest.json          # Cấu hình extension
├── popup.html            # Giao diện popup
├── popup.css             # Styling cho popup
├── popup.js              # Logic xử lý popup
├── background.js         # Background script và API calls
├── content.js            # Content script cho YouTube
├── icons/                # Icon files (16x16, 32x32, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # Tài liệu hướng dẫn
```

## 🔧 Phát triển

### Thêm định dạng mới

Trong `popup.js`, thêm vào `formatButtons` event listener:

```javascript
// Trong handleDownload function
const formatButtons = document.querySelectorAll('.format-btn');
```

### Tùy chỉnh API

Trong `background.js`, cập nhật `API_ENDPOINTS`:

```javascript
const API_ENDPOINTS = {
    INFO: 'YOUR_INFO_API',
    DOWNLOAD: 'YOUR_DOWNLOAD_API'
};
```

### Thay đổi giao diện

Chỉnh sửa `popup.css` để tùy chỉnh:
- Colors và gradients
- Font sizes và spacing
- Animations và transitions

## 🚨 Lưu ý quan trọng

### Pháp lý và Bản quyền
- ⚖️ Extension này chỉ dành cho mục đích giáo dục
- 📺 Tôn trọng bản quyền nội dung YouTube
- 🚫 Không tải nội dung có bản quyền mà không có phép

### Hạn chế
- 🔒 Một số video có thể bị giới hạn tải
- 🌐 Phụ thuộc vào dịch vụ bên thứ 3
- 📶 Cần kết nối internet ổn định

### Bảo mật
- 🔐 Extension chỉ truy cập YouTube và dịch vụ tải
- 🛡️ Không thu thập thông tin cá nhân
- 📊 Chỉ lưu cài đặt local trên máy

## 🛠️ Troubleshooting

### Extension không hoạt động
1. **Kiểm tra Developer Mode** đã bật
2. **Load lại extension** từ chrome://extensions/
3. **Kiểm tra Console** (F12) để xem lỗi

### Không thể tải video
1. **Thử URL khác** để kiểm tra
2. **Kiểm tra kết nối mạng**
3. **Thử lại sau** (có thể do rate limiting)

### Popup không hiển thị
1. **Click icon extension** trên toolbar
2. **Refresh trang** nếu cần
3. **Kiểm tra lỗi JavaScript** trong Console

## 📋 Yêu cầu hệ thống

- **Chrome**: Version 88+
- **RAM**: Tối thiểu 512MB
- **Storage**: 50MB free space
- **Network**: Broadband internet

## 🔄 Cập nhật

Để cập nhật extension:

1. **Tải phiên bản mới**
2. **Vào chrome://extensions/**
3. **Click "Reload"** trên extension
4. **Hoặc remove và load lại**

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push lên branch: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

## 📄 Giấy phép

Distributed under the MIT License. See `LICENSE` for more information.

## 🙋‍♂️ Hỗ trợ

Nếu gặp vấn đề:
1. **Kiểm tra FAQ** trong README
2. **Tìm kiếm Issues** trên GitHub
3. **Tạo Issue mới** với mô tả chi tiết

## 🎯 Roadmap

### Version 1.1
- [ ] Thêm hỗ trợ playlist
- [ ] Lịch sử tải file
- [ ] Tùy chỉnh thư mục lưu

### Version 1.2
- [ ] Batch download
- [ ] Video quality selection nâng cao
- [ ] Subtitle download

### Version 2.0
- [ ] Mobile app (Android/iOS)
- [ ] Cloud storage integration
- [ ] Advanced video editor

---

**Happy Downloading! 🎬**

*Made with ❤️ by Web Dev Playground Team*
