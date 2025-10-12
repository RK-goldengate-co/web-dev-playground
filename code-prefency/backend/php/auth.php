<?php
/**
 * PHP Authentication và Authorization System
 * Complete authentication system với JWT, sessions, và role-based access control
 */

require_once 'config.php';
require_once 'database.php';

class AuthException extends Exception {}

class Auth {
    private static $instance = null;
    private $user = null;
    private $config;

    private function __construct() {
        $this->config = config('security');
        $this->startSession();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function attempt($credentials) {
        $user = User::findByEmail($credentials['email']);

        if (!$user) {
            throw new AuthException('Invalid credentials');
        }

        if (!$this->verifyPassword($credentials['password'], $user->password)) {
            throw new AuthException('Invalid credentials');
        }

        if (!$user->isActive()) {
            throw new AuthException('Account is not active');
        }

        $this->login($user);
        return true;
    }

    public function login($user) {
        $this->user = $user;

        // Set session data
        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_email'] = $user->email;
        $_SESSION['user_role'] = $user->role;
        $_SESSION['login_time'] = time();
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

        // Generate remember token if requested
        if (isset($_POST['remember']) && $_POST['remember']) {
            $this->createRememberToken($user);
        }

        // Update last login
        $user->last_login_at = date('Y-m-d H:i:s');
        $user->save();

        return true;
    }

    public function logout() {
        // Clear remember token
        if (isset($_COOKIE['remember_token'])) {
            $this->clearRememberToken($_COOKIE['remember_token']);
        }

        // Clear session
        session_unset();
        session_destroy();

        $this->user = null;
        return true;
    }

    public function user() {
        if ($this->user) {
            return $this->user;
        }

        // Check session
        if (isset($_SESSION['user_id'])) {
            $this->user = User::find($_SESSION['user_id']);
            return $this->user;
        }

        // Check remember token
        if (isset($_COOKIE['remember_token'])) {
            $user = $this->authenticateRememberToken($_COOKIE['remember_token']);
            if ($user) {
                $this->login($user);
                return $this->user;
            }
        }

        return null;
    }

    public function check() {
        return $this->user() !== null;
    }

    public function guest() {
        return !$this->check();
    }

    public function id() {
        $user = $this->user();
        return $user ? $user->id : null;
    }

    public function role() {
        $user = $this->user();
        return $user ? $user->role : null;
    }

    public function hasRole($role) {
        return $this->role() === $role;
    }

    public function can($permission) {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        $rolePermissions = $this->getRolePermissions($user->role);
        return in_array($permission, $rolePermissions);
    }

    private function getRolePermissions($role) {
        $permissions = [
            'admin' => [
                'user.create', 'user.read', 'user.update', 'user.delete',
                'product.create', 'product.read', 'product.update', 'product.delete',
                'order.read', 'order.update', 'system.admin'
            ],
            'moderator' => [
                'user.read', 'user.update',
                'product.read', 'product.update',
                'order.read', 'order.update'
            ],
            'user' => [
                'profile.read', 'profile.update', 'order.read'
            ]
        ];

        return $permissions[$role] ?? [];
    }

    private function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    private function createRememberToken($user) {
        $token = bin2hex(random_bytes(40));
        $hashedToken = hash('sha256', $token);

        // Store in database
        DB('user_tokens')->insert([
            'user_id' => $user->id,
            'token' => $hashedToken,
            'expires_at' => date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60)), // 30 days
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // Set cookie
        setcookie('remember_token', $token, [
            'expires' => time() + (30 * 24 * 60 * 60),
            'path' => '/',
            'httponly' => true,
            'secure' => isset($_SERVER['HTTPS']),
            'samesite' => 'Strict'
        ]);
    }

    private function authenticateRememberToken($token) {
        $hashedToken = hash('sha256', $token);

        $tokenRecord = DB('user_tokens')
            ->where('token', $hashedToken)
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->first();

        if (!$tokenRecord) {
            return null;
        }

        $user = User::find($tokenRecord['user_id']);
        return $user;
    }

    private function clearRememberToken($token) {
        $hashedToken = hash('sha256', $token);

        DB('user_tokens')
            ->where('token', $hashedToken)
            ->delete();
    }

    public function rateLimit($key, $maxAttempts = 5, $decayMinutes = 15) {
        $cacheKey = 'rate_limit:' . $key;
        $attempts = config()->cache($cacheKey, 0);

        if ($attempts >= $maxAttempts) {
            $resetTime = config()->cache($cacheKey . ':reset', 0);
            if (time() < $resetTime) {
                throw new AuthException('Too many attempts. Try again later.');
            } else {
                // Reset attempts
                config()->cache($cacheKey, 0);
                config()->cache($cacheKey . ':reset', 0);
            }
        }

        // Increment attempts
        config()->cache($cacheKey, $attempts + 1);

        if ($attempts + 1 >= $maxAttempts) {
            $resetTime = time() + ($decayMinutes * 60);
            config()->cache($cacheKey . ':reset', $resetTime);
        }
    }
}

class JWT {
    private static $secret;

