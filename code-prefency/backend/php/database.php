<?php
/**
 * PHP Database Utilities và Simple ORM
 * Database abstraction layer với query builder và model system
 */

class Database {
    private static $instance = null;
    private $pdo;
    private $config;
    private $queryLog = [];

    private function __construct() {
        $this->config = ConfigManager::getInstance()->getDatabaseConfig();
        $this->connect();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function connect() {
        try {
            $config = $this->config;
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset']
            );

            $this->pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch (PDOException $e) {
            throw new DatabaseException("Connection failed: " . $e->getMessage());
        }
    }

    public function query($sql, $params = []) {
        $this->logQuery($sql, $params);

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt;
    }

    public function select($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function selectOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function insert($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $this->pdo->lastInsertId();
    }

    public function update($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    public function delete($sql, $params = []) {
        return $this->update($sql, $params);
    }

    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    public function commit() {
        return $this->pdo->commit();
    }

    public function rollBack() {
        return $this->pdo->rollBack();
    }

    public function getQueryLog() {
        return $this->queryLog;
    }

    private function logQuery($sql, $params) {
        $this->queryLog[] = [
            'sql' => $sql,
            'params' => $params,
            'timestamp' => microtime(true)
        ];

        // Keep only last 100 queries
        if (count($this->queryLog) > 100) {
            array_shift($this->queryLog);
        }
    }

    public function getLastQuery() {
        return end($this->queryLog);
    }

    public function getQueryCount() {
        return count($this->queryLog);
    }
}

class QueryBuilder {
    private $db;
    private $table;
    private $selects = ['*'];
    private $wheres = [];
    private $joins = [];
    private $orders = [];
    private $groups = [];
    private $havings = [];
    private $limit = null;
    private $offset = null;
    private $bindings = [];

    public function __construct($table = null) {
        $this->db = Database::getInstance();
        if ($table) {
            $this->table = $table;
        }
    }

    public function table($table) {
        $this->table = $table;
        return $this;
    }

    public function select($columns = ['*']) {
        $this->selects = is_array($columns) ? $columns : func_get_args();
        return $this;
    }

    public function selectRaw($expression) {
        $this->selects[] = new RawExpression($expression);
        return $this;
    }

    public function where($column, $operator = null, $value = null) {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->wheres[] = [
            'type' => 'basic',
            'column' => $column,
            'operator' => $operator,
            'value' => $value,
            'boolean' => 'and'
        ];

        $this->bindings[] = $value;
        return $this;
    }

    public function orWhere($column, $operator = null, $value = null) {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->wheres[] = [
            'type' => 'basic',
            'column' => $column,
            'operator' => $operator,
            'value' => $value,
            'boolean' => 'or'
        ];

        $this->bindings[] = $value;
        return $this;
    }

    public function whereIn($column, $values) {
        $this->wheres[] = [
            'type' => 'in',
            'column' => $column,
            'values' => $values,
            'boolean' => 'and'
        ];

        $this->bindings = array_merge($this->bindings, $values);
        return $this;
    }

    public function whereNull($column) {
        $this->wheres[] = [
            'type' => 'null',
            'column' => $column,
            'boolean' => 'and'
        ];
        return $this;
    }

    public function whereNotNull($column) {
        $this->wheres[] = [
            'type' => 'not_null',
            'column' => $column,
            'boolean' => 'and'
        ];
        return $this;
    }

    public function join($table, $first, $operator = null, $second = null) {
        if ($second === null) {
            $second = $operator;
            $operator = '=';
        }

        $this->joins[] = [
            'type' => 'inner',
            'table' => $table,
            'first' => $first,
            'operator' => $operator,
            'second' => $second
        ];

        return $this;
    }

    public function leftJoin($table, $first, $operator = null, $second = null) {
        if ($second === null) {
            $second = $operator;
            $operator = '=';
        }

        $this->joins[] = [
            'type' => 'left',
            'table' => $table,
            'first' => $first,
            'operator' => $operator,
            'second' => $second
        ];

        return $this;
    }

    public function orderBy($column, $direction = 'asc') {
        $this->orders[] = [
            'column' => $column,
            'direction' => strtolower($direction)
        ];
        return $this;
    }

    public function groupBy($columns) {
        $this->groups = is_array($columns) ? $columns : [$columns];
        return $this;
    }

    public function having($column, $operator, $value) {
        $this->havings[] = [
            'column' => $column,
            'operator' => $operator,
            'value' => $value
        ];
        $this->bindings[] = $value;
        return $this;
    }

    public function limit($limit) {
        $this->limit = $limit;
        return $this;
    }

    public function offset($offset) {
        $this->offset = $offset;
        return $this;
    }

    public function first() {
        $this->limit(1);
        $results = $this->get();
        return $results[0] ?? null;
    }

    public function get() {
        $sql = $this->buildSelect();
        return $this->db->select($sql, $this->bindings);
    }

    public function paginate($perPage = 15, $page = null) {
        $page = $page ?: ($_GET['page'] ?? 1);
        $offset = ($page - 1) * $perPage;

        // Get total count
        $countQuery = $this->buildCount();
        $total = $this->db->selectOne($countQuery, $this->bindings)['count'];

        // Get paginated results
        $this->limit($perPage)->offset($offset);
        $items = $this->get();

        return [
            'data' => $items,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => $perPage,
                'total' => (int)$total,
                'last_page' => ceil($total / $perPage),
                'from' => $offset + 1,
                'to' => min($offset + $perPage, $total)
            ]
        ];
    }

    private function buildSelect() {
        $sql = 'SELECT ' . implode(', ', $this->selects);
        $sql .= ' FROM ' . $this->table;

        if (!empty($this->joins)) {
            foreach ($this->joins as $join) {
                $sql .= ' ' . strtoupper($join['type']) . ' JOIN ' . $join['table'];
                $sql .= ' ON ' . $join['first'] . ' ' . $join['operator'] . ' ' . $join['second'];
            }
        }

        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . $this->buildWhereClause();
        }

        if (!empty($this->groups)) {
            $sql .= ' GROUP BY ' . implode(', ', $this->groups);
        }

        if (!empty($this->havings)) {
            $sql .= ' HAVING ' . $this->buildHavingClause();
        }

        if (!empty($this->orders)) {
            $sql .= ' ORDER BY ' . $this->buildOrderClause();
        }

        if ($this->limit) {
            $sql .= ' LIMIT ' . $this->limit;
        }

        if ($this->offset) {
            $sql .= ' OFFSET ' . $this->offset;
        }

        return $sql;
    }

    private function buildCount() {
        $sql = 'SELECT COUNT(*) as count FROM ' . $this->table;

        if (!empty($this->joins)) {
            foreach ($this->joins as $join) {
                $sql .= ' ' . strtoupper($join['type']) . ' JOIN ' . $join['table'];
                $sql .= ' ON ' . $join['first'] . ' ' . $join['operator'] . ' ' . $join['second'];
            }
        }

        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . $this->buildWhereClause();
        }

        return $sql;
    }

