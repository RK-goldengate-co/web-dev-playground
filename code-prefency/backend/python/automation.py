#!/usr/bin/env python3
"""
Python Automation và Scripting
Công cụ tự động hóa các tác vụ hàng ngày với Python
"""

import os
import sys
import time
import shutil
import smtplib
import requests
import schedule
import subprocess
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.application import MIMEApplication
from pathlib import Path
import json
import csv
import sqlite3
import logging
from typing import List, Dict, Optional, Any
import argparse

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SystemMonitor:
    """Giám sát hệ thống và tài nguyên"""

    def __init__(self):
        self.logs = []

    def get_system_info(self) -> Dict[str, Any]:
        """Lấy thông tin hệ thống"""
        try:
            import psutil

            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                'cpu_usage': cpu_percent,
                'memory_total': memory.total,
                'memory_used': memory.used,
                'memory_percent': memory.percent,
                'disk_total': disk.total,
                'disk_used': disk.used,
                'disk_percent': disk.percent,
                'timestamp': datetime.now().isoformat()
            }
        except ImportError:
            logger.warning("psutil không được cài đặt")
            return {'error': 'psutil not available'}

    def check_disk_space(self, threshold: float = 80.0) -> bool:
        """Kiểm tra dung lượng ổ đĩa"""
        try:
            import psutil
            disk = psutil.disk_usage('/')
            return disk.percent > threshold
        except ImportError:
            return False

    def log_system_status(self):
        """Ghi log trạng thái hệ thống"""
        info = self.get_system_info()
        self.logs.append(info)
        logger.info(f"System status: CPU {info.get('cpu_usage', 'N/A')}%, Memory {info.get('memory_percent', 'N/A')}%")

        # Giữ chỉ 100 bản ghi gần nhất
        if len(self.logs) > 100:
            self.logs = self.logs[-100:]

class FileManager:
    """Quản lý file và thư mục"""

    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)

    def organize_files(self, source_dir: str, extensions: Dict[str, str]) -> Dict[str, int]:
        """Sắp xếp file theo loại"""
        source_path = Path(source_dir)
        moved_files = {}

        if not source_path.exists():
            logger.error(f"Thư mục nguồn không tồn tại: {source_dir}")
            return moved_files

        # Tạo thư mục đích nếu chưa có
        for folder in extensions.values():
            (source_path / folder).mkdir(exist_ok=True)

        # Di chuyển file
        for file_path in source_path.iterdir():
            if file_path.is_file():
                file_ext = file_path.suffix.lower()

                for ext_pattern, folder_name in extensions.items():
                    if ext_pattern.startswith('*'):
                        # Pattern matching (ví dụ: *.jpg, *.png)
                        pattern = ext_pattern[1:]  # Loại bỏ dấu *
                        if file_path.name.lower().endswith(pattern):
                            dest_folder = source_path / folder_name
                            break
                    elif file_ext == ext_pattern:
                        dest_folder = source_path / folder_name
                        break
                else:
                    # File không thuộc loại nào
                    dest_folder = source_path / "others"

                dest_folder.mkdir(exist_ok=True)
                dest_path = dest_folder / file_path.name

                try:
                    shutil.move(str(file_path), str(dest_path))
                    moved_files[file_path.name] = folder_name
                    logger.info(f"Moved {file_path.name} to {folder_name}")
                except Exception as e:
                    logger.error(f"Không thể di chuyển {file_path.name}: {e}")

        return moved_files

    def backup_files(self, source: str, destination: str, pattern: str = "*") -> bool:
        """Sao lưu file"""
        try:
            source_path = Path(source)
            dest_path = Path(destination)

            if not source_path.exists():
                logger.error(f"Thư mục nguồn không tồn tại: {source}")
                return False

            # Tạo thư mục đích nếu chưa có
            dest_path.mkdir(parents=True, exist_ok=True)

            # Tìm và copy file
            for file_path in source_path.rglob(pattern):
                if file_path.is_file():
                    relative_path = file_path.relative_to(source_path)
                    dest_file = dest_path / relative_path

                    # Tạo thư mục con nếu cần
                    dest_file.parent.mkdir(parents=True, exist_ok=True)

                    shutil.copy2(file_path, dest_file)
                    logger.info(f"Backed up: {relative_path}")

            return True
        except Exception as e:
            logger.error(f"Lỗi sao lưu: {e}")
            return False

    def clean_temp_files(self, temp_dirs: List[str], older_than_days: int = 7) -> int:
        """Dọn dẹp file tạm thời"""
        cleaned_count = 0
        cutoff_date = datetime.now() - timedelta(days=older_than_days)

        for temp_dir in temp_dirs:
            temp_path = Path(temp_dir)

            if not temp_path.exists():
                continue

            for file_path in temp_path.rglob("*"):
                if file_path.is_file():
                    try:
                        file_modified = datetime.fromtimestamp(file_path.stat().st_mtime)

                        if file_modified < cutoff_date:
                            file_path.unlink()
                            cleaned_count += 1
                            logger.info(f"Deleted temp file: {file_path}")
                    except Exception as e:
                        logger.error(f"Không thể xóa file {file_path}: {e}")

        logger.info(f"Đã dọn dẹp {cleaned_count} file tạm thời")
        return cleaned_count

