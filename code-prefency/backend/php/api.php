<?php
/**
 * PHP Laravel-style backend API
 * Modern PHP development with best practices
 */

// Enable error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration (in production, use environment variables)
define('DB_HOST', 'localhost');
define('DB_NAME', 'user_management');
define('DB_USER', 'root');
define('DB_PASS', 'password');

// Simple PDO database connection
class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
                DB_USER,
                DB_PASS
            );
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->handleError('Database connection failed: ' . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }
}

// User model class
class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll($limit = 10, $offset = 0) {
        $stmt = $this->db->prepare("
            SELECT id, name, email, role, is_active, created_at, preferences
            FROM users
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByEmail($email) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create($data) {
        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, role, is_active, created_at, preferences)
            VALUES (:name, :email, :role, :is_active, NOW(), :preferences)
        ");

        $preferences = isset($data['preferences']) ?
            json_encode($data['preferences']) : '{"theme":"light","notifications":true}';

        $stmt->bindValue(':name', $data['name'], PDO::PARAM_STR);
        $stmt->bindValue(':email', $data['email'], PDO::PARAM_STR);
        $stmt->bindValue(':role', $data['role'] ?? 'user', PDO::PARAM_STR);
        $stmt->bindValue(':is_active', true, PDO::PARAM_BOOL);
        $stmt->bindValue(':preferences', $preferences, PDO::PARAM_STR);

        if ($stmt->execute()) {
            return $this->findById($this->db->lastInsertId());
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $values = [];

        if (isset($data['name'])) {
            $fields[] = 'name = :name';
            $values[':name'] = $data['name'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = :email';
            $values[':email'] = $data['email'];
        }
        if (isset($data['role'])) {
            $fields[] = 'role = :role';
            $values[':role'] = $data['role'];
        }
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = :is_active';
            $values[':is_active'] = $data['is_active'];
        }
        if (isset($data['preferences'])) {
            $fields[] = 'preferences = :preferences';
            $values[':preferences'] = json_encode($data['preferences']);
        }

        if (empty($fields)) {
            return false;
        }

        $values[':id'] = $id;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        foreach ($values as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        return $stmt->execute() ? $this->findById($id) : false;
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getStats() {
        $stmt = $this->db->query("
            SELECT
                COUNT(*) as total_users,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
                SUM(CASE WHEN role = 'moderator' THEN 1 ELSE 0 END) as moderator_count,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count
            FROM users
        ");
        return $stmt->fetch();
    }
}

// Input validation functions
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validateRole($role) {
    return in_array($role, ['admin', 'moderator', 'user']);
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Request routing
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// Remove query string from request
$request = explode('?', $request)[0];

// Simple routing (in production, use a proper router like Laravel's)
$userModel = new User();

try {
    switch (true) {
        case preg_match('/\/api\/users$/', $request) && $method === 'GET':
            // GET /api/users - Get all users
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $users = $userModel->getAll($limit, $offset);
            echo json_encode(['success' => true, 'data' => $users]);
            break;

        case preg_match('/\/api\/users\/(\d+)$/', $request, $matches) && $method === 'GET':
            // GET /api/users/{id} - Get user by ID
            $id = (int)$matches[1];
            $user = $userModel->findById($id);
            if ($user) {
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
            }
            break;

        case preg_match('/\/api\/users$/', $request) && $method === 'POST':
            // POST /api/users - Create new user
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
                break;
            }

            // Validate required fields
            if (empty($input['name']) || empty($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Name and email are required']);
                break;
            }

            $input['name'] = sanitizeInput($input['name']);
            $input['email'] = sanitizeInput($input['email']);

            if (!validateEmail($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid email format']);
                break;
            }

            if (isset($input['role']) && !validateRole($input['role'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid role']);
                break;
            }

            // Check if email already exists
            if ($userModel->findByEmail($input['email'])) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Email already exists']);
                break;
            }

            $user = $userModel->create($input);
            if ($user) {
                http_response_code(201);
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to create user']);
            }
            break;

        case preg_match('/\/api\/users\/(\d+)$/', $request, $matches) && $method === 'PUT':
            // PUT /api/users/{id} - Update user
            $id = (int)$matches[1];
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
                break;
            }

            // Check if user exists
            if (!$userModel->findById($id)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
                break;
            }

            // Validate email if provided
            if (isset($input['email'])) {
                $input['email'] = sanitizeInput($input['email']);
                if (!validateEmail($input['email'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Invalid email format']);
                    break;
                }

                // Check if email already exists (excluding current user)
                $existingUser = $userModel->findByEmail($input['email']);
                if ($existingUser && $existingUser['id'] !== $id) {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'error' => 'Email already exists']);
                    break;
                }
            }

            if (isset($input['role']) && !validateRole($input['role'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid role']);
                break;
            }

            $user = $userModel->update($id, $input);
            if ($user) {
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update user']);
            }
            break;

        case preg_match('/\/api\/users\/(\d+)$/', $request, $matches) && $method === 'DELETE':
            // DELETE /api/users/{id} - Delete user
            $id = (int)$matches[1];

            if ($userModel->delete($id)) {
                echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
            }
            break;

        case preg_match('/\/api\/stats$/', $request) && $method === 'GET':
            // GET /api/stats - Get statistics
            $stats = $userModel->getStats();
            echo json_encode(['success' => true, 'data' => $stats]);
            break;

        case preg_match('/\/health$/', $request) && $method === 'GET':
            // GET /health - Health check
            echo json_encode([
                'status' => 'healthy',
                'timestamp' => date('c'),
                'version' => '1.0.0',
                'php_version' => PHP_VERSION
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
            break;
    }

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
?>
