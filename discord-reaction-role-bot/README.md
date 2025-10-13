# 🤖 Discord Reaction Role Bot

Bot Discord mạnh mẽ để quản lý reaction roles trong server của bạn. Người dùng có thể tự gán role cho mình bằng cách reaction vào các emoji tương ứng.

## ✨ Tính năng

- ✅ **Reaction Role System**: Gán/bỏ role tự động qua reactions
- ✅ **Tự động Setup**: Tự động thêm reactions khi khởi động
- ✅ **Quản lý linh hoạt**: Cấu hình role mappings qua file .env
- ✅ **Commands đa dạng**: Các lệnh quản lý và thông tin
- ✅ **Logging chi tiết**: Ghi log các hoạt động của bot
- ✅ **Bảo mật**: Kiểm tra quyền admin cho các lệnh đặc biệt

## 🚀 Cài đặt

### 1. Chuẩn bị môi trường

```bash
# Tạo virtual environment (khuyên dùng)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate     # Windows

# Cài đặt dependencies
pip install -r requirements.txt
```

### 2. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo ứng dụng mới → Bot section
3. Copy **Bot Token** (lưu vào nơi an toàn)
4. Bật các **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent

### 3. Cấu hình Bot

```bash
# Copy file cấu hình mẫu
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
BOT_PREFIX=!

# Bot Settings
REACTION_MESSAGE_ID=123456789012345678
REACTION_CHANNEL_ID=123456789012345678

# Role Mappings (format: emoji:role_id)
ROLE_MAPPINGS={"👍": "987654321098765432", "❤️": "987654321098765433", "😂": "987654321098765434"}
```

**Lưu ý quan trọng:**
- `REACTION_MESSAGE_ID`: ID của tin nhắn sẽ chứa reactions
- `REACTION_CHANNEL_ID`: ID của channel chứa tin nhắn trên
- `ROLE_MAPPINGS`: Mapping giữa emoji và role ID (định dạng JSON)

### 4. Lấy ID tin nhắn và channel

1. **Bật Developer Mode** trong Discord:
   - User Settings → App Settings → Advanced → Developer Mode

2. **Lấy Channel ID**:
   - Click chuột phải vào channel → Copy ID

3. **Tạo tin nhắn Reaction Role**:
   - Gửi tin nhắn trong channel đã chọn
   - Click chuột phải vào tin nhắn → Copy ID

4. **Lấy Role ID**:
   - Click chuột phải vào role trong Server Settings → Copy ID

## 🎯 Cách sử dụng

### Khởi chạy Bot

```bash
python bot.py
```

### Commands cơ bản

| Command | Mô tả | Quyền |
|---------|-------|-------|
| `!info` | Hiển thị thông tin bot | Tất cả user |
| `!list_roles` | Xem danh sách role mappings | Tất cả user |
| `!setup_reaction_roles [message_id]` | Thiết lập reaction roles | Admin |

### Thiết lập Reaction Roles thủ công

1. **Tạo tin nhắn mẫu**:
```
🎮 Chọn role của bạn:

👍 - Gamer
❤️ - Artist
😂 - Memer

React để nhận role tương ứng!
```

2. **Sử dụng command**:
```
!setup_reaction_roles 123456789012345678
```

3. **Tự động thêm reactions**:
   - Bot sẽ tự động thêm các emoji đã cấu hình vào tin nhắn

## 📋 Ví dụ cấu hình hoàn chỉnh

```env
# Discord Bot Configuration
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4.nABCDEFGHijklMNopqrsTUVwxyz
BOT_PREFIX=!

# Bot Settings
REACTION_MESSAGE_ID=9876543210987654321
REACTION_CHANNEL_ID=1234567890123456789

# Role Mappings
ROLE_MAPPINGS={
  "🎮": "111222333444555666777",
  "👍": "222333444555666777888",
  "❤️": "333444555666777888999",
  "😂": "444555666777888999000"
}
```

## 🔧 Troubleshooting

### Lỗi thường gặp

1. **"DISCORD_TOKEN không được để trống"**
   - Đảm bảo đã thêm token vào file `.env`

2. **"Không tìm thấy message với ID"**
   - Kiểm tra lại `REACTION_MESSAGE_ID`
   - Đảm bảo bot có quyền truy cập channel

3. **"Không có quyền để thêm role"**
   - Đảm bảo bot có role cao hơn role cần gán
   - Kiểm tra quyền của bot trong Server Settings

4. **Bot không phản hồi commands**
   - Kiểm tra `BOT_PREFIX` trong cấu hình
   - Đảm bảo bot đã online

### Kiểm tra logs

Bot sẽ ghi log chi tiết vào console. Theo dõi để phát hiện lỗi:

```bash
# Chạy với verbose logging
python -u bot.py
```

## 🛠️ Phát triển nâng cao

### Thêm role mappings động

Bạn có thể mở rộng bot để hỗ trợ thêm/xóa role mappings qua commands:

```python
@commands.command(name='add_role')
@commands.has_permissions(administrator=True)
async def add_role(self, ctx, emoji, role: discord.Role):
    # Thêm logic xử lý
    pass
```

### Database tích hợp

Để lưu trữ role mappings trong database:

```python
import sqlite3

class DatabaseManager:
    def __init__(self):
        self.conn = sqlite3.connect('reaction_roles.db')
        # Tạo bảng và các method cần thiết
```

## 📚 Dependencies

- **discord.py**: Thư viện chính cho Discord bot
- **python-dotenv**: Quản lý biến môi trường
- **aiofiles**: Xử lý file bất đồng bộ

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push lên branch: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

## 📄 Giấy phép

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Liên hệ

- **Project Link**: [GitHub Repository](https://github.com/your-username/discord-reaction-role-bot)
- **Discord Server**: [Join our community](https://discord.gg/your-server)

---

**Happy Coding! 🎉**

*Made with ❤️ by Web Dev Playground Team*