class EmailAutomation:
    """Tự động hóa email"""

    def __init__(self, smtp_server: str = "smtp.gmail.com", smtp_port: int = 587):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.server = None

    def connect(self, username: str, password: str) -> bool:
        """Kết nối đến SMTP server"""
        try:
            self.server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            self.server.starttls()
            self.server.login(username, password)
            logger.info("Đã kết nối đến SMTP server")
            return True
        except Exception as e:
            logger.error(f"Lỗi kết nối SMTP: {e}")
            return False

    def send_email(self, to_email: str, subject: str, body: str,
                   from_email: str = None, attachments: List[str] = None) -> bool:
        """Gửi email"""
        if not self.server:
            logger.error("Chưa kết nối đến SMTP server")
            return False

        try:
            msg = MimeMultipart()
            msg['From'] = from_email or "automation@example.com"
            msg['To'] = to_email
            msg['Subject'] = subject

            # Thêm nội dung text
            msg.attach(MimeText(body, 'plain'))

            # Thêm file đính kèm
            if attachments:
                for attachment_path in attachments:
                    attachment = Path(attachment_path)
                    if attachment.exists():
                        with open(attachment, 'rb') as f:
                            part = MIMEApplication(f.read())
                            part.add_header('Content-Disposition',
                                          'attachment',
                                          filename=attachment.name)
                            msg.attach(part)

            # Gửi email
            self.server.send_message(msg)
            logger.info(f"Đã gửi email đến {to_email}")
            return True

        except Exception as e:
            logger.error(f"Lỗi gửi email: {e}")
            return False

    def disconnect(self):
        """Ngắt kết nối"""
        if self.server:
            self.server.quit()
            self.server = None