    public static function setSecret($secret) {
        self::$secret = $secret;
    }

    public static function encode($payload, $exp = null) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        $payload['iat'] = time();
        if ($exp) {
            $payload['exp'] = time() + $exp;
        }

        $payload = json_encode($payload);

        $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::$secret, true);
        $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }

    public static function decode($token) {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new AuthException('Invalid JWT format');
        }

        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0])), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        $signature = $parts[2];

        // Verify signature
        $expectedSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret, true);
        $expectedSignatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));

        if ($signature !== $expectedSignatureEncoded) {
            throw new AuthException('Invalid JWT signature');
        }

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new AuthException('JWT expired');
        }

        return $payload;
    }

    public static function validate($token) {
        try {
            self::decode($token);
            return true;
        } catch (AuthException $e) {
            return false;
        }
    }
}

class Password {
    public static function hash($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public static function verify($password, $hash) {
        return password_verify($password, $hash);
    }

    public static function needsRehash($hash) {
        return password_needs_rehash($hash, PASSWORD_DEFAULT);
    }

    public static function generate($length = 12) {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        $password = '';

        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return $password;
    }
}

class TwoFactorAuth {
    private $secret;
    private $issuer = 'PHPApp';

    public function __construct($secret = null) {
        if ($secret) {
            $this->secret = $secret;
        } else {
            $this->secret = $this->generateSecret();
        }
    }

    private function generateSecret() {
        return base64_encode(random_bytes(32));
    }

    public function getQRCodeUrl($accountName, $issuer = null) {
        $issuer = $issuer ?: $this->issuer;
        $url = 'otpauth://totp/' . rawurlencode($issuer) . ':' . rawurlencode($accountName);
        $url .= '?secret=' . rawurlencode($this->secret) . '&issuer=' . rawurlencode($issuer);

        return $url;
    }

    public function verify($code) {
        $timeWindow = 30; // 30 seconds

        for ($i = -1; $i <= 1; $i++) {
            $time = floor(time() / $timeWindow) + $i;
            $expectedCode = $this->getCode($time);

            if (hash_equals($expectedCode, $code)) {
                return true;
            }
        }

        return false;
    }

    private function getCode($time) {
        $secret = base64_decode($this->secret);
        $time = pack('J', $time);

        $hmac = hash_hmac('sha1', $time, $secret, true);
        $offset = ord($hmac[19]) & 0xf;

        $code = (
            ((ord($hmac[$offset]) & 0x7f) << 24) |
            ((ord($hmac[$offset + 1]) & 0xff) << 16) |
            ((ord($hmac[$offset + 2]) & 0xff) << 8) |
            (ord($hmac[$offset + 3]) & 0xff)
        );

        return str_pad($code % 1000000, 6, '0', STR_PAD_LEFT);
    }

    public function getSecret() {
        return $this->secret;
    }
}

class OAuth2 {
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    private $authorizationUrl;
    private $tokenUrl;
    private $userInfoUrl;

    public function __construct($config = []) {
        $this->clientId = $config['client_id'] ?? '';
        $this->clientSecret = $config['client_secret'] ?? '';
        $this->redirectUri = $config['redirect_uri'] ?? '';
        $this->authorizationUrl = $config['authorization_url'] ?? '';
        $this->tokenUrl = $config['token_url'] ?? '';
        $this->userInfoUrl = $config['user_info_url'] ?? '';
    }

