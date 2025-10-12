<?php
/**
 * PHP Middleware và Security System
 * HTTP middleware, security headers, và protection mechanisms
 */

require_once 'config.php';
require_once 'auth.php';

class Middleware {
    private $middlewares = [];
    private $request;

    public function __construct() {
        $this->request = $_SERVER;
    }

    public function add($middleware) {
        $this->middlewares[] = $middleware;
        return $this;
    }

    public function run() {
        foreach ($this->middlewares as $middleware) {
            if (is_callable($middleware)) {
                $result = call_user_func($middleware, $this->request);
                if ($result === false) {
                    return false; // Stop execution
                }
            }
        }
        return true;
    }

    public function pipe($handler) {
        $this->run();
        return call_user_func($handler, $this->request);
    }
}

class Security {
    public static function setSecurityHeaders() {
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');

        // Enable XSS protection
        header('X-XSS-Protection: 1; mode=block');

        // Prevent clickjacking
        header('X-Frame-Options: SAMEORIGIN');

        // Force HTTPS in production
        if (config('app.environment') === 'production') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        // Content Security Policy
        $csp = "default-src 'self'; ";
        $csp .= "script-src 'self' 'unsafe-inline' 'unsafe-eval'; ";
        $csp .= "style-src 'self' 'unsafe-inline'; ";
        $csp .= "img-src 'self' data: https:; ";
        $csp .= "font-src 'self' https://fonts.gstatic.com; ";
        $csp .= "connect-src 'self'";
        header("Content-Security-Policy: " . $csp);

        // Referrer Policy
        header('Referrer-Policy: strict-origin-when-cross-origin');

        // Permissions Policy
        header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    }

    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }

        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');

        return $data;
    }

    public static function validateCSRF() {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if (empty($token)) {
            throw new SecurityException('CSRF token missing');
        }

        if (!hash_equals($_SESSION['csrf_token'], $token)) {
            throw new SecurityException('Invalid CSRF token');
        }

        return true;
    }

    public static function generateCSRFToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function encrypt($data, $key = null) {
        $key = $key ?: config('security.encryption_key');
        $iv = random_bytes(16);

        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);

        return base64_encode($iv . $encrypted);
    }

    public static function decrypt($data, $key = null) {
        $key = $key ?: config('security.encryption_key');

        $data = base64_decode($data);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);

        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }

    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    public static function generateSecureToken($length = 32) {
        return bin2hex(random_bytes($length));
    }

    public static function validateToken($token, $purpose = 'general') {
        // Check token format
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            return false;
        }

        // Check token expiration (simplified)
        // In production, store tokens in database with expiration
        return true;
    }

    public static function rateLimit($identifier, $maxAttempts = 100, $windowSeconds = 3600) {
        $key = 'rate_limit:' . $identifier;
        $attempts = config()->cache($key, 0);

        if ($attempts >= $maxAttempts) {
            $resetTime = config()->cache($key . ':reset', 0);
            if (time() < $resetTime) {
                throw new SecurityException('Rate limit exceeded');
            } else {
                // Reset attempts
                config()->cache($key, 0);
                config()->cache($key . ':reset', 0);
            }
        }

        config()->cache($key, $attempts + 1);

        if ($attempts + 1 >= $maxAttempts) {
            $resetTime = time() + $windowSeconds;
            config()->cache($key . ':reset', $resetTime);
        }
    }

    public static function detectSQLInjection($input) {
        $patterns = [
            '/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i',
            '/(\b(script|javascript|vbscript|onload|onerror|onclick|onmouseover)\b)/i',
            '/(\bor\b\s+\d+\s*=\s*\d+)/i',
            '/(\band\b\s+\d+\s*=\s*\d+)/i',
            '/(\-\-|\#|\/\*|\*\/)/',
            '/(\b(xp_|sp_|fn_|sys\.))/i'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }

    public static function detectXSS($input) {
        $patterns = [
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<iframe\b[^>]*>/i',
            '/<object\b[^>]*>/i',
            '/<embed\b[^>]*>/i',
            '/<link\b[^>]*>/i',
            '/<meta\b[^>]*>/i'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }

    public static function logSecurityEvent($event, $details = []) {
        $logEntry = [
            'event' => $event,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'timestamp' => date('Y-m-d H:i:s'),
            'details' => $details
        ];

        $logFile = storage_path('logs/security.log');
        $logDir = dirname($logFile);

        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND);
    }
}