class WebAutomation:
    """Tự động hóa tác vụ web"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def download_file(self, url: str, destination: str, filename: str = None) -> bool:
        """Tải file từ URL"""
        try:
            response = self.session.get(url, stream=True)
            response.raise_for_status()

            # Tạo thư mục đích nếu chưa có
            dest_path = Path(destination)
            dest_path.mkdir(parents=True, exist_ok=True)

            # Tên file
            if not filename:
                filename = url.split('/')[-1] or 'downloaded_file'

            file_path = dest_path / filename

            # Tải và ghi file
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            logger.info(f"Đã tải file: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Lỗi tải file: {e}")
            return False

    def scrape_website(self, url: str, selectors: Dict[str, str]) -> Dict[str, Any]:
        """Scrape dữ liệu từ website"""
        try:
            from bs4 import BeautifulSoup

            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            results = {}
            for key, selector in selectors.items():
                elements = soup.select(selector)
                results[key] = [elem.get_text().strip() for elem in elements]

            return results

        except ImportError:
            logger.error("BeautifulSoup4 không được cài đặt")
            return {}
        except Exception as e:
            logger.error(f"Lỗi scrape website: {e}")
            return {}

    def monitor_website(self, urls: List[str], check_interval: int = 300) -> None:
        """Giám sát trạng thái website"""
        def check_websites():
            for url in urls:
                try:
                    response = self.session.get(url, timeout=10)
                    status = "UP" if response.status_code == 200 else f"DOWN ({response.status_code})"

                    if response.status_code != 200:
                        logger.warning(f"Website {url} is {status}")

                except Exception as e:
                    logger.error(f"Không thể kiểm tra {url}: {e}")

        # Kiểm tra ngay lập tức
        check_websites()

        # Lên lịch kiểm tra định kỳ
        schedule.every(check_interval).seconds.do(check_websites)

class DatabaseAutomation:
    """Tự động hóa tác vụ database"""

    def __init__(self, db_path: str = "automation.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Khởi tạo database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def add_task(self, name: str, description: str = "") -> int:
        """Thêm task mới"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO tasks (name, description) VALUES (?, ?)",
                (name, description)
            )
            task_id = cursor.lastrowid

            # Log task creation
            self.log_activity('INFO', f"Created task: {name}")
            return task_id

    def complete_task(self, task_id: int) -> bool:
        """Đánh dấu task hoàn thành"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
                (task_id,)
            )

            if cursor.rowcount > 0:
                conn.execute(
                    "INSERT INTO logs (level, message) VALUES (?, ?)",
                    ('INFO', f"Completed task ID: {task_id}")
                )
                return True
            return False

    def log_activity(self, level: str, message: str):
        """Ghi log hoạt động"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO logs (level, message) VALUES (?, ?)",
                (level, message)
            )

    def generate_report(self) -> Dict[str, Any]:
        """Tạo báo cáo từ database"""
        with sqlite3.connect(self.db_path) as conn:
            # Thống kê task
            tasks_stats = conn.execute("""
                SELECT status, COUNT(*) as count
                FROM tasks
                GROUP BY status
            """).fetchall()

            # Log gần đây
            recent_logs = conn.execute("""
                SELECT level, message, created_at
                FROM logs
                ORDER BY created_at DESC
                LIMIT 10
            """).fetchall()

            return {
                'tasks': dict(tasks_stats),
                'recent_logs': recent_logs,
                'total_tasks': sum(count for _, count in tasks_stats),
                'total_logs': len(recent_logs)
            }

class AutomationScheduler:
    """Lên lịch thực hiện tác vụ"""

    def __init__(self):
        self.tasks = []
        self.running = False

    def add_daily_task(self, time_str: str, task_func, *args, **kwargs):
        """Thêm task thực hiện hàng ngày"""
        def daily_task():
            try:
                task_func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Lỗi thực hiện task hàng ngày: {e}")

        schedule.every().day.at(time_str).do(daily_task)
        self.tasks.append(f"Daily at {time_str}: {task_func.__name__}")

    def add_hourly_task(self, task_func, *args, **kwargs):
        """Thêm task thực hiện hàng giờ"""
        def hourly_task():
            try:
                task_func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Lỗi thực hiện task hàng giờ: {e}")

        schedule.every().hour.do(hourly_task)
        self.tasks.append(f"Hourly: {task_func.__name__}")

    def add_weekly_task(self, day: str, time_str: str, task_func, *args, **kwargs):
        """Thêm task thực hiện hàng tuần"""
        def weekly_task():
            try:
                task_func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Lỗi thực hiện task hàng tuần: {e}")

        days_map = {
            'monday': schedule.every().monday,
            'tuesday': schedule.every().tuesday,
            'wednesday': schedule.every().wednesday,
            'thursday': schedule.every().thursday,
            'friday': schedule.every().friday,
            'saturday': schedule.every().saturday,
            'sunday': schedule.every().sunday
        }

        if day.lower() in days_map:
            days_map[day.lower()].at(time_str).do(weekly_task)
            self.tasks.append(f"Weekly on {day} at {time_str}: {task_func.__name__}")

    def start(self):
        """Bắt đầu scheduler"""
        self.running = True
        logger.info("Bắt đầu automation scheduler")
        logger.info(f"Đã đăng ký {len(self.tasks)} tác vụ")

        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Kiểm tra mỗi phút
            except KeyboardInterrupt:
                logger.info("Dừng scheduler bởi người dùng")
                break
            except Exception as e:
                logger.error(f"Lỗi trong scheduler: {e}")
                time.sleep(60)

    def stop(self):
        """Dừng scheduler"""
        self.running = False
        logger.info("Đã dừng automation scheduler")

