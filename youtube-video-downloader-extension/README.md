# 🎥 YouTube Video Downloader Extension

Extension Chrome mạnh mẽ để tải video từ YouTube một cách dễ dàng với giao diện đẹp và chức năng phong phú.

## ✨ Tính năng nổi bật

- 🎯 **Giao diện trực quan**: Popup đẹp mắt với gradient background
- 🔗 **Nhiều cách nhập URL**: Nhập thủ công hoặc lấy từ tab hiện tại
- 📋 **Thông tin chi tiết**: Hiển thị thumbnail, tiêu đề, kênh, lượt xem, ngày đăng
- 📥 **Định dạng đa dạng**: Hỗ trợ MP4, WebM, MP3 với chất lượng khác nhau
- ⚡ **Tải nhanh chóng**: Tích hợp với các API tải video thực tế (Y2Mate, SaveFrom, Cobalt)
- 🔄 **Fallback system**: Tự động thử API khác khi một API không hoạt động
- ✅ **Validation thông minh**: Kiểm tra URL tải trước khi tải
- ⏳ **Theo dõi tiến trình**: Thanh tiến trình thời gian thực khi tải
- 🎨 **Tích hợp YouTube**: Nút tải trực tiếp trên trang video YouTube
- 🔧 **Cài đặt linh hoạt**: Tùy chỉnh định dạng, chất lượng, thư mục lưu
- 📢 **Thông báo thông minh**: Thông báo trạng thái tải với âm thanh tùy chọn

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

### Phương pháp 4: Tùy chỉnh cài đặt

1. **Click icon extension** trên toolbar Chrome
2. **Click nút "⚙️ Cài đặt"** ở góc dưới
3. **Tùy chỉnh các tùy chọn:**
   - **Định dạng mặc định**: MP4, WebM, MP3, M4A
   - **Chất lượng mặc định**: Từ 144p đến 720p
   - **Tự động tải**: Bỏ qua bước chọn định dạng
   - **Thư mục lưu**: Tùy chỉnh đường dẫn
   - **Tạo thư mục con**: Theo tên kênh
   - **Thông báo**: Bật/tắt notification
   - **Âm thanh**: Phát tiếng khi tải xong
   - **Phụ đề**: Tự động tải phụ đề nếu có
   - **Thumbnail**: Tải hình đại diện
   - **Giao diện**: Chọn chủ đề màu sắc
4. **Lưu cài đặt** để áp dụng

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

### Settings Interface
- **Comprehensive settings page** với giao diện đẹp
- **Real-time theme preview** khi thay đổi
- **Export/Import settings** để backup và chia sẻ
- **Organized sections** cho các loại cài đặt khác nhau
- **Responsive design** cho mọi kích thước màn hình

## ⚙️ Cấu trúc dự án

```
youtube-video-downloader-extension/
├── manifest.json          # Cấu hình extension
├── popup.html            # Giao diện popup
├── popup.css             # Styling cho popup
├── popup.js              # Logic xử lý popup
├── background.js         # Background script và API calls
├── content.js            # Content script cho YouTube
├── settings.html         # Trang cài đặt
├── settings.css          # Styling cho trang cài đặt
├── settings.js           # Logic xử lý cài đặt
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
1. **Thử định dạng khác** (MP3 thay vì MP4 nếu video bị giới hạn)
2. **Kiểm tra kết nối mạng** và thử lại
3. **Chờ vài phút** và thử lại (có thể do giới hạn rate của API)
4. **Kiểm tra cài đặt tường lửa** hoặc VPN có chặn không
5. **Xem Console** (F12) để kiểm tra lỗi API chi tiết
6. **Extension sẽ tự động thử nhiều API khác nhau** nếu một API không hoạt động

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
