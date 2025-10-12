#!/usr/bin/env python3
"""
Python HTTP Client và API Testing
Công cụ client HTTP mạnh mẽ với khả năng testing API
"""

import requests
import json
import time
import csv
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
import urllib.parse
import base64
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
import threading
import queue
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_client.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class RequestConfig:
    """Cấu hình request"""
    method: str = 'GET'
    headers: Dict[str, str] = None
    params: Dict[str, Any] = None
    data: Union[str, Dict, List] = None
    json: Dict[str, Any] = None
    auth: tuple = None  # (username, password)
    timeout: int = 30
    verify: bool = True
    allow_redirects: bool = True

    def __post_init__(self):
        if self.headers is None:
            self.headers = {}
        if self.params is None:
            self.params = {}

@dataclass
class ResponseMetrics:
    """Metrics cho response"""
    status_code: int
    response_time: float  # milliseconds
    response_size: int    # bytes
    timestamp: str

@dataclass
class TestResult:
    """Kết quả test API"""
    test_name: str
    request: RequestConfig
    response: ResponseMetrics
    success: bool
    error_message: str = ""
    expected_status: int = 200

class APIClient:
    """HTTP Client mạnh mẽ cho API testing"""

    def __init__(self, base_url: str = "", default_headers: Dict[str, str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()

        if default_headers:
            self.session.headers.update(default_headers)

        self.request_history = []
        self.test_results = []

    def set_auth(self, auth_type: str, credentials: Dict[str, str]):
        """Thiết lập authentication"""
        if auth_type.lower() == 'basic':
            username = credentials.get('username')
            password = credentials.get('password')
            if username and password:
                self.session.auth = HTTPBasicAuth(username, password)

        elif auth_type.lower() == 'bearer':
            token = credentials.get('token')
            if token:
                self.session.headers.update({'Authorization': f'Bearer {token}'})

        elif auth_type.lower() == 'api_key':
            key = credentials.get('key')
            header_name = credentials.get('header_name', 'X-API-Key')
            if key:
                self.session.headers.update({header_name: key})

    def build_url(self, endpoint: str) -> str:
        """Xây dựng URL hoàn chỉnh"""
        if endpoint.startswith('http'):
            return endpoint
        return f"{self.base_url}/{endpoint.lstrip('/')}"

    def send_request(self, endpoint: str, config: RequestConfig) -> tuple:
        """Gửi HTTP request"""
        url = self.build_url(endpoint)
        start_time = time.time()

        try:
            # Chuẩn bị request
            request_kwargs = {
                'method': config.method,
                'headers': {**self.session.headers, **config.headers},
                'params': config.params,
                'timeout': config.timeout,
                'verify': config.verify,
                'allow_redirects': config.allow_redirects
            }

            # Thêm authentication nếu có
            if config.auth:
                username, password = config.auth
                request_kwargs['auth'] = HTTPBasicAuth(username, password)

            # Thêm body data
            if config.json:
                request_kwargs['json'] = config.json
            elif config.data:
                if isinstance(config.data, dict):
                    request_kwargs['json'] = config.data
                else:
                    request_kwargs['data'] = config.data

            # Gửi request
            response = self.session.request(url=url, **request_kwargs)

            # Tính toán metrics
            response_time = (time.time() - start_time) * 1000
            response_size = len(response.content)

            metrics = ResponseMetrics(
                status_code=response.status_code,
                response_time=response_time,
                response_size=response_size,
                timestamp=datetime.now().isoformat()
            )

            # Lưu lịch sử
            self.request_history.append({
                'url': url,
                'method': config.method,
                'status_code': response.status_code,
                'response_time': response_time,
                'timestamp': metrics.timestamp
            })

            return response, metrics

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            metrics = ResponseMetrics(
                status_code=0,
                response_time=response_time,
                response_size=0,
                timestamp=datetime.now().isoformat()
            )

            logger.error(f"Lỗi gửi request đến {url}: {e}")
            return None, metrics

    def get(self, endpoint: str, params: Dict[str, Any] = None, **kwargs) -> tuple:
        """GET request"""
        config = RequestConfig(method='GET', params=params, **kwargs)
        return self.send_request(endpoint, config)

    def post(self, endpoint: str, data: Union[str, Dict] = None, json: Dict = None, **kwargs) -> tuple:
        """POST request"""
        config = RequestConfig(method='POST', data=data, json=json, **kwargs)
        return self.send_request(endpoint, config)

    def put(self, endpoint: str, data: Union[str, Dict] = None, json: Dict = None, **kwargs) -> tuple:
        """PUT request"""
        config = RequestConfig(method='PUT', data=data, json=json, **kwargs)
        return self.send_request(endpoint, config)

    def patch(self, endpoint: str, data: Union[str, Dict] = None, json: Dict = None, **kwargs) -> tuple:
        """PATCH request"""
        config = RequestConfig(method='PATCH', data=data, json=json, **kwargs)
        return self.send_request(endpoint, config)

    def delete(self, endpoint: str, **kwargs) -> tuple:
        """DELETE request"""
        config = RequestConfig(method='DELETE', **kwargs)
        return self.send_request(endpoint, config)

    def test_endpoint(self, endpoint: str, expected_status: int = 200,
                     test_name: str = None) -> TestResult:
        """Test một endpoint"""
        if not test_name:
            test_name = f"Test {endpoint}"

        config = RequestConfig()
        response, metrics = self.send_request(endpoint, config)

        success = response and response.status_code == expected_status if expected_status else response is not None

        result = TestResult(
            test_name=test_name,
            request=config,
            response=metrics,
            success=success,
            expected_status=expected_status
        )

        if not success:
            result.error_message = f"Expected status {expected_status}, got {response.status_code if response else 'No response'}"

        self.test_results.append(result)
        return result

    def load_test(self, endpoint: str, num_requests: int = 100,
                  concurrency: int = 10) -> Dict[str, Any]:
        """Load testing"""
        logger.info(f"Bắt đầu load test: {num_requests} requests với {concurrency} concurrent users")

        results = []
        response_times = []

        def make_request():
            response, metrics = self.send_request(endpoint, RequestConfig())
            results.append(metrics)
            if metrics.response_time > 0:
                response_times.append(metrics.response_time)

        # Sử dụng ThreadPoolExecutor để tạo concurrent requests
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]

            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Lỗi trong load test: {e}")

        # Tính toán thống kê
        if response_times:
            stats = {
                'total_requests': len(results),
                'successful_requests': len([r for r in results if r.status_code < 400]),
                'failed_requests': len([r for r in results if r.status_code >= 400]),
                'min_response_time': min(response_times),
                'max_response_time': max(response_times),
                'avg_response_time': statistics.mean(response_times),
                'median_response_time': statistics.median(response_times),
                'p95_response_time': sorted(response_times)[int(len(response_times) * 0.95)],
                'requests_per_second': len(results) / (max(response_times) / 1000) if response_times else 0
            }
        else:
            stats = {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'error': 'No successful requests'
            }

        logger.info(f"Load test hoàn thành. RPS: {stats.get('requests_per_second', 0):.2f}")
        return stats

    def run_test_suite(self, tests: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Chạy bộ test API"""
        logger.info(f"Bắt đầu chạy bộ test với {len(tests)} test cases")

        results = []
        start_time = time.time()

        for test in tests:
            result = self.test_endpoint(
                endpoint=test['endpoint'],
                expected_status=test.get('expected_status', 200),
                test_name=test.get('name', f"Test {test['endpoint']}")
            )
            results.append(result)

            # Delay giữa các test
            if test.get('delay', 0) > 0:
                time.sleep(test['delay'])

        total_time = time.time() - start_time

        # Tổng hợp kết quả
        summary = {
            'total_tests': len(results),
            'passed_tests': len([r for r in results if r.success]),
            'failed_tests': len([r for r in results if not r.success]),
            'total_time': total_time,
            'avg_time_per_test': total_time / len(results),
            'results': [asdict(result) for result in results]
        }

        logger.info(f"Test suite hoàn thành: {summary['passed_tests']}/{summary['total_tests']} passed")
        return summary

    def export_results(self, filename: str, format: str = 'json'):
        """Xuất kết quả test"""
        if format.lower() == 'json':
            data = {
                'test_results': [asdict(result) for result in self.test_results],
                'request_history': self.request_history,
                'exported_at': datetime.now().isoformat()
            }

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        elif format.lower() == 'csv':
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['Test Name', 'Success', 'Status Code', 'Response Time (ms)', 'Error Message'])

                for result in self.test_results:
                    writer.writerow([
                        result.test_name,
                        result.success,
                        result.response.status_code,
                        result.response.response_time,
                        result.error_message
                    ])

        logger.info(f"Đã xuất kết quả vào {filename}")

class RESTClient(APIClient):
    """REST API Client với các method tiện ích"""

    def get_resource(self, resource_id: Union[str, int]) -> Optional[Dict]:
        """Lấy resource theo ID"""
        response, _ = self.get(f"/{resource_id}")
        return response.json() if response else None

    def get_resources(self, params: Dict[str, Any] = None) -> Optional[List]:
        """Lấy danh sách resources"""
        response, _ = self.get("/", params=params)
        return response.json() if response else None

    def create_resource(self, data: Dict[str, Any]) -> Optional[Dict]:
        """Tạo resource mới"""
        response, _ = self.post("/", json=data)
        return response.json() if response else None

    def update_resource(self, resource_id: Union[str, int], data: Dict[str, Any]) -> Optional[Dict]:
        """Cập nhật resource"""
        response, _ = self.put(f"/{resource_id}", json=data)
        return response.json() if response else None

    def patch_resource(self, resource_id: Union[str, int], data: Dict[str, Any]) -> Optional[Dict]:
        """Patch resource"""
        response, _ = self.patch(f"/{resource_id}", json=data)
        return response.json() if response else None

    def delete_resource(self, resource_id: Union[str, int]) -> bool:
        """Xóa resource"""
        response, _ = self.delete(f"/{resource_id}")
        return response is not None and response.status_code < 400

class GraphQLClient(APIClient):
    """GraphQL API Client"""

    def query(self, query: str, variables: Dict[str, Any] = None) -> Optional[Dict]:
        """Thực hiện GraphQL query"""
        payload = {'query': query}
        if variables:
            payload['variables'] = variables

        response, _ = self.post("/graphql", json=payload)
        return response.json() if response else None

    def mutation(self, mutation: str, variables: Dict[str, Any] = None) -> Optional[Dict]:
        """Thực hiện GraphQL mutation"""
        return self.query(mutation, variables)

class APIClientBuilder:
    """Builder pattern cho API Client"""

    def __init__(self):
        self.base_url = ""
        self.headers = {}
        self.auth_type = None
        self.auth_credentials = {}
        self.timeout = 30

    def set_base_url(self, url: str):
        self.base_url = url
        return self

    def add_header(self, key: str, value: str):
        self.headers[key] = value
        return self

    def set_basic_auth(self, username: str, password: str):
        self.auth_type = 'basic'
        self.auth_credentials = {'username': username, 'password': password}
        return self

    def set_bearer_auth(self, token: str):
        self.auth_type = 'bearer'
        self.auth_credentials = {'token': token}
        return self

    def set_api_key_auth(self, key: str, header_name: str = 'X-API-Key'):
        self.auth_type = 'api_key'
        self.auth_credentials = {'key': key, 'header_name': header_name}
        return self

    def set_timeout(self, timeout: int):
        self.timeout = timeout
        return self

    def build(self) -> APIClient:
        """Xây dựng API Client"""
        client = APIClient(self.base_url, self.headers)
        client.session.timeout = self.timeout

        if self.auth_type:
            client.set_auth(self.auth_type, self.auth_credentials)

        return client

def create_test_data_generator():
    """Tạo generator cho test data"""
    fake_names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown']
    fake_emails = ['john@example.com', 'jane@example.com', 'bob@example.com', 'alice@example.com']

    def generate_user(index: int) -> Dict[str, Any]:
        return {
            'name': f'{fake_names[index % len(fake_names)]} {index}',
            'email': f'user{index}@example.com',
            'age': 20 + (index % 50),
            'active': index % 2 == 0
        }

    return generate_user

def main():
    """Hàm chính"""
    parser = argparse.ArgumentParser(description='API Client và Testing Tool')
    parser.add_argument('url', help='Base URL của API')
    parser.add_argument('--auth', choices=['basic', 'bearer', 'apikey'], help='Loại authentication')
    parser.add_argument('--username', help='Username cho basic auth')
    parser.add_argument('--password', help='Password cho basic auth')
    parser.add_argument('--token', help='Token cho bearer auth')
    parser.add_argument('--api-key', help='API key')
    parser.add_argument('--test', action='store_true', help='Chạy test suite')
    parser.add_argument('--load-test', action='store_true', help='Chạy load test')
    parser.add_argument('--requests', type=int, default=100, help='Số requests cho load test')
    parser.add_argument('--concurrency', type=int, default=10, help='Số concurrent users')

    args = parser.parse_args()

    # Xây dựng client
    builder = APIClientBuilder().set_base_url(args.url)

    if args.auth:
        if args.auth == 'basic':
            if args.username and args.password:
                builder.set_basic_auth(args.username, args.password)
            else:
                print("❌ Cần username và password cho basic auth")
                return
        elif args.auth == 'bearer':
            if args.token:
                builder.set_bearer_auth(args.token)
            else:
                print("❌ Cần token cho bearer auth")
                return
        elif args.auth == 'apikey':
            if args.api_key:
                builder.set_api_key_auth(args.api_key)
            else:
                print("❌ Cần API key")
                return

    client = builder.build()

    if args.load_test:
        # Load testing
        print(f"🚀 Bắt đầu load test với {args.requests} requests...")
        stats = client.load_test("/", num_requests=args.requests, concurrency=args.concurrency)

        print("📊 Kết quả load test:")
        print(f"   Tổng requests: {stats['total_requests']}")
        print(f"   Requests thành công: {stats['successful_requests']}")
        print(f"   Requests thất bại: {stats['failed_requests']}")
        print(f"   Thời gian trung bình: {stats['avg_response_time']:.2f}ms")
        print(f"   RPS: {stats['requests_per_second']:.2f}")

    elif args.test:
        # Chạy test suite
        print("🧪 Chạy test suite...")

        # Định nghĩa các test cases
        tests = [
            {
                'name': 'GET Root',
                'endpoint': '/',
                'expected_status': 200,
                'delay': 0.5
            },
            {
                'name': 'GET Users',
                'endpoint': '/users',
                'expected_status': 200,
                'delay': 0.5
            },
            {
                'name': 'POST Create User',
                'endpoint': '/users',
                'expected_status': 201,
                'delay': 0.5
            },
            {
                'name': 'GET Non-existent Resource',
                'endpoint': '/nonexistent',
                'expected_status': 404,
                'delay': 0.5
            }
        ]

        summary = client.run_test_suite(tests)

        print("📋 Kết quả test suite:")
        print(f"   Tổng số test: {summary['total_tests']}")
        print(f"   Test passed: {summary['passed_tests']}")
        print(f"   Test failed: {summary['failed_tests']}")
        print(f"   Thời gian tổng: {summary['total_time']:.2f}s")

        # Xuất kết quả
        client.export_results('test_results.json')

    else:
        # Interactive mode
        print("🔧 Interactive API Client")
        print("Các lệnh có sẵn:")
        print("  get <endpoint> - GET request")
        print("  post <endpoint> <data> - POST request")
        print("  put <endpoint> <data> - PUT request")
        print("  delete <endpoint> - DELETE request")
        print("  test <endpoint> - Test endpoint")
        print("  history - Xem lịch sử requests")
        print("  results - Xem kết quả tests")
        print("  export <format> - Xuất dữ liệu")
        print("  quit - Thoát")

        while True:
            try:
                command = input("\n> ").strip()

                if not command:
                    continue

                if command == 'quit':
                    break

                parts = command.split()
                cmd = parts[0].lower()

                if cmd == 'get':
                    if len(parts) >= 2:
                        response, metrics = client.get(parts[1])
                        print(f"Status: {metrics.status_code}")
                        print(f"Time: {metrics.response_time:.2f}ms")
                        if response:
                            print("Response:", response.text[:200] + "..." if len(response.text) > 200 else response.text)

                elif cmd == 'post':
                    if len(parts) >= 3:
                        try:
                            data = json.loads(' '.join(parts[2:]))
                            response, metrics = client.post(parts[1], json=data)
                            print(f"Status: {metrics.status_code}")
                            print(f"Time: {metrics.response_time:.2f}ms")
                            if response:
                                print("Response:", response.text[:200] + "..." if len(response.text) > 200 else response.text)
                        except json.JSONDecodeError:
                            print("❌ Dữ liệu JSON không hợp lệ")

                elif cmd == 'put':
                    if len(parts) >= 3:
                        try:
                            data = json.loads(' '.join(parts[2:]))
                            response, metrics = client.put(parts[1], json=data)
                            print(f"Status: {metrics.status_code}")
                            print(f"Time: {metrics.response_time:.2f}ms")
                        except json.JSONDecodeError:
                            print("❌ Dữ liệu JSON không hợp lệ")

                elif cmd == 'delete':
                    if len(parts) >= 2:
                        response, metrics = client.delete(parts[1])
                        print(f"Status: {metrics.status_code}")
                        print(f"Time: {metrics.response_time:.2f}ms")

                elif cmd == 'test':
                    if len(parts) >= 2:
                        result = client.test_endpoint(parts[1])
                        print(f"Test '{result.test_name}': {'✅ PASS' if result.success else '❌ FAIL'}")
                        print(f"Status: {result.response.status_code}")
                        print(f"Time: {result.response.response_time:.2f}ms")

                elif cmd == 'history':
                    print(f"\n📜 Lịch sử requests ({len(client.request_history)}):")
                    for req in client.request_history[-10:]:  # Hiển thị 10 requests gần nhất
                        print(f"  {req['method']} {req['url']} - {req['status_code']} ({req['response_time']:.2f}ms)")

                elif cmd == 'results':
                    print(f"\n🧪 Kết quả tests ({len(client.test_results)}):")
                    for result in client.test_results[-10:]:  # Hiển thị 10 tests gần nhất
                        status = '✅ PASS' if result.success else '❌ FAIL'
                        print(f"  {result.test_name}: {status} ({result.response.status_code})")

                elif cmd == 'export':
                    if len(parts) >= 2:
                        client.export_results('exported_data.json', parts[1])

                else:
                    print("❌ Lệnh không hợp lệ")

            except KeyboardInterrupt:
                print("\n👋 Tạm biệt!")
                break
            except Exception as e:
                print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    main()
