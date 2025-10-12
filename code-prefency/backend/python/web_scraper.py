#!/usr/bin/env python3
"""
Python Web Scraper và Data Extractor
Công cụ scraping và trích xuất dữ liệu từ các website
"""

import requests
import json
import csv
import time
import random
from datetime import datetime
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Any, Optional, Tuple
import argparse
import logging
from dataclasses import dataclass, asdict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import pandas as pd

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('web_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ScrapingConfig:
    """Cấu hình scraping"""
    base_url: str
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    delay_between_requests: float = 1.0
    max_retries: int = 3
    timeout: int = 30
    respect_robots_txt: bool = True

    def __post_init__(self):
        if not self.base_url.startswith(('http://', 'https://')):
            self.base_url = 'https://' + self.base_url

@dataclass
class ScrapedData:
    """Dữ liệu đã scrape"""
    url: str
    title: str
    content: str
    metadata: Dict[str, Any]
    scraped_at: str
    status_code: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class WebScraper:
    """Lớp chính cho web scraping"""

    def __init__(self, config: ScrapingConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': config.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })

        # Khởi tạo Selenium driver nếu cần
        self.driver = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.driver:
            self.driver.quit()

    def setup_selenium(self, headless: bool = True):
        """Thiết lập Selenium WebDriver"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")

        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument(f"user-agent={self.config.user_agent}")

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("✅ Khởi tạo Selenium WebDriver thành công")
        except Exception as e:
            logger.error(f"❌ Không thể khởi tạo Selenium: {e}")
            self.driver = None

    def get_page(self, url: str, retries: int = None) -> Optional[str]:
        """Lấy nội dung trang web"""
        if retries is None:
            retries = self.config.max_retries

        for attempt in range(retries):
            try:
                logger.info(f"Đang lấy trang: {url} (lần thử {attempt + 1})")

                response = self.session.get(
                    url,
                    timeout=self.config.timeout,
                    allow_redirects=True
                )

                response.raise_for_status()

                # Delay để tránh bị rate limit
                time.sleep(self.config.delay_between_requests)

                return response.text

            except requests.exceptions.RequestException as e:
                logger.warning(f"Lỗi lấy trang (lần thử {attempt + 1}): {e}")

                if attempt < retries - 1:
                    wait_time = (attempt + 1) * 2  # Exponential backoff
                    logger.info(f"Đợi {wait_time} giây trước khi thử lại...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Không thể lấy trang sau {retries} lần thử: {url}")

        return None

    def parse_html(self, html: str, url: str) -> ScrapedData:
        """Phân tích HTML và trích xuất dữ liệu"""
        soup = BeautifulSoup(html, 'html.parser')

        # Loại bỏ script và style
        for script in soup(["script", "style"]):
            script.decompose()

        # Lấy tiêu đề
        title = soup.title.string if soup.title else "No title"

        # Lấy nội dung chính
        content_selectors = [
            'article', '.content', '.post-content', '.entry-content',
            'main', '.main-content', '#content', '.article-body'
        ]

        content = ""
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                content = content_elem.get_text(strip=True)
                break

        if not content:
            # Lấy toàn bộ text nếu không tìm thấy content chính
            content = soup.get_text(strip=True)

        # Trích xuất metadata
        metadata = {
            'url': url,
            'title': title,
            'description': self.extract_meta_description(soup),
            'keywords': self.extract_meta_keywords(soup),
            'author': self.extract_author(soup),
            'publish_date': self.extract_publish_date(soup),
            'images': self.extract_images(soup, url),
            'links': self.extract_links(soup, url),
            'headings': self.extract_headings(soup),
        }

        return ScrapedData(
            url=url,
            title=title,
            content=content,
            metadata=metadata,
            scraped_at=datetime.now().isoformat(),
            status_code=200
        )

    def extract_meta_description(self, soup: BeautifulSoup) -> str:
        """Trích xuất meta description"""
        meta_desc = soup.find('meta', attrs={'name': 'description'}) or \
                   soup.find('meta', attrs={'property': 'og:description'})
        return meta_desc.get('content', '') if meta_desc else ''

    def extract_meta_keywords(self, soup: BeautifulSoup) -> str:
        """Trích xuất meta keywords"""
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        return meta_keywords.get('content', '') if meta_keywords else ''

    def extract_author(self, soup: BeautifulSoup) -> str:
        """Trích xuất tên tác giả"""
        author_selectors = [
            'meta[name="author"]', '.author', '.byline', '.post-author',
            '[rel="author"]', '.entry-author'
        ]

        for selector in author_selectors:
            author_elem = soup.select_one(selector)
            if author_elem:
                if author_elem.name == 'meta':
                    return author_elem.get('content', '')
                else:
                    return author_elem.get_text(strip=True)

        return ''

    def extract_publish_date(self, soup: BeautifulSoup) -> str:
        """Trích xuất ngày xuất bản"""
        date_selectors = [
            'meta[property="article:published_time"]',
            'meta[name="publishdate"]',
            '.publish-date', '.post-date', '.entry-date',
            'time[datetime]', 'time'
        ]

        for selector in date_selectors:
            date_elem = soup.select_one(selector)
            if date_elem:
                if date_elem.name == 'meta':
                    return date_elem.get('content', '')
                elif date_elem.get('datetime'):
                    return date_elem.get('datetime', '')
                else:
                    return date_elem.get_text(strip=True)

        return ''

    def extract_images(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Trích xuất danh sách hình ảnh"""
        images = []
        img_tags = soup.find_all('img', src=True)

        for img in img_tags:
            src = img.get('src', '')
            if src:
                # Chuyển relative URL thành absolute URL
                absolute_url = urljoin(base_url, src)
                images.append(absolute_url)

        return images

    def extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Trích xuất danh sách liên kết"""
        links = []
        link_tags = soup.find_all('a', href=True)

        for link in link_tags:
            href = link.get('href', '')
            if href:
                absolute_url = urljoin(base_url, href)
                links.append(absolute_url)

        return list(set(links))  # Loại bỏ duplicate

    def extract_headings(self, soup: BeautifulSoup) -> Dict[str, List[str]]:
        """Trích xuất các tiêu đề"""
        headings = {'h1': [], 'h2': [], 'h3': [], 'h4': [], 'h5': [], 'h6': []}

        for level in headings.keys():
            heading_tags = soup.find_all(level)
            headings[level] = [tag.get_text(strip=True) for tag in heading_tags]

        return headings

    def scrape_single_page(self, url: str) -> Optional[ScrapedData]:
        """Scrape một trang đơn"""
        html_content = self.get_page(url)
        if html_content:
            return self.parse_html(html_content, url)
        return None

    def scrape_multiple_pages(self, urls: List[str]) -> List[ScrapedData]:
        """Scrape nhiều trang"""
        results = []

        for url in urls:
            logger.info(f"Đang scrape: {url}")
            data = self.scrape_single_page(url)
            if data:
                results.append(data)
            else:
                logger.warning(f"Không thể scrape: {url}")

        return results

    def crawl_website(self, start_url: str, max_pages: int = 50,
                     max_depth: int = 3) -> List[ScrapedData]:
        """Crawl toàn bộ website"""
        visited = set()
        to_visit = [(start_url, 0)]  # (url, depth)
        results = []

        while to_visit and len(results) < max_pages:
            current_url, depth = to_visit.pop(0)

            if current_url in visited or depth > max_depth:
                continue

            visited.add(current_url)

            logger.info(f"Crawling: {current_url} (depth: {depth})")

            data = self.scrape_single_page(current_url)
            if data:
                results.append(data)

                # Tìm liên kết nội bộ để tiếp tục crawl
                if depth < max_depth:
                    html_content = self.get_page(current_url)
                    if html_content:
                        soup = BeautifulSoup(html_content, 'html.parser')
                        internal_links = self.get_internal_links(soup, start_url)

                        for link in internal_links:
                            if link not in visited:
                                to_visit.append((link, depth + 1))

            # Delay giữa các request
            time.sleep(self.config.delay_between_requests)

        return results

    def get_internal_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Lấy danh sách liên kết nội bộ"""
        internal_links = []
        link_tags = soup.find_all('a', href=True)

        parsed_base = urlparse(base_url)

        for link in link_tags:
            href = link.get('href', '')
            absolute_url = urljoin(base_url, href)

            # Chỉ lấy liên kết nội bộ (cùng domain)
            parsed_link = urlparse(absolute_url)
            if parsed_link.netloc == parsed_base.netloc:
                internal_links.append(absolute_url)

        return list(set(internal_links))

    def save_to_json(self, data_list: List[ScrapedData], filename: str):
        """Lưu dữ liệu dạng JSON"""
        json_data = [data.to_dict() for data in data_list]

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)

        logger.info(f"Đã lưu {len(data_list)} bản ghi vào {filename}")

    def save_to_csv(self, data_list: List[ScrapedData], filename: str):
        """Lưu dữ liệu dạng CSV"""
        fieldnames = ['url', 'title', 'content', 'scraped_at', 'status_code']

        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for data in data_list:
                writer.writerow({
                    'url': data.url,
                    'title': data.title,
                    'content': data.content[:500] + '...' if len(data.content) > 500 else data.content,
                    'scraped_at': data.scraped_at,
                    'status_code': data.status_code
                })

        logger.info(f"Đã lưu {len(data_list)} bản ghi vào {filename}")

    def export_to_excel(self, data_list: List[ScrapedData], filename: str):
        """Xuất dữ liệu dạng Excel"""
        df_data = []

        for data in data_list:
            row = {
                'URL': data.url,
                'Title': data.title,
                'Content': data.content[:1000] + '...' if len(data.content) > 1000 else data.content,
                'Description': data.metadata.get('description', ''),
                'Author': data.metadata.get('author', ''),
                'Publish Date': data.metadata.get('publish_date', ''),
                'Scraped At': data.scraped_at,
                'Status Code': data.status_code
            }
            df_data.append(row)

        df = pd.DataFrame(df_data)

        try:
            df.to_excel(filename, index=False, engine='openpyxl')
            logger.info(f"Đã xuất {len(data_list)} bản ghi vào {filename}")
        except ImportError:
            logger.error("openpyxl không được cài đặt. Không thể xuất Excel.")

class NewsScraper(WebScraper):
    """Scraper chuyên dụng cho tin tức"""

    def scrape_news_article(self, url: str) -> Optional[ScrapedData]:
        """Scrape bài báo tin tức"""
        return self.scrape_single_page(url)

    def scrape_news_category(self, category_url: str, max_articles: int = 10) -> List[ScrapedData]:
        """Scrape danh mục tin tức"""
        html = self.get_page(category_url)
        if not html:
            return []

        soup = BeautifulSoup(html, 'html.parser')
        articles = []

        # Tìm các liên kết bài viết
        article_selectors = [
            '.news-item a', '.article-item a', '.post-item a',
            'h2 a', 'h3 a', '.title a'
        ]

        for selector in article_selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href', '')
                if href and href.startswith(('http', '/')):
                    article_url = urljoin(category_url, href)

                    # Kiểm tra xem đã đủ bài chưa
                    if len(articles) >= max_articles:
                        break

                    # Scrape bài viết
                    article_data = self.scrape_news_article(article_url)
                    if article_data:
                        articles.append(article_data)

            if len(articles) >= max_articles:
                break

        return articles[:max_articles]

class EcommerceScraper(WebScraper):
    """Scraper chuyên dụng cho e-commerce"""

    def scrape_product(self, url: str) -> Optional[Dict[str, Any]]:
        """Scrape thông tin sản phẩm"""
        html = self.get_page(url)
        if not html:
            return None

        soup = BeautifulSoup(html, 'html.parser')

        product_info = {
            'url': url,
            'name': self.extract_product_name(soup),
            'price': self.extract_product_price(soup),
            'description': self.extract_product_description(soup),
            'images': self.extract_product_images(soup, url),
            'category': self.extract_product_category(soup),
            'brand': self.extract_product_brand(soup),
            'availability': self.extract_product_availability(soup),
            'specifications': self.extract_product_specs(soup),
            'scraped_at': datetime.now().isoformat()
        }

        return product_info

    def extract_product_name(self, soup: BeautifulSoup) -> str:
        """Trích xuất tên sản phẩm"""
        selectors = ['h1', '.product-title', '.product-name', '.title']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ''

    def extract_product_price(self, soup: BeautifulSoup) -> str:
        """Trích xuất giá sản phẩm"""
        selectors = ['.price', '.product-price', '.current-price', '.amount']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ''

    def extract_product_description(self, soup: BeautifulSoup) -> str:
        """Trích xuất mô tả sản phẩm"""
        selectors = ['.description', '.product-description', '.content']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ''

    def extract_product_images(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Trích xuất hình ảnh sản phẩm"""
        images = []
        img_selectors = ['.product-image img', '.gallery img', '.image img']

        for selector in img_selectors:
            img_tags = soup.select(selector)
            for img in img_tags:
                src = img.get('src') or img.get('data-src')
                if src:
                    absolute_url = urljoin(base_url, src)
                    images.append(absolute_url)

        return images

    def extract_product_category(self, soup: BeautifulSoup) -> str:
        """Trích xuất danh mục sản phẩm"""
        selectors = ['.category', '.breadcrumb a', '.category-link']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ''

    def extract_product_brand(self, soup: BeautifulSoup) -> str:
        """Trích xuất thương hiệu"""
        selectors = ['.brand', '.manufacturer', '.vendor']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ''

    def extract_product_availability(self, soup: BeautifulSoup) -> str:
        """Trích xuất tình trạng còn hàng"""
        selectors = ['.availability', '.stock', '.in-stock', '.out-of-stock']
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return 'Unknown'

    def extract_product_specs(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Trích xuất thông số kỹ thuật"""
        specs = {}
        spec_selectors = ['.specifications', '.specs', '.attributes']

        for selector in spec_selectors:
            spec_table = soup.select_one(selector)
            if spec_table:
                rows = spec_table.find_all(['tr', 'li', 'div'])
                for row in rows:
                    if ':' in row.get_text():
                        key, value = row.get_text().split(':', 1)
                        specs[key.strip()] = value.strip()

        return specs

def main():
    """Hàm chính"""
    parser = argparse.ArgumentParser(description='Web Scraper Tool')
    parser.add_argument('url', help='URL cần scrape')
    parser.add_argument('--mode', choices=['single', 'crawl', 'news', 'product'],
                       default='single', help='Chế độ scraping')
    parser.add_argument('--output', '-o', default='scraped_data.json',
                       help='File đầu ra')
    parser.add_argument('--format', choices=['json', 'csv', 'excel'],
                       default='json', help='Định dạng đầu ra')
    parser.add_argument('--max-pages', type=int, default=10,
                       help='Số trang tối đa khi crawl')
    parser.add_argument('--delay', type=float, default=1.0,
                       help='Delay giữa các request (giây)')
    parser.add_argument('--headless', action='store_true',
                       help='Chạy Selenium headless mode')

    args = parser.parse_args()

    # Cấu hình scraper
    config = ScrapingConfig(
        base_url=args.url,
        delay_between_requests=args.delay
    )

    with WebScraper(config) as scraper:
        # Thiết lập Selenium nếu cần
        if args.mode in ['news', 'product']:
            scraper.setup_selenium(headless=args.headless)

        results = []

        if args.mode == 'single':
            # Scrape trang đơn
            data = scraper.scrape_single_page(args.url)
            if data:
                results = [data]

        elif args.mode == 'crawl':
            # Crawl website
            results = scraper.crawl_website(args.url, max_pages=args.max_pages)

        elif args.mode == 'news':
            # Scrape tin tức
            news_scraper = NewsScraper(config)
            results = news_scraper.scrape_news_category(args.url)

        elif args.mode == 'product':
            # Scrape sản phẩm
            ecommerce_scraper = EcommerceScraper(config)
            product_data = ecommerce_scraper.scrape_product(args.url)
            if product_data:
                results = [ScrapedData(
                    url=product_data['url'],
                    title=product_data['name'],
                    content=product_data['description'],
                    metadata=product_data,
                    scraped_at=datetime.now().isoformat(),
                    status_code=200
                )]

        if results:
            # Lưu kết quả
            if args.format == 'json':
                scraper.save_to_json(results, args.output)
            elif args.format == 'csv':
                scraper.save_to_csv(results, args.output.replace('.json', '.csv'))
            elif args.format == 'excel':
                scraper.export_to_excel(results, args.output.replace('.json', '.xlsx'))

            print(f"✅ Đã scrape thành công {len(results)} mục")
            print(f"📁 Kết quả đã lưu vào: {args.output}")

            # Hiển thị thống kê
            print("📊 Thống kê:")
            print(f"   - Tổng số ký tự nội dung: {sum(len(r.content) for r in results)}")
            print(f"   - Số hình ảnh tìm thấy: {sum(len(r.metadata.get('images', [])) for r in results)}")
        else:
            print("❌ Không scrape được dữ liệu nào")

if __name__ == "__main__":
    main()