class SecurityException extends Exception {}

// Input validation and sanitization middleware
function input_validation_middleware($request) {
    // Sanitize all input data
    $_GET = array_map([Security::class, 'sanitizeInput'], $_GET);
    $_POST = array_map([Security::class, 'sanitizeInput'], $_POST);
    $_REQUEST = array_map([Security::class, 'sanitizeInput'], $_REQUEST);

    // Check for SQL injection
    foreach ($_REQUEST as $key => $value) {
        if (Security::detectSQLInjection($value)) {
            Security::logSecurityEvent('sql_injection_attempt', [
                'parameter' => $key,
                'value' => substr($value, 0, 100)
            ]);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input detected']);
            return false;
        }
    }

    // Check for XSS
    foreach ($_REQUEST as $key => $value) {
        if (Security::detectXSS($value)) {
            Security::logSecurityEvent('xss_attempt', [
                'parameter' => $key,
                'value' => substr($value, 0, 100)
            ]);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input detected']);
            return false;
        }
    }

    return true;
}

// CSRF protection middleware
function csrf_protection_middleware($request) {
    $csrfToken = Security::generateCSRFToken();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            Security::validateCSRF();
        } catch (SecurityException $e) {
            Security::logSecurityEvent('csrf_violation', [
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'referer' => $_SERVER['HTTP_REFERER'] ?? ''
            ]);

            http_response_code(403);
            echo json_encode(['error' => 'CSRF token validation failed']);
            return false;
        }
    }

    // Add CSRF token to globals for templates
    $GLOBALS['csrf_token'] = $csrfToken;

    return true;
}

// Rate limiting middleware
function rate_limiting_middleware($request) {
    $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $endpoint = $_SERVER['REQUEST_URI'];

    // Different limits for different endpoints
    $limits = [
        '/api/login' => [5, 300], // 5 attempts per 5 minutes
        '/api/register' => [3, 3600], // 3 attempts per hour
        '/api/' => [100, 3600], // 100 requests per hour for API
        '/' => [1000, 3600] // 1000 requests per hour for web
    ];

    $limit = $limits[$endpoint] ?? $limits['/'];
    list($maxAttempts, $window) = $limit;

    try {
        Security::rateLimit($identifier . ':' . $endpoint, $maxAttempts, $window);
    } catch (SecurityException $e) {
        http_response_code(429);
        header('Retry-After: ' . ($window / 60));
        echo json_encode([
            'error' => 'Too many requests',
            'retry_after' => $window
        ]);
        return false;
    }

    return true;
}

// Authentication middleware
function authentication_middleware($request) {
    $auth = Auth::getInstance();

    // Public routes that don't require authentication
    $publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/api/login',
        '/api/register'
    ];

    $currentRoute = $_SERVER['REQUEST_URI'];

    foreach ($publicRoutes as $route) {
        if (str_starts_with($currentRoute, $route)) {
            return true;
        }
    }

    // Check authentication
    if (!$auth->check()) {
        if (str_starts_with($currentRoute, '/api/')) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
        } else {
            header('Location: /login');
        }
        return false;
    }

    return true;
}

// Logging middleware
function logging_middleware($request) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI'],
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'user_id' => auth()->id(),
        'status_code' => http_response_code()
    ];

    $logFile = storage_path('logs/access.log');
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND);

    return true;
}

