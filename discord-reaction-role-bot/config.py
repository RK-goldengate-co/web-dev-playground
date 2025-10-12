import os
import json
from dotenv import load_dotenv

load_dotenv()

class Config:
    def __init__(self):
        self.discord_token = os.getenv('DISCORD_TOKEN')
        self.bot_prefix = os.getenv('BOT_PREFIX', '!')
        self.reaction_message_id = os.getenv('REACTION_MESSAGE_ID')
        self.reaction_channel_id = os.getenv('REACTION_CHANNEL_ID')
        self.role_mappings = json.loads(os.getenv('ROLE_MAPPINGS', '{}'))

    def validate(self):
        if not self.discord_token:
            raise ValueError("DISCORD_TOKEN không được để trống. Vui lòng thêm token vào file .env")
        if not self.role_mappings:
            raise ValueError("ROLE_MAPPINGS không được để trống. Vui lòng cấu hình role mappings trong file .env")
        return True

# Global config instance
config = Config()
