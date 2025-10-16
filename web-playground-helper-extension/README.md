# Web Playground Helper

Extension VS Code để hỗ trợ phát triển web nhanh chóng với các template và công cụ thử nghiệm.

## Tính năng

- Tạo template HTML cơ bản chỉ với một lệnh.
- Tạo template CSS với các style mẫu.
- Tạo template JavaScript với các ví dụ cơ bản.
- Hiển thị thông báo và mở file sau khi tạo.
- Dễ dàng mở rộng với các template khác.

## Cách cài đặt và sử dụng

1. Mở VS Code và nhấn `Ctrl+Shift+P` (hoặc `Cmd+Shift+P` trên Mac).
2. Chạy lệnh "Extensions: Install from VSIX" hoặc đóng gói extension thành .vsix (sử dụng `vsce` nếu cần).
3. Để thử nghiệm nhanh: Mở thư mục extension trong VS Code, nhấn `F5` để chạy Extension Development Host.
4. Sau khi kích hoạt, chuột phải vào thư mục trong Explorer và chọn một trong các lệnh sau:
   - "Tạo Template HTML Cơ Bản"
   - "Tạo Template CSS Cơ Bản"
   - "Tạo Template JS Cơ Bản"

## Lệnh chính

- `web-playground-helper.createHtmlTemplate`: Tạo file HTML mẫu và mở nó trong editor.
- `web-playground-helper.createCssTemplate`: Tạo file CSS mẫu với các style cơ bản.
- `web-playground-helper.createJsTemplate`: Tạo file JS mẫu với các ví dụ JavaScript.

## Phát triển

- Chạy `npm install` để cài đặt dependencies.
- Sử dụng `npm run lint` để kiểm tra mã nguồn.

## Phiên bản

- 1.1.0: Thêm template cho CSS và JavaScript.