// API versioning middleware
function api_versioning_middleware($request) {
    $path = $_SERVER['REQUEST_URI'];

    if (preg_match('/^\/api\/v(\d+)\//', $path, $matches)) {
        $version = $matches[1];

        // Check if version is supported
        $supportedVersions = ['1', '2'];

        if (!in_array($version, $supportedVersions)) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Unsupported API version',
                'supported_versions' => $supportedVersions
            ]);
            return false;
        }

        // Set version in request context
        $_REQUEST['api_version'] = $version;
    }

    return true;
}

// Request validation middleware
function request_validation_middleware($request) {
    // Validate request size
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
    $maxSize = 10 * 1024 * 1024; // 10MB

    if ($contentLength > $maxSize) {
        http_response_code(413);
        echo json_encode(['error' => 'Request too large']);
        return false;
    }

    // Validate content type for API requests
    if (str_starts_with($_SERVER['REQUEST_URI'], '/api/')) {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            if (!str_contains($contentType, 'application/json') &&
                !str_contains($contentType, 'multipart/form-data')) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid content type']);
                return false;
            }
        }
    }

    return true;
}

// Error handling middleware
function error_handling_middleware($request) {
    // Set error handler
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        if (!(error_reporting() & $errno)) {
            return;
        }

        Security::logSecurityEvent('php_error', [
            'error_number' => $errno,
            'error_string' => $errstr,
            'error_file' => $errfile,
            'error_line' => $errline
        ]);

        if (config('app.debug')) {
            throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
        }
    });

    // Set exception handler
    set_exception_handler(function($exception) {
        Security::logSecurityEvent('uncaught_exception', [
            'exception' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine()
        ]);

        if (config('app.debug')) {
            echo "<pre>";
            echo "Uncaught Exception: " . $exception->getMessage() . "\n";
            echo "File: " . $exception->getFile() . ":" . $exception->getLine() . "\n";
            echo "Stack trace:\n" . $exception->getTraceAsString();
            echo "</pre>";
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    });

    return true;
}

// Maintenance mode middleware
function maintenance_mode_middleware($request) {
    $maintenanceFile = storage_path('maintenance');

    if (file_exists($maintenanceFile)) {
        $maintenanceData = json_decode(file_get_contents($maintenanceFile), true);

        // Check if current IP is allowed
        $allowedIps = $maintenanceData['allowed_ips'] ?? [];
        $currentIp = $_SERVER['REMOTE_ADDR'] ?? '';

        if (!in_array($currentIp, $allowedIps)) {
            $message = $maintenanceData['message'] ?? 'Site is under maintenance';
            $retryAfter = $maintenanceData['retry_after'] ?? 3600;

            http_response_code(503);
            header('Retry-After: ' . $retryAfter);

            if (str_starts_with($_SERVER['REQUEST_URI'], '/api/')) {
                echo json_encode([
                    'error' => 'Service unavailable',
                    'message' => $message
                ]);
            } else {
                echo "<h1>Maintenance Mode</h1>";
                echo "<p>{$message}</p>";
            }

            return false;
        }
    }

    return true;
}

// API response formatting middleware
function api_response_middleware($request) {
    if (!str_starts_with($_SERVER['REQUEST_URI'], '/api/')) {
        return true;
    }

    // Add API metadata to response
    $GLOBALS['api_response_meta'] = [
        'version' => $_REQUEST['api_version'] ?? '1',
        'timestamp' => date('c'),
        'request_id' => uniqid(),
        'method' => $_SERVER['REQUEST_METHOD'],
        'endpoint' => $_SERVER['REQUEST_URI']
    ];

    return true;
}

// Request timing middleware
function timing_middleware($request) {
    $GLOBALS['request_start_time'] = microtime(true);
    return true;
}

// Response timing middleware
function response_timing_middleware($response) {
    if (isset($GLOBALS['request_start_time'])) {
        $executionTime = (microtime(true) - $GLOBALS['request_start_time']) * 1000;
        header('X-Execution-Time: ' . round($executionTime, 2) . 'ms');
    }

    return true;
}