    public function getAuthorizationUrl($state = null) {
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile'
        ];

        if ($state) {
            $params['state'] = $state;
        }

        $query = http_build_query($params);
        return $this->authorizationUrl . '?' . $query;
    }

    public function exchangeCodeForToken($code) {
        $params = [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri
        ];

        $response = $this->makeRequest($this->tokenUrl, $params);

        if (isset($response['access_token'])) {
            return $response;
        }

        throw new AuthException('Failed to exchange code for token');
    }

    public function getUserInfo($accessToken) {
        $headers = [
            'Authorization: Bearer ' . $accessToken
        ];

        $response = $this->makeRequest($this->userInfoUrl, [], $headers);

        return $response;
    }

    public function refreshToken($refreshToken) {
        $params = [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token'
        ];

        $response = $this->makeRequest($this->tokenUrl, $params);

        return $response;
    }

    private function makeRequest($url, $params = [], $headers = []) {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            throw new AuthException('Curl error: ' . curl_error($ch));
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new AuthException('HTTP error: ' . $httpCode);
        }

        return json_decode($response, true);
    }
}

class SocialAuth {
    private $providers = [];

    public function __construct() {
        $this->providers = config('services');
    }

    public function authenticate($provider, $token) {
        switch ($provider) {
            case 'google':
                return $this->authenticateGoogle($token);
            case 'facebook':
                return $this->authenticateFacebook($token);
            case 'github':
                return $this->authenticateGithub($token);
            default:
                throw new AuthException('Unsupported provider');
        }
    }

    private function authenticateGoogle($token) {
        $url = 'https://www.googleapis.com/oauth2/v2/userinfo';
        $headers = ['Authorization: Bearer ' . $token];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    private function authenticateFacebook($token) {
        $url = 'https://graph.facebook.com/me?fields=id,name,email&access_token=' . $token;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    private function authenticateGithub($token) {
        $url = 'https://api.github.com/user';
        $headers = ['Authorization: token ' . $token];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}

class Permission {
    public static function check($permission) {
        $auth = Auth::getInstance();
        return $auth->can($permission);
    }

    public static function require($permission) {
        if (!self::check($permission)) {
            throw new AuthException('Insufficient permissions');
        }
    }

    public static function any($permissions) {
        $auth = Auth::getInstance();
        foreach ($permissions as $permission) {
            if ($auth->can($permission)) {
                return true;
            }
        }
        return false;
    }

    public static function all($permissions) {
        $auth = Auth::getInstance();
        foreach ($permissions as $permission) {
            if (!$auth->can($permission)) {
                return false;
            }
        }
        return true;
    }
}

// Middleware functions
function auth_middleware() {
    $auth = Auth::getInstance();

    if (!$auth->check()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

function guest_middleware() {
    $auth = Auth::getInstance();

    if ($auth->check()) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

function permission_middleware($permission) {
    Permission::require($permission);
}

function rate_limit_middleware($maxAttempts = 60, $decayMinutes = 1) {
    $auth = Auth::getInstance();
    $key = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    $auth->rateLimit($key, $maxAttempts, $decayMinutes);
}

function cors_middleware() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

// Global helper functions
function auth() {
    return Auth::getInstance();
}

function user() {
    return auth()->user();
}

function logged_in() {
    return auth()->check();
}

function has_role($role) {
    return auth()->hasRole($role);
}

function can($permission) {
    return Permission::check($permission);
}

// Initialize JWT secret
JWT::setSecret(config('app.key'));

// Example usage:
// try {
//     auth()->attempt(['email' => 'user@example.com', 'password' => 'password']);
//     $user = user();
//     echo "Logged in as: " . $user->name;
// } catch (AuthException $e) {
//     echo "Login failed: " . $e->getMessage();
// }

// JWT example:
// $token = JWT::encode(['user_id' => 1, 'role' => 'admin'], 3600);
// $payload = JWT::decode($token);

// Permission example:
// if (can('user.create')) {
//     // Create user
// }

// Middleware usage:
// auth_middleware(); // Require authentication
// permission_middleware('user.delete'); // Require specific permission
// rate_limit_middleware(5, 1); // Max 5 requests per minute