    private function buildWhereClause() {
        $clauses = [];

        foreach ($this->wheres as $where) {
            if ($where['type'] === 'basic') {
                $clauses[] = $where['column'] . ' ' . $where['operator'] . ' ?';
            } elseif ($where['type'] === 'in') {
                $placeholders = array_fill(0, count($where['values']), '?');
                $clauses[] = $where['column'] . ' IN (' . implode(', ', $placeholders) . ')';
            } elseif ($where['type'] === 'null') {
                $clauses[] = $where['column'] . ' IS NULL';
            } elseif ($where['type'] === 'not_null') {
                $clauses[] = $where['column'] . ' IS NOT NULL';
            }
        }

        return implode(' AND ', $clauses);
    }

    private function buildHavingClause() {
        $clauses = [];

        foreach ($this->havings as $having) {
            $clauses[] = $having['column'] . ' ' . $having['operator'] . ' ?';
        }

        return implode(' AND ', $clauses);
    }

    private function buildOrderClause() {
        $orders = [];

        foreach ($this->orders as $order) {
            $orders[] = $order['column'] . ' ' . $order['direction'];
        }

        return implode(', ', $orders);
    }

    public function insert($data) {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($data), '?');

        $sql = 'INSERT INTO ' . $this->table . ' (';
        $sql .= implode(', ', $columns);
        $sql .= ') VALUES (';
        $sql .= implode(', ', $placeholders);
        $sql .= ')';

