// Go (Golang) REST API with Gin framework
package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/lib/pq"
    _ "github.com/lib/pq"
)

// Database configuration
const (
    host     = "localhost"
    port     = 5432
    user     = "postgres"
    password = "password"
    dbname   = "user_management"
)

// User struct
type User struct {
    ID          int       `json:"id" db:"id"`
    Name        string    `json:"name" db:"name" binding:"required,min=2,max=100"`
    Email       string    `json:"email" db:"email" binding:"required,email"`
    Role        string    `json:"role" db:"role" binding:"required,oneof=admin moderator user"`
    IsActive    bool      `json:"is_active" db:"is_active"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
    Preferences string    `json:"preferences" db:"preferences"`
}

// API Response struct
type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Message string      `json:"message,omitempty"`
}

// Pagination struct
type Pagination struct {
    Page       int `json:"page"`
    Limit      int `json:"limit"`
    Total      int `json:"total"`
    TotalPages int `json:"total_pages"`
}

// UserStats struct
type UserStats struct {
    TotalUsers      int            `json:"total_users"`
    ActiveUsers     int            `json:"active_users"`
    InactiveUsers   int            `json:"inactive_users"`
    RoleDistribution map[string]int `json:"role_distribution"`
}

// Database connection
var db *sql.DB

func initDB() {
    var err error
    db, err = sql.Open("postgres", "host="+host+" port="+strconv.Itoa(port)+" user="+user+" password="+password+" dbname="+dbname+" sslmode=disable")
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    if err = db.Ping(); err != nil {
        log.Fatal("Failed to ping database:", err)
    }

    // Create users table if not exists
    createTableSQL := `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            preferences TEXT NOT NULL DEFAULT '{}'
        );`
    _, err = db.Exec(createTableSQL)
    if err != nil {
        log.Fatal("Failed to create table:", err)
    }
}

// Get all users with pagination and filtering
func getUsers(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    role := c.Query("role")
    search := c.Query("search")

    offset := (page - 1) * limit

    // Build query
    query := "SELECT id, name, email, role, is_active, created_at, preferences FROM users WHERE 1=1"
    args := []interface{}{}
    argCount := 0

    if role != "" {
        argCount++
        query += " AND role = $" + strconv.Itoa(argCount)
        args = append(args, role)
    }

    if search != "" {
        argCount++
        query += " AND (name ILIKE $" + strconv.Itoa(argCount) + " OR email ILIKE $" + strconv.Itoa(argCount) + ")"
        args = append(args, "%"+search+"%")
    }

    query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argCount+1) + " OFFSET $" + strconv.Itoa(argCount+2)
    args = append(args, limit, offset)

    rows, err := db.Query(query, args...)
    if err != nil {
        c.JSON(http.StatusInternalServerError, APIResponse{Success: false, Error: "Failed to fetch users"})
        return
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.Preferences)
        if err != nil {
            continue
        }
        users = append(users, user)
    }

    // Get total count
    countQuery := "SELECT COUNT(*) FROM users WHERE 1=1"
    countArgs := []interface{}{}
    if role != "" {
        countQuery += " AND role = $1"
        countArgs = append(countArgs, role)
    }
    if search != "" {
        countQuery += " AND (name ILIKE $2 OR email ILIKE $2)"
    }

    var total int
    err = db.QueryRow(countQuery, countArgs...).Scan(&total)
    if err != nil {
        total = 0
    }

    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data: users,
        Message: "Users retrieved successfully",
    })
}

// Get user by ID
func getUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{Success: false, Error: "Invalid user ID"})
        return
    }

    var user User
    err = db.QueryRow("SELECT id, name, email, role, is_active, created_at, preferences FROM users WHERE id = $1", id).
        Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &user.Preferences)

    if err != nil {
        c.JSON(http.StatusNotFound, APIResponse{Success: false, Error: "User not found"})
        return
    }

    c.JSON(http.StatusOK, APIResponse{Success: true, Data: user})
}

// Create new user
func createUser(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{Success: false, Error: err.Error()})
        return
    }

    // Check if email already exists
    var existingID int
    err := db.QueryRow("SELECT id FROM users WHERE email = $1", user.Email).Scan(&existingID)
    if err == nil {
        c.JSON(http.StatusConflict, APIResponse{Success: false, Error: "Email already exists"})
        return
    }

    // Insert new user
    err = db.QueryRow(
        "INSERT INTO users (name, email, role, is_active, created_at, preferences) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        user.Name, user.Email, user.Role, user.IsActive, time.Now(), user.Preferences,
    ).Scan(&user.ID)

    if err != nil {
        c.JSON(http.StatusInternalServerError, APIResponse{Success: false, Error: "Failed to create user"})
        return
    }

    user.CreatedAt = time.Now()
    c.JSON(http.StatusCreated, APIResponse{Success: true, Data: user, Message: "User created successfully"})
}

// Update user
func updateUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{Success: false, Error: "Invalid user ID"})
        return
    }

    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{Success: false, Error: err.Error()})
        return
    }

    // Check if user exists
    var existingUser User
    err = db.QueryRow("SELECT id, name, email, role, is_active, created_at, preferences FROM users WHERE id = $1", id).
        Scan(&existingUser.ID, &existingUser.Name, &existingUser.Email, &existingUser.Role, &existingUser.IsActive, &existingUser.CreatedAt, &existingUser.Preferences)

    if err != nil {
        c.JSON(http.StatusNotFound, APIResponse{Success: false, Error: "User not found"})
        return
    }

    // Check if email already exists (excluding current user)
    if user.Email != existingUser.Email {
        var existingID int
        err := db.QueryRow("SELECT id FROM users WHERE email = $1 AND id != $2", user.Email, id).Scan(&existingID)
        if err == nil {
            c.JSON(http.StatusConflict, APIResponse{Success: false, Error: "Email already exists"})
            return
        }
    }

    // Update user
    _, err = db.Exec(
        "UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, preferences = $5 WHERE id = $6",
        user.Name, user.Email, user.Role, user.IsActive, user.Preferences, id,
    )

    if err != nil {
        c.JSON(http.StatusInternalServerError, APIResponse{Success: false, Error: "Failed to update user"})
        return
    }

    c.JSON(http.StatusOK, APIResponse{Success: true, Message: "User updated successfully"})
}

// Delete user
func deleteUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{Success: false, Error: "Invalid user ID"})
        return
    }

    result, err := db.Exec("DELETE FROM users WHERE id = $1", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, APIResponse{Success: false, Error: "Failed to delete user"})
        return
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        c.JSON(http.StatusNotFound, APIResponse{Success: false, Error: "User not found"})
        return
    }

    c.JSON(http.StatusOK, APIResponse{Success: true, Message: "User deleted successfully"})
}

// Get user statistics
func getStats(c *gin.Context) {
    var stats UserStats

    // Get total counts
    db.QueryRow("SELECT COUNT(*) FROM users").Scan(&stats.TotalUsers)
    db.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = true").Scan(&stats.ActiveUsers)
    stats.InactiveUsers = stats.TotalUsers - stats.ActiveUsers

    // Get role distribution
    stats.RoleDistribution = make(map[string]int)
    rows, err := db.Query("SELECT role, COUNT(*) FROM users GROUP BY role")
    if err == nil {
        defer rows.Close()
        for rows.Next() {
            var role string
            var count int
            rows.Scan(&role, &count)
            stats.RoleDistribution[role] = count
        }
    }

    c.JSON(http.StatusOK, APIResponse{Success: true, Data: stats})
}

// Health check endpoint
func healthCheck(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "status":    "healthy",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
        "version":   "1.0.0",
    })
}

func main() {
    // Initialize database
    initDB()

    // Create Gin router
    r := gin.Default()

    // Add CORS middleware
    r.Use(func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    })

    // Routes
    r.GET("/", healthCheck)
    r.GET("/health", healthCheck)

    // API routes
    api := r.Group("/api")
    {
        api.GET("/users", getUsers)
        api.GET("/users/:id", getUser)
        api.POST("/users", createUser)
        api.PUT("/users/:id", updateUser)
        api.DELETE("/users/:id", deleteUser)
        api.GET("/stats", getStats)
    }

    // Start server
    log.Println("🚀 Starting Go server on port 8080...")
    log.Fatal(r.Run(":8080"))
}
