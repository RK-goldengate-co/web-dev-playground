# Dark Mode Extension

Extension Chrome để chuyển đổi mọi trang web sang chế độ dark mode.

## Tính năng

- Áp dụng dark mode cho tất cả các trang web
- Có thể bật/tắt dễ dàng thông qua popup
- Lưu trạng thái dark mode trong bộ nhớ local
- Áp dụng cho tất cả các tab đang mở

## Cách cài đặt

1. Mở Chrome và đi đến `chrome://extensions/`
2. Bật "Developer mode" ở góc phải trên cùng
3. Nhấn "Load unpacked" và chọn thư mục `dark-mode-extension`
4. Extension sẽ xuất hiện trong danh sách và có thể sử dụng ngay

## Cách sử dụng

1. Nhấn vào icon extension trên thanh công cụ Chrome
2. Trong popup, nhấn nút toggle để bật/tắt dark mode
3. Dark mode sẽ được áp dụng ngay lập tức cho tất cả các trang web đang mở

## Cấu trúc thư mục

```
dark-mode-extension/
├── manifest.json          # Khai báo extension
├── background.js          # Script nền để xử lý messages
├── content.js             # Script nội dung để áp dụng dark mode
├── popup.html             # Giao diện popup
├── popup.js               # Logic cho popup
├── dark-mode.css          # CSS dark mode (dự phòng)
└── icons/                 # Thư mục chứa icon (có thể thay thế)
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Lưu ý

- Extension này sử dụng CSS injection để áp dụng dark mode
- Một số trang web có thể cần điều chỉnh CSS đặc biệt
- Nếu muốn tùy chỉnh màu sắc, hãy chỉnh sửa file `content.js`

## Khắc phục sự cố

Nếu extension không hoạt động:

1. Đảm bảo extension đã được bật trong `chrome://extensions/`
2. Thử tải lại trang web
3. Kiểm tra console để xem có lỗi nào không
4. Đảm bảo trang web không chặn CSS injection

## Phát triển

Để phát triển thêm:

1. Chỉnh sửa các file trong thư mục extension
2. Tải lại extension trong `chrome://extensions/`
3. Test trên các trang web khác nhau