        $values = array_values($data);
        $this->db->insert($sql, $values);

        return $this->db->pdo->lastInsertId();
    }

    public function update($data) {
        $setParts = [];
        $bindings = [];

        foreach ($data as $column => $value) {
            $setParts[] = $column . ' = ?';
            $bindings[] = $value;
        }

        $sql = 'UPDATE ' . $this->table . ' SET ';
        $sql .= implode(', ', $setParts);

        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . $this->buildWhereClause();
            $bindings = array_merge($bindings, array_slice($this->bindings, 0, count($this->wheres)));
        }

        return $this->db->update($sql, $bindings);
    }

    public function delete() {
        $sql = 'DELETE FROM ' . $this->table;

        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . $this->buildWhereClause();
        }

        return $this->db->delete($sql, array_slice($this->bindings, 0, count($this->wheres)));
    }

    public function exists() {
        $countQuery = $this->buildCount();
        $result = $this->db->selectOne($countQuery, $this->bindings);
        return $result['count'] > 0;
    }

    public function count() {
        $countQuery = $this->buildCount();
        $result = $this->db->selectOne($countQuery, $this->bindings);
        return $result['count'];
    }
}

class Model {
    protected $table;
    protected $primaryKey = 'id';
    protected $fillable = [];
    protected $hidden = [];
    protected $casts = [];
    protected $attributes = [];
    protected $original = [];
    protected $timestamps = true;

    public function __construct($attributes = []) {
        $this->attributes = $attributes;
        $this->original = $attributes;
    }

    public function __get($key) {
        return $this->getAttribute($key);
    }

    public function __set($key, $value) {
        $this->setAttribute($key, $value);
    }

    public function getAttribute($key) {
        if (isset($this->attributes[$key])) {
            $value = $this->attributes[$key];

            // Apply casting
            if (isset($this->casts[$key])) {
                $value = $this->castAttribute($key, $value);
            }

            return $value;
        }

        return null;
    }

    public function setAttribute($key, $value) {
        if (in_array($key, $this->fillable) || $this->fillable === ['*']) {
            $this->attributes[$key] = $value;
        }
    }

    private function castAttribute($key, $value) {
        $cast = $this->casts[$key];

        switch ($cast) {
            case 'int':
            case 'integer':
                return (int) $value;
            case 'float':
            case 'double':
            case 'decimal':
                return (float) $value;
            case 'string':
                return (string) $value;
            case 'bool':
            case 'boolean':
                return (bool) $value;
            case 'array':
            case 'json':
                return json_decode($value, true);
            case 'object':
                return json_decode($value);
            case 'datetime':
                return new DateTime($value);
            default:
                return $value;
        }
    }

    public static function query() {
        return new QueryBuilder(static::getTableName());
    }

    public static function find($id) {
        return static::query()
            ->where(static::getInstance()->primaryKey, $id)
            ->first();
    }

    public static function findOrFail($id) {
        $model = static::find($id);
        if (!$model) {
            throw new ModelNotFoundException("Model not found with ID: {$id}");
        }
        return $model;
    }

    public static function all() {
        return static::query()->get();
    }

    public static function create($attributes) {
        $model = new static($attributes);
        $model->save();
        return $model;
    }