// Content compression middleware
function compression_middleware($request) {
    if (isset($_SERVER['HTTP_ACCEPT_ENCODING']) &&
        str_contains($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip')) {
        ob_start('ob_gzhandler');
    }

    return true;
}

// Cache control middleware
function cache_control_middleware($request) {
    $uri = $_SERVER['REQUEST_URI'];

    // Cache static assets
    if (preg_match('/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i', $uri)) {
        header('Cache-Control: public, max-age=31536000');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    }
    // No cache for API and dynamic content
    elseif (str_starts_with($uri, '/api/') || $_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }

    return true;
}

// Database connection middleware
function database_middleware($request) {
    try {
        // Test database connection
        DB()->select('SELECT 1');
        return true;
    } catch (Exception $e) {
        Security::logSecurityEvent('database_connection_failed', [
            'error' => $e->getMessage()
        ]);

        http_response_code(503);
        echo json_encode(['error' => 'Database unavailable']);
        return false;
    }
}

// File upload security middleware
function upload_security_middleware($request) {
    if (!isset($_FILES)) {
        return true;
    }

    $maxFileSize = 10 * 1024 * 1024; // 10MB
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    foreach ($_FILES as $file) {
        // Check file size
        if ($file['size'] > $maxFileSize) {
            throw new SecurityException('File too large');
        }

        // Check file type
        if (!in_array($file['type'], $allowedTypes)) {
            throw new SecurityException('File type not allowed');
        }

        // Check for malicious content
        if (Security::detectXSS(file_get_contents($file['tmp_name']))) {
            throw new SecurityException('Malicious content detected');
        }
    }

    return true;
}

// Initialize middleware stack
$middleware = new Middleware();

// Add security headers
$middleware->add(function($request) {
    Security::setSecurityHeaders();
    return true;
});

// Add error handling
$middleware->add('error_handling_middleware');

// Add maintenance mode check
$middleware->add('maintenance_mode_middleware');

// Add input validation
$middleware->add('input_validation_middleware');

// Add rate limiting
$middleware->add('rate_limiting_middleware');

// Add CSRF protection (for non-API routes)
$middleware->add(function($request) {
    if (!str_starts_with($_SERVER['REQUEST_URI'], '/api/')) {
        return csrf_protection_middleware($request);
    }
    return true;
});

// Add request validation
$middleware->add('request_validation_middleware');

// Add API versioning
$middleware->add('api_versioning_middleware');

// Add authentication (for protected routes)
$middleware->add('authentication_middleware');

// Add database connection check
$middleware->add('database_middleware');

// Add upload security
$middleware->add('upload_security_middleware');

// Add logging
$middleware->add('logging_middleware');

// Add timing
$middleware->add('timing_middleware');

// Add cache control
$middleware->add('cache_control_middleware');

// Add compression
$middleware->add('compression_middleware');

// Add API response formatting
$middleware->add('api_response_middleware');

// Example of using middleware:
// $middleware->pipe(function($request) {
//     // Your application logic here
//     echo json_encode(['message' => 'Hello World']);
// });

// Or run middleware independently:
// if ($middleware->run()) {
//     // Application logic
// }

// Global middleware function for easy use
function run_middleware() {
    global $middleware;
    return $middleware->run();
}

// Helper functions for templates
function csrf_token() {
    return Security::generateCSRFToken();
}

function csrf_field() {
    return '<input type="hidden" name="csrf_token" value="' . csrf_token() . '">';
}

function api_token() {
    $user = auth()->user();
    if ($user) {
        return JWT::encode(['user_id' => $user->id], 3600);
    }
    return null;
}

// Security utilities for templates
function secure_url($path) {
    $base = config('app.url');
    return $base . '/' . ltrim($path, '/');
}

function asset_url($path) {
    return secure_url('assets/' . $path);
}

function escape_html($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

// Example of protected route usage:
// Route::get('/admin', function() {
//     run_middleware();
//     Permission::require('admin.access');
//     echo "Admin panel";
// });

// API endpoint example:
// Route::post('/api/users', function() {
//     run_middleware();
//     Permission::require('user.create');
//     // Create user logic
// });
