import discord
from discord.ext import commands
import asyncio
import logging
from config import config

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReactionRoleBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.reactions = True
        intents.guilds = True

        super().__init__(
            command_prefix=config.bot_prefix,
            intents=intents,
            description='Bot Reaction Role cho Discord Server'
        )

        self.role_message_id = int(config.reaction_message_id) if config.reaction_message_id else None
        self.role_channel_id = int(config.reaction_channel_id) if config.reaction_channel_id else None

    async def on_ready(self):
        logger.info(f'Bot {self.user} đã kết nối thành công!')
        logger.info(f'Đang hoạt động trên {len(self.guilds)} server(s)')

        # Kiểm tra cấu hình
        try:
            config.validate()
            logger.info('Cấu hình bot hợp lệ')
        except ValueError as e:
            logger.error(f'Lỗi cấu hình: {e}')
            return

        # Tự động thêm reactions nếu có message ID
        if self.role_message_id and self.role_channel_id:
            await self.setup_reaction_roles()

    async def setup_reaction_roles(self):
        """Thiết lập reaction roles cho message đã có"""
        try:
            channel = self.get_channel(self.role_channel_id)
            if not channel:
                logger.error(f'Không tìm thấy channel với ID: {self.role_channel_id}')
                return

            message = await channel.fetch_message(self.role_message_id)
            logger.info(f'Đã tìm thấy message reaction roles: {message.id}')

            # Thêm reactions theo cấu hình
            for emoji in config.role_mappings.keys():
                try:
                    await message.add_reaction(emoji)
                    logger.info(f'Đã thêm reaction {emoji} vào message')
                except discord.HTTPException as e:
                    logger.error(f'Lỗi khi thêm reaction {emoji}: {e}')

        except discord.NotFound:
            logger.error(f'Không tìm thấy message với ID: {self.role_message_id}')
        except discord.Forbidden:
            logger.error('Không có quyền truy cập channel hoặc message')
        except Exception as e:
            logger.error(f'Lỗi khi thiết lập reaction roles: {e}')

    async def on_raw_reaction_add(self, payload):
        """Xử lý khi user thêm reaction"""
        if payload.user_id == self.user.id:
            return  # Bỏ qua reaction của bot

        if not payload.guild_id:
            return  # Chỉ xử lý trong server

        if (self.role_message_id and payload.message_id != self.role_message_id):
            return  # Chỉ xử lý message được chỉ định

        guild = self.get_guild(payload.guild_id)
        if not guild:
            return

        user = guild.get_member(payload.user_id)
        if not user:
            return

        emoji = str(payload.emoji)
        role_id = config.role_mappings.get(emoji)

        if role_id:
            role = guild.get_role(int(role_id))
            if role:
                try:
                    await user.add_roles(role)
                    logger.info(f'Đã thêm role {role.name} cho user {user.display_name}')
                except discord.Forbidden:
                    logger.error('Không có quyền để thêm role cho user')
                except Exception as e:
                    logger.error(f'Lỗi khi thêm role: {e}')
            else:
                logger.error(f'Không tìm thấy role với ID: {role_id}')

    async def on_raw_reaction_remove(self, payload):
        """Xử lý khi user bỏ reaction"""
        if payload.user_id == self.user.id:
            return  # Bỏ qua reaction của bot

        if not payload.guild_id:
            return  # Chỉ xử lý trong server

        if (self.role_message_id and payload.message_id != self.role_message_id):
            return  # Chỉ xử lý message được chỉ định

        guild = self.get_guild(payload.guild_id)
        if not guild:
            return

        user = guild.get_member(payload.user_id)
        if not user:
            return

        emoji = str(payload.emoji)
        role_id = config.role_mappings.get(emoji)

        if role_id:
            role = guild.get_role(int(role_id))
            if role:
                try:
                    await user.remove_roles(role)
                    logger.info(f'Đã bỏ role {role.name} từ user {user.display_name}')
                except discord.Forbidden:
                    logger.error('Không có quyền để bỏ role của user')
                except Exception as e:
                    logger.error(f'Lỗi khi bỏ role: {e}')
            else:
                logger.error(f'Không tìm thấy role với ID: {role_id}')

    @commands.command(name='setup_reaction_roles')
    @commands.has_permissions(administrator=True)
    async def setup_reaction_roles_cmd(self, ctx, message_id: int = None):
        """Thiết lập reaction roles cho một message"""
        if message_id:
            self.role_message_id = message_id

        if not self.role_message_id:
            await ctx.send('❌ Vui lòng cung cấp message ID hoặc thiết lập trong config')
            return

        await self.setup_reaction_roles()
        await ctx.send(f'✅ Đã thiết lập reaction roles cho message ID: {self.role_message_id}')

    @commands.command(name='list_roles')
    async def list_roles(self, ctx):
        """Hiển thị danh sách role mappings hiện tại"""
        if not config.role_mappings:
            await ctx.send('❌ Không có role mappings nào được cấu hình')
            return

        embed = discord.Embed(
            title='📋 Reaction Role Mappings',
            description='Các emoji và role tương ứng:',
            color=0x00ff00
        )

        for emoji, role_id in config.role_mappings.items():
            role = ctx.guild.get_role(int(role_id))
            role_name = role.name if role else f'Role ID: {role_id} (Không tìm thấy)'
            embed.add_field(
                name=f'{emoji}',
                value=f'{role_name}',
                inline=True
            )

        await ctx.send(embed=embed)

    @commands.command(name='info')
    async def bot_info(self, ctx):
        """Hiển thị thông tin về bot"""
        embed = discord.Embed(
            title='🤖 Thông tin Reaction Role Bot',
            description='Bot giúp quản lý reaction roles trong Discord server',
            color=0x0099ff
        )

        embed.add_field(
            name='👨‍💻 Developer',
            value='Web Dev Playground Team',
            inline=True
        )

        embed.add_field(
            name='📚 Version',
            value='1.0.0',
            inline=True
        )

        embed.add_field(
            name='🔗 Source',
            value='[GitHub Repository](https://github.com/your-repo)',
            inline=False
        )

        await ctx.send(embed=embed)

async def main():
    """Khởi chạy bot"""
    bot = ReactionRoleBot()

    try:
        await bot.start(config.discord_token)
    except discord.LoginFailure:
        logger.error('❌ Token không hợp lệ! Vui lòng kiểm tra lại token trong file .env')
    except Exception as e:
        logger.error(f'❌ Lỗi khi khởi chạy bot: {e}')
    finally:
        await bot.close()

if __name__ == '__main__':
    asyncio.run(main())