    public function save() {
        if (isset($this->attributes[$this->primaryKey])) {
            // Update
            $query = static::query();
            foreach ($this->attributes as $key => $value) {
                if (in_array($key, $this->fillable) || $key === $this->primaryKey) {
                    $query->where($this->primaryKey, $this->attributes[$this->primaryKey]);
                }
            }
            $query->update($this->attributes);
        } else {
            // Insert
            $query = static::query();
            $id = $query->insert($this->attributes);
            $this->attributes[$this->primaryKey] = $id;
        }

        $this->original = $this->attributes;
        return true;
    }

    public function delete() {
        if (isset($this->attributes[$this->primaryKey])) {
            return static::query()
                ->where($this->primaryKey, $this->attributes[$this->primaryKey])
                ->delete();
        }
        return false;
    }

    public function toArray() {
        $array = $this->attributes;

        // Remove hidden attributes
        foreach ($this->hidden as $hidden) {
            unset($array[$hidden]);
        }

        return $array;
    }

    public function toJson() {
        return json_encode($this->toArray());
    }

    protected static function getTableName() {
        $className = static::class;
        $tableName = strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $className));

        // Remove namespace if present
        $tableName = basename(str_replace('\\', '/', $tableName));

        return $tableName;
    }

    private static function getInstance() {
        return new static();
    }
}

class User extends Model {
    protected $table = 'users';
    protected $fillable = ['name', 'email', 'password', 'role', 'is_active'];
    protected $hidden = ['password'];
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function isAdmin() {
        return $this->role === 'admin';
    }

    public function isActive() {
        return $this->is_active;
    }

    public static function findByEmail($email) {
        return static::query()
            ->where('email', $email)
            ->first();
    }

    public static function getActiveUsers() {
        return static::query()
            ->where('is_active', true)
            ->get();
    }
}

class Product extends Model {
    protected $table = 'products';
    protected $fillable = ['name', 'description', 'price', 'category_id', 'stock', 'is_active'];
    protected $casts = [
        'price' => 'float',
        'stock' => 'integer',
        'is_active' => 'boolean'
    ];

    public function category() {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function isInStock() {
        return $this->stock > 0;
    }

    public function getFormattedPrice() {
        return '$' . number_format($this->price, 2);
    }
}

class Category extends Model {
    protected $table = 'categories';
    protected $fillable = ['name', 'description', 'parent_id'];