class ReportGenerator:
    """Tạo báo cáo tự động"""

    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

    def generate_daily_report(self, system_monitor: SystemMonitor, db_automation: DatabaseAutomation):
        """Tạo báo cáo hàng ngày"""
        timestamp = datetime.now().strftime("%Y%m%d")
        filename = f"daily_report_{timestamp}.html"

        # Lấy dữ liệu
        system_info = system_monitor.get_system_info()
        db_report = db_automation.generate_report()

        # Tạo báo cáo HTML
        html_content = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>Báo cáo hàng ngày - {datetime.now().strftime('%Y-%m-%d')}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 8px; }}
                .section {{ margin: 20px 0; }}
                .metric {{ background: #e8f4f8; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Báo cáo hệ thống hàng ngày</h1>
                <p><strong>Ngày:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>

            <div class="section">
                <h2>💻 Thông tin hệ thống</h2>
                <div class="metric">
                    <p><strong>CPU Usage:</strong> {system_info.get('cpu_usage', 'N/A')}%</p>
                    <p><strong>Memory Usage:</strong> {system_info.get('memory_percent', 'N/A')}%</p>
                    <p><strong>Disk Usage:</strong> {system_info.get('disk_percent', 'N/A')}%</p>
                </div>
            </div>

            <div class="section">
                <h2>📋 Thống kê tác vụ</h2>
                <table>
                    <tr><th>Trạng thái</th><th>Số lượng</th></tr>
        """

        for status, count in db_report['tasks'].items():
            html_content += f"<tr><td>{status}</td><td>{count}</td></tr>"

        html_content += f"""
                </table>
                <p><strong>Tổng số tác vụ:</strong> {db_report['total_tasks']}</p>
            </div>

            <div class="section">
                <h2>📝 Hoạt động gần đây</h2>
                <table>
                    <tr><th>Thời gian</th><th>Cấp độ</th><th>Tin nhắn</th></tr>
        """

        for log in db_report['recent_logs']:
            html_content += f"<tr><td>{log[2]}</td><td>{log[0]}</td><td>{log[1]}</td></tr>"

        html_content += """
                </table>
            </div>
        </body>
        </html>
        """

        # Lưu báo cáo
        with open(self.output_dir / filename, 'w', encoding='utf-8') as f:
            f.write(html_content)

        logger.info(f"Đã tạo báo cáo hàng ngày: {filename}")
        return filename

class MainAutomation:
    """Lớp chính điều khiển tất cả automation"""

    def __init__(self):
        self.system_monitor = SystemMonitor()
        self.file_manager = FileManager()
        self.email_automation = EmailAutomation()
        self.web_automation = WebAutomation()
        self.db_automation = DatabaseAutomation()
        self.scheduler = AutomationScheduler()
        self.report_generator = ReportGenerator()

        self.setup_automation_tasks()

    def setup_automation_tasks(self):
        """Thiết lập các tác vụ tự động"""

        # Tác vụ hàng ngày
        self.scheduler.add_daily_task("09:00", self.daily_backup)
        self.scheduler.add_daily_task("18:00", self.generate_reports)
        self.scheduler.add_daily_task("02:00", self.cleanup_system)

        # Tác vụ hàng giờ
        self.scheduler.add_hourly_task(self.check_system_health)

        # Tác vụ hàng tuần
        self.scheduler.add_weekly_task("sunday", "10:00", self.weekly_maintenance)

    def daily_backup(self):
        """Sao lưu hàng ngày"""
        logger.info("Thực hiện sao lưu hàng ngày")

        backup_dir = f"backup_{datetime.now().strftime('%Y%m%d')}"
        success = self.file_manager.backup_files(".", backup_dir, "*.py")

        if success:
            self.db_automation.log_activity("INFO", f"Daily backup completed: {backup_dir}")

    def generate_reports(self):
        """Tạo báo cáo"""
        logger.info("Tạo báo cáo hàng ngày")
        self.report_generator.generate_daily_report(self.system_monitor, self.db_automation)

    def cleanup_system(self):
        """Dọn dẹp hệ thống"""
        logger.info("Dọn dẹp hệ thống")

        temp_dirs = ["/tmp", "./temp"]
        cleaned = self.file_manager.clean_temp_files(temp_dirs)

        if cleaned > 0:
            self.db_automation.log_activity("INFO", f"Cleaned {cleaned} temporary files")

    def check_system_health(self):
        """Kiểm tra sức khỏe hệ thống"""
        if self.system_monitor.check_disk_space(85):
            logger.warning("Disk space is running low!")

            # Gửi cảnh báo qua email (nếu được cấu hình)
            if hasattr(self, 'email_configured'):
                self.send_disk_warning()

    def weekly_maintenance(self):
        """Bảo trì hàng tuần"""
        logger.info("Thực hiện bảo trì hàng tuần")

        # Sắp xếp file trong thư mục Downloads
        download_extensions = {
            '*.jpg': 'images',
            '*.png': 'images',
            '*.pdf': 'documents',
            '*.docx': 'documents',
            '*.zip': 'archives',
            '*.mp4': 'videos'
        }

        organized = self.file_manager.organize_files("./Downloads", download_extensions)
        logger.info(f"Đã sắp xếp {len(organized)} file")

    def run_once(self, task_name: str):
        """Chạy một tác vụ cụ thể"""
        tasks = {
            'backup': self.daily_backup,
            'report': self.generate_reports,
            'cleanup': self.cleanup_system,
            'health': self.check_system_health,
            'organize': lambda: self.file_manager.organize_files("./Downloads", {
                '*.jpg': 'images', '*.png': 'images', '*.pdf': 'documents'
            })
        }

        if task_name in tasks:
            logger.info(f"Chạy tác vụ: {task_name}")
            tasks[task_name]()
        else:
            logger.error(f"Tác vụ không tồn tại: {task_name}")

    def start_scheduler(self):
        """Bắt đầu scheduler"""
        logger.info("🚀 Bắt đầu hệ thống automation")
        self.scheduler.start()

def main():
    """Hàm chính"""
    parser = argparse.ArgumentParser(description='Python Automation Tool')
    parser.add_argument('action', choices=['start', 'run', 'status'], help='Hành động thực hiện')
    parser.add_argument('--task', help='Tên tác vụ cụ thể để chạy')

    args = parser.parse_args()

    automation = MainAutomation()

    if args.action == 'start':
        # Bắt đầu scheduler
        automation.start_scheduler()

    elif args.action == 'run':
        if args.task:
            # Chạy tác vụ cụ thể
            automation.run_once(args.task)
        else:
            # Chạy tất cả tác vụ một lần
            automation.daily_backup()
            automation.generate_reports()
            automation.cleanup_system()

    elif args.action == 'status':
        # Hiển thị trạng thái
        report = automation.db_automation.generate_report()
        print("📊 Trạng thái hệ thống:")
        print(f"   Tổng số tác vụ: {report['total_tasks']}")
        print(f"   Tổng số log: {report['total_logs']}")

        recent_logs = report['recent_logs'][:5]
        if recent_logs:
            print("📝 5 log gần nhất:")
            for log in recent_logs:
                print(f"   {log[0]}: {log[1]}")

if __name__ == "__main__":
    main()
