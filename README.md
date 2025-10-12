# 🤖 AI Chatbot với Hugging Face API

Đây là một chatbot AI đơn giản được xây dựng bằng HTML, CSS và JavaScript, sử dụng API miễn phí của Hugging Face.

## 🚀 Tính năng

- Giao diện chat đẹp và responsive
- Sử dụng mô hình DialoGPT-medium của Microsoft
- Tích hợp với Hugging Face Inference API
- Hoạt động hoàn toàn miễn phí với giới hạn sử dụng

## 📋 Yêu cầu hệ thống

- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- Tài khoản Hugging Face (miễn phí)

## 🛠️ Cài đặt và thiết lập

### Bước 1: Tạo tài khoản Hugging Face

1. Truy cập [https://huggingface.co/](https://huggingface.co/)
2. Đăng ký tài khoản miễn phí
3. Xác nhận email của bạn

### Bước 2: Tạo API Key

1. Đăng nhập vào tài khoản Hugging Face
2. Vào trang [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Tạo token mới với quyền `Read` 
4. Sao chép token vừa tạo

### Bước 3: Cấu hình API Key

1. Mở file `script.js`
2. Tìm dòng: `const HF_API_KEY = 'YOUR_HUGGING_FACE_API_KEY';`
3. Thay thế `'YOUR_HUGGING_FACE_API_KEY'` bằng token thực của bạn

```javascript
const HF_API_KEY = 'hf_your_actual_api_key_here';
```

### Bước 4: Chạy ứng dụng

1. Mở file `index.html` trong trình duyệt web
2. Hoặc mở terminal và chạy server local:
   ```bash
   # Sử dụng Python (nếu có cài đặt)
   python -m http.server 8000
   
   # Hoặc sử dụng Node.js (nếu có cài đặt)
   npx serve .
   
   # Sau đó truy cập http://localhost:8000
   ```

## 💡 Cách sử dụng

1. Mở ứng dụng trong trình duyệt
2. Nhập tin nhắn vào ô chat
3. Nhấn nút "Gửi" hoặc Enter để gửi
4. Chatbot sẽ phản hồi dựa trên mô hình AI

## 🆓 Gói miễn phí Hugging Face

- **Giới hạn**: Khoảng 30,000 token/tháng
- **Tốc độ**: Có thể chậm khi mô hình đang tải
- **Ưu điểm**: Hoàn toàn miễn phí và dễ sử dụng

## 🔧 Tùy chỉnh

### Thay đổi mô hình AI

Bạn có thể thay đổi mô hình trong file `script.js`:

```javascript
const MODEL_ID = 'microsoft/DialoGPT-medium'; // Mô hình hiện tại
```

Các mô hình miễn phí khác:
- `facebook/blenderbot-400M-distill` - Chatbot đa năng
- `microsoft/DialoGPT-small` - Phiên bản nhỏ hơn, nhanh hơn
- `gpt2` - Mô hình ngôn ngữ cơ bản

### Tùy chỉnh giao diện

Chỉnh sửa file `styles.css` để thay đổi:
- Màu sắc
- Font chữ
- Layout
- Responsive design

## 🚨 Lưu ý quan trọng

- **Bảo mật**: Không chia sẻ API key với người khác
- **Giới hạn**: Hugging Face có giới hạn sử dụng miễn phí
- **Chất lượng**: Phản hồi có thể không hoàn hảo 100%
- **Ngôn ngữ**: Hỗ trợ tiếng Việt và nhiều ngôn ngữ khác

## 🆘 Khắc phục sự cố

### Lỗi thường gặp:

1. **"Vui lòng thiết lập Hugging Face API key"**
   - Kiểm tra API key đã được cấu hình đúng chưa

2. **"Có lỗi xảy ra khi kết nối với AI"**
   - Kiểm tra kết nối internet
   - Đảm bảo API key còn hiệu lực
   - Thử lại sau vài phút (có thể do giới hạn rate)

3. **Phản hồi chậm**
   - Mô hình đang tải (lần đầu sử dụng)
   - Thử mô hình nhỏ hơn như `DialoGPT-small`

## 📝 Giấy phép

Dự án này được phát triển cho mục đích học tập và sử dụng cá nhân.

## 🤝 Đóng góp

Nếu bạn muốn cải thiện dự án này, hãy tạo Pull Request hoặc báo cáo vấn đề trên GitHub.

---

**Chúc bạn sử dụng chatbot vui vẻ! 🎉**