    public function products() {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function parent() {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children() {
        return $this->hasMany(Category::class, 'parent_id');
    }
}

class RawExpression {
    public $expression;

    public function __construct($expression) {
        $this->expression = $expression;
    }

    public function __toString() {
        return $this->expression;
    }
}

// Relationship methods
trait HasRelationships {
    public function belongsTo($related, $foreignKey = null, $ownerKey = null) {
        $instance = new $related();
        $foreignKey = $foreignKey ?: strtolower($instance->getTableName()) . '_id';
        $ownerKey = $ownerKey ?: $instance->primaryKey;

        return new BelongsTo($this, $instance, $foreignKey, $ownerKey);
    }

    public function hasMany($related, $foreignKey = null, $localKey = null) {
        $instance = new $related();
        $foreignKey = $foreignKey ?: strtolower($this->getTableName()) . '_id';
        $localKey = $localKey ?: $this->primaryKey;

        return new HasMany($this, $instance, $foreignKey, $localKey);
    }

    public function hasOne($related, $foreignKey = null, $localKey = null) {
        $instance = new $related();
        $foreignKey = $foreignKey ?: strtolower($this->getTableName()) . '_id';
        $localKey = $localKey ?: $this->primaryKey;

        return new HasOne($this, $instance, $foreignKey, $localKey);
    }
}

// Relationship classes (simplified)
class BelongsTo {
    public function __construct($parent, $related, $foreignKey, $ownerKey) {
        $this->parent = $parent;
        $this->related = $related;
        $this->foreignKey = $foreignKey;
        $this->ownerKey = $ownerKey;
    }

    public function get() {
        return $this->related::query()
            ->where($this->ownerKey, $this->parent->{$this->foreignKey})
            ->first();
    }
}

class HasMany {
    public function __construct($parent, $related, $foreignKey, $localKey) {
        $this->parent = $parent;
        $this->related = $related;
        $this->foreignKey = $foreignKey;
        $this->localKey = $localKey;
    }

    public function get() {
        return $this->related::query()
            ->where($this->foreignKey, $this->parent->{$this->localKey})
            ->get();
    }
}

class HasOne {
    public function __construct($parent, $related, $foreignKey, $localKey) {
        $this->parent = $parent;
        $this->related = $related;
        $this->foreignKey = $foreignKey;
        $this->localKey = $localKey;
    }

    public function get() {
        return $this->related::query()
            ->where($this->foreignKey, $this->parent->{$this->localKey})
            ->first();
    }
}

// Exception classes
class DatabaseException extends Exception {}
class ModelNotFoundException extends Exception {}

// Migration system
class Migration {
    protected $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function createTable($tableName, $callback) {
        $blueprint = new Blueprint($tableName);
        $callback($blueprint);

        $sql = $blueprint->toSql();
        $this->db->query($sql);

        echo "Created table: {$tableName}\n";
    }

    public function dropTable($tableName) {
        $sql = "DROP TABLE IF EXISTS {$tableName}";
        $this->db->query($sql);

        echo "Dropped table: {$tableName}\n";
    }
}

class Blueprint {
    private $table;
    private $columns = [];
    private $indexes = [];

    public function __construct($table) {
        $this->table = $table;
    }

    public function id() {
        $this->columns[] = "id INT AUTO_INCREMENT PRIMARY KEY";
        return $this;
    }

    public function string($column, $length = 255) {
        $this->columns[] = "{$column} VARCHAR({$length})";
        return $this;
    }

    public function text($column) {
        $this->columns[] = "{$column} TEXT";
        return $this;
    }

    public function integer($column) {
        $this->columns[] = "{$column} INT";
        return $this;
    }

    public function decimal($column, $precision = 8, $scale = 2) {
        $this->columns[] = "{$column} DECIMAL({$precision}, {$scale})";
        return $this;
    }

    public function boolean($column) {
        $this->columns[] = "{$column} BOOLEAN";
        return $this;
    }

    public function timestamp($column) {
        $this->columns[] = "{$column} TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
        return $this;
    }

    public function timestamps() {
        $this->columns[] = "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
        $this->columns[] = "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
        return $this;
    }

    public function nullable() {
        $lastColumn = array_pop($this->columns);
        $this->columns[] = $lastColumn . " NULL";
        return $this;
    }

    public function index($columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $this->indexes[] = "INDEX (" . implode(', ', $columns) . ")";
        return $this;
    }

    public function unique($columns) {
        $columns = is_array($columns) ? $columns : [$columns];
        $this->indexes[] = "UNIQUE (" . implode(', ', $columns) . ")";
        return $this;
    }

    public function toSql() {
        $sql = "CREATE TABLE {$this->table} (\n";
        $sql .= implode(",\n", $this->columns);

        if (!empty($this->indexes)) {
            $sql .= ",\n" . implode(",\n", $this->indexes);
        }

        $sql .= "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        return $sql;
    }
}

// Global helper functions
function DB($table = null) {
    return new QueryBuilder($table);
}

// Example usage:
// $users = DB('users')->where('active', 1)->get();
// $user = User::find(1);
// $products = Product::all();
// $admin = User::findByEmail('admin@example.com');

// Migration example:
// $migration = new Migration();
// $migration->createTable('users', function($table) {
//     $table->id();
//     $table->string('name', 100);
//     $table->string('email', 255)->unique();
//     $table->string('password');
//     $table->boolean('active')->default(true);
//     $table->timestamps();
// });
