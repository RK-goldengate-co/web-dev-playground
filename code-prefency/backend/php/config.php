<?php
/**
 * PHP Configuration Management System
 * Centralized configuration với environment variables và caching
 */

class ConfigManager {
    private static $instance = null;
    private $config = [];
    private $cache = [];
    private $envFile = '.env';

    private function __construct() {
        $this->loadEnvironment();
        $this->loadConfiguration();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function loadEnvironment() {
        // Load .env file
        if (file_exists($this->envFile)) {
            $lines = file($this->envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
                    [$key, $value] = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);

                    // Remove quotes if present
                    if (str_starts_with($value, '"') && str_ends_with($value, '"')) {
                        $value = substr($value, 1, -1);
                    }

                    $_ENV[$key] = $value;
                    putenv("$key=$value");
                }
            }
        }
    }

    private function loadConfiguration() {
        $this->config = [
            'app' => [
                'name' => getenv('APP_NAME') ?: 'PHP Application',
                'version' => getenv('APP_VERSION') ?: '1.0.0',
                'environment' => getenv('APP_ENV') ?: 'development',
                'debug' => filter_var(getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOLEAN),
                'url' => getenv('APP_URL') ?: 'http://localhost',
                'key' => getenv('APP_KEY') ?: $this->generateAppKey(),
            ],

            'database' => [
                'default' => getenv('DB_CONNECTION') ?: 'mysql',
                'connections' => [
                    'mysql' => [
                        'host' => getenv('DB_HOST') ?: 'localhost',
                        'port' => getenv('DB_PORT') ?: 3306,
                        'database' => getenv('DB_DATABASE') ?: 'laravel',
                        'username' => getenv('DB_USERNAME') ?: 'root',
                        'password' => getenv('DB_PASSWORD') ?: '',
                        'charset' => getenv('DB_CHARSET') ?: 'utf8mb4',
                        'prefix' => getenv('DB_PREFIX') ?: '',
                        'options' => [
                            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                            PDO::ATTR_EMULATE_PREPARES => false,
                        ],
                    ],
                    'sqlite' => [
                        'database' => getenv('DB_DATABASE') ?: database_path('database.sqlite'),
                        'prefix' => getenv('DB_PREFIX') ?: '',
                        'options' => [
                            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        ],
                    ],
                ],
            ],

            'cache' => [
                'default' => getenv('CACHE_DRIVER') ?: 'file',
                'stores' => [
                    'file' => [
                        'driver' => 'file',
                        'path' => storage_path('cache'),
                    ],
                    'redis' => [
                        'driver' => 'redis',
                        'connection' => 'cache',
                    ],
                ],
            ],

            'session' => [
                'driver' => getenv('SESSION_DRIVER') ?: 'file',
                'lifetime' => getenv('SESSION_LIFETIME') ?: 120,
                'expire_on_close' => false,
                'encrypt' => false,
                'files' => storage_path('sessions'),
                'connection' => null,
                'table' => 'sessions',
                'store' => null,
                'lottery' => [2, 100],
                'cookie' => 'laravel_session',
                'path' => '/',
                'domain' => null,
                'secure' => false,
                'http_only' => true,
                'same_site' => 'lax',
            ],

            'mail' => [
                'default' => getenv('MAIL_MAILER') ?: 'smtp',
                'mailers' => [
                    'smtp' => [
                        'transport' => 'smtp',
                        'host' => getenv('MAIL_HOST') ?: 'smtp.mailgun.org',
                        'port' => getenv('MAIL_PORT') ?: 587,
                        'encryption' => getenv('MAIL_ENCRYPTION') ?: 'tls',
                        'username' => getenv('MAIL_USERNAME'),
                        'password' => getenv('MAIL_PASSWORD'),
                        'timeout' => null,
                        'local_domain' => getenv('MAIL_EHLO_DOMAIN'),
                    ],
                ],
                'from' => [
                    'address' => getenv('MAIL_FROM_ADDRESS') ?: 'hello@example.com',
                    'name' => getenv('MAIL_FROM_NAME') ?: 'Example',
                ],
            ],

            'logging' => [
                'default' => getenv('LOG_CHANNEL') ?: 'stack',
                'channels' => [
                    'stack' => [
                        'driver' => 'stack',
                        'channels' => ['single', 'daily'],
                    ],
                    'single' => [
                        'driver' => 'single',
                        'path' => storage_path('logs/laravel.log'),
                        'level' => getenv('LOG_LEVEL') ?: 'debug',
                    ],
                    'daily' => [
                        'driver' => 'daily',
                        'path' => storage_path('logs/laravel.log'),
                        'level' => getenv('LOG_LEVEL') ?: 'debug',
                        'days' => 14,
                    ],
                ],
            ],

            'security' => [
                'csrf_token' => $this->generateCsrfToken(),
                'encryption_key' => getenv('APP_KEY') ?: $this->generateEncryptionKey(),
                'session_cookie_secure' => filter_var(getenv('SESSION_SECURE') ?: false, FILTER_VALIDATE_BOOLEAN),
                'session_cookie_http_only' => true,
                'session_cookie_same_site' => 'lax',
            ],

            'api' => [
                'rate_limiting' => [
                    'enabled' => filter_var(getenv('API_RATE_LIMITING_ENABLED') ?: true, FILTER_VALIDATE_BOOLEAN),
                    'attempts' => (int)(getenv('API_RATE_LIMITING_ATTEMPTS') ?: 60),
                    'decay_minutes' => (int)(getenv('API_RATE_LIMITING_DECAY') ?: 1),
                ],
                'throttling' => [
                    'enabled' => filter_var(getenv('API_THROTTLING_ENABLED') ?: false, FILTER_VALIDATE_BOOLEAN),
                    'max_attempts' => (int)(getenv('API_THROTTLING_MAX_ATTEMPTS') ?: 10),
                    'decay_minutes' => (int)(getenv('API_THROTTLING_DECAY') ?: 1),
                ],
            ],

            'services' => [
                'google' => [
                    'client_id' => getenv('GOOGLE_CLIENT_ID'),
                    'client_secret' => getenv('GOOGLE_CLIENT_SECRET'),
                ],
                'facebook' => [
                    'client_id' => getenv('FACEBOOK_CLIENT_ID'),
                    'client_secret' => getenv('FACEBOOK_CLIENT_SECRET'),
                ],
                'github' => [
                    'client_id' => getenv('GITHUB_CLIENT_ID'),
                    'client_secret' => getenv('GITHUB_CLIENT_SECRET'),
                ],
            ],

            'filesystems' => [
                'default' => getenv('FILESYSTEM_DISK') ?: 'local',
                'disks' => [
                    'local' => [
                        'driver' => 'local',
                        'root' => storage_path('app'),
                        'throw' => false,
                    ],
                    'public' => [
                        'driver' => 'local',
                        'root' => storage_path('app/public'),
                        'url' => getenv('APP_URL') . '/storage',
                        'visibility' => 'public',
                        'throw' => false,
                    ],
                    's3' => [
                        'driver' => 's3',
                        'key' => getenv('AWS_ACCESS_KEY_ID'),
                        'secret' => getenv('AWS_SECRET_ACCESS_KEY'),
                        'region' => getenv('AWS_DEFAULT_REGION') ?: 'us-east-1',
                        'bucket' => getenv('AWS_BUCKET'),
                        'url' => getenv('AWS_URL'),
                        'endpoint' => getenv('AWS_ENDPOINT'),
                        'use_path_style_endpoint' => getenv('AWS_USE_PATH_STYLE_ENDPOINT') ?: false,
                        'throw' => false,
                    ],
                ],
            ],

            'broadcasting' => [
                'default' => getenv('BROADCAST_DRIVER') ?: 'null',
                'connections' => [
                    'pusher' => [
                        'driver' => 'pusher',
                        'key' => getenv('PUSHER_APP_KEY'),
                        'secret' => getenv('PUSHER_APP_SECRET'),
                        'app_id' => getenv('PUSHER_APP_ID'),
                        'options' => [
                            'cluster' => getenv('PUSHER_APP_CLUSTER') ?: 'mt1',
                            'encrypted' => true,
                            'host' => getenv('PUSHER_HOST') ?: 'api-' . (getenv('PUSHER_APP_CLUSTER') ?: 'mt1') . '.pusherapp.com',
                            'port' => getenv('PUSHER_PORT') ?: 443,
                            'scheme' => getenv('PUSHER_SCHEME') ?: 'https',
                        ],
                    ],
                ],
            ],

            'queue' => [
                'default' => getenv('QUEUE_CONNECTION') ?: 'sync',
                'connections' => [
                    'sync' => [
                        'driver' => 'sync',
                    ],
                    'database' => [
                        'driver' => 'database',
                        'table' => 'jobs',
                        'queue' => 'default',
                        'retry_after' => 90,
                        'after_commit' => false,
                    ],
                ],
            ],
        ];
    }

    private function generateAppKey() {
        return 'base64:' . base64_encode(random_bytes(32));
    }

    private function generateEncryptionKey() {
        return base64_encode(random_bytes(32));
    }

    private function generateCsrfToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public function get($key, $default = null) {
        $keys = explode('.', $key);
        $config = $this->config;

        foreach ($keys as $key) {
            if (isset($config[$key])) {
                $config = $config[$key];
            } else {
                return $default;
            }
        }

        return $config;
    }

    public function set($key, $value) {
        $keys = explode('.', $key);
        $config = &$this->config;

        for ($i = 0; $i < count($keys) - 1; $i++) {
            if (!isset($config[$keys[$i]])) {
                $config[$keys[$i]] = [];
            }
            $config = &$config[$keys[$i]];
        }

        $config[end($keys)] = $value;
    }

    public function has($key) {
        return $this->get($key) !== null;
    }

    public function all() {
        return $this->config;
    }

    public function getEnvironment() {
        return $this->get('app.environment');
    }

    public function isProduction() {
        return $this->get('app.environment') === 'production';
    }

    public function isDevelopment() {
        return $this->get('app.environment') === 'development';
    }

    public function isTesting() {
        return $this->get('app.environment') === 'testing';
    }

    public function getDatabaseConfig($connection = null) {
        $connection = $connection ?: $this->get('database.default');
        return $this->get("database.connections.{$connection}");
    }

    public function getMailConfig() {
        return $this->get('mail');
    }

    public function getCacheConfig() {
        return $this->get('cache');
    }

    public function getSecurityConfig() {
        return $this->get('security');
    }

    public function getApiConfig() {
        return $this->get('api');
    }

    public function getServicesConfig() {
        return $this->get('services');
    }

    public function getFilesystemConfig() {
        return $this->get('filesystems');
    }

    public function getBroadcastingConfig() {
        return $this->get('broadcasting');
    }

    public function getQueueConfig() {
        return $this->get('queue');
    }

    public function getLoggingConfig() {
        return $this->get('logging');
    }

    public function getAppConfig() {
        return $this->get('app');
    }

    public function getSessionConfig() {
        return $this->get('session');
    }

    // Environment helpers
    public function env($key, $default = null) {
        $value = getenv($key);

        if ($value === false) {
            return $default;
        }

        switch (strtolower($value)) {
            case 'true':
            case '(true)':
                return true;
            case 'false':
            case '(false)':
                return false;
            case 'empty':
            case '(empty)':
                return '';
            case 'null':
            case '(null)':
                return null;
        }

        return $value;
    }

    // Caching methods
    public function cache($key, $value = null, $ttl = null) {
        if ($value === null) {
            return $this->getCache($key);
        }

        return $this->setCache($key, $value, $ttl);
    }

    private function getCache($key) {
        // Simple file-based cache implementation
        $cacheFile = storage_path('cache/' . md5($key) . '.cache');

        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true);

            if ($data && isset($data['expires']) && $data['expires'] > time()) {
                return $data['value'];
            }

            // Remove expired cache
            unlink($cacheFile);
        }

        return null;
    }

    private function setCache($key, $value, $ttl = null) {
        $cacheDir = storage_path('cache');
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }

        $cacheFile = $cacheDir . '/' . md5($key) . '.cache';
        $expires = $ttl ? time() + $ttl : null;

        $data = [
            'value' => $value,
            'expires' => $expires,
            'created' => time()
        ];

        return file_put_contents($cacheFile, json_encode($data)) !== false;
    }

    public function clearCache($key = null) {
        if ($key) {
            $cacheFile = storage_path('cache/' . md5($key) . '.cache');
            if (file_exists($cacheFile)) {
                return unlink($cacheFile);
            }
        } else {
            // Clear all cache
            $cacheDir = storage_path('cache');
            if (is_dir($cacheDir)) {
                $files = glob($cacheDir . '/*.cache');
                foreach ($files as $file) {
                    unlink($file);
                }
                return true;
            }
        }

        return false;
    }

    // Validation methods
    public function validateEnvironment() {
        $errors = [];

        // Check required environment variables
        $required = [
            'APP_NAME',
            'APP_KEY',
            'DB_CONNECTION',
        ];

        foreach ($required as $key) {
            if (!$this->env($key)) {
                $errors[] = "Missing required environment variable: {$key}";
            }
        }

        // Check database connection
        if (!$this->testDatabaseConnection()) {
            $errors[] = "Cannot connect to database";
        }

        return $errors;
    }

    private function testDatabaseConnection() {
        try {
            $config = $this->getDatabaseConfig();
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset']
            );

            $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    // Configuration export
    public function exportToJson($file = null) {
        $data = [
            'config' => $this->config,
            'environment' => $_ENV,
            'exported_at' => date('Y-m-d H:i:s')
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        if ($file) {
            return file_put_contents($file, $json) !== false;
        }

        return $json;
    }

    public function exportToEnv($file = null) {
        $content = "# Generated environment file\n";
        $content .= "# Generated at: " . date('Y-m-d H:i:s') . "\n\n";

        foreach ($_ENV as $key => $value) {
            if (is_string($value) && !str_contains($key, 'PASSWORD')) {
                $content .= "{$key}={$value}\n";
            }
        }

        if ($file) {
            return file_put_contents($file, $content) !== false;
        }

        return $content;
    }

    // Helper methods for paths
    public function app_path($path = '') {
        return base_path('app' . ($path ? '/' . $path : ''));
    }

    public function config_path($path = '') {
        return base_path('config' . ($path ? '/' . $path : ''));
    }

    public function database_path($path = '') {
        return base_path('database' . ($path ? '/' . $path : ''));
    }

    public function storage_path($path = '') {
        return base_path('storage' . ($path ? '/' . $path : ''));
    }

    public function public_path($path = '') {
        return base_path('public' . ($path ? '/' . $path : ''));
    }

    public function resource_path($path = '') {
        return base_path('resources' . ($path ? '/' . $path : ''));
    }
}

// Global helper functions
function config($key, $default = null) {
    return ConfigManager::getInstance()->get($key, $default);
}

function env($key, $default = null) {
    return ConfigManager::getInstance()->env($key, $default);
}

function app_path($path = '') {
    return ConfigManager::getInstance()->app_path($path);
}

function config_path($path = '') {
    return ConfigManager::getInstance()->config_path($path);
}

function database_path($path = '') {
    return ConfigManager::getInstance()->database_path($path);
}

function storage_path($path = '') {
    return ConfigManager::getInstance()->storage_path($path);
}

function public_path($path = '') {
    return ConfigManager::getInstance()->public_path($path);
}

function resource_path($path = '') {
    return ConfigManager::getInstance()->resource_path($path);
}

function base_path($path = '') {
    return __DIR__ . ($path ? '/' . $path : '');
}

// Initialize configuration
$config = ConfigManager::getInstance();

// Example usage:
// echo config('app.name'); // Get app name
// echo config('database.connections.mysql.host'); // Get database host
// echo env('APP_DEBUG'); // Get environment variable
// config('app.debug', true); // Set configuration value

// Export configuration for debugging
if (config('app.debug')) {
    // Uncomment to export configuration for debugging
    // file_put_contents('config_export.json', $config->exportToJson());
}
