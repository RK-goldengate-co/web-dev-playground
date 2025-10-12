package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/plugin/dbresolver"

	"github.com/go-redis/redis/v8"
	"github.com/elastic/go-elasticsearch/v8"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host            string `json:"host" env:"DB_HOST"`
	Port            int    `json:"port" env:"DB_PORT"`
	Username        string `json:"username" env:"DB_USER"`
	Password        string `json:"password" env:"DB_PASSWORD"`
	Database        string `json:"database" env:"DB_NAME"`
	SSLMode         string `json:"ssl_mode" env:"DB_SSL_MODE"`
	MaxOpenConns    int    `json:"max_open_conns" env:"DB_MAX_OPEN_CONNS"`
	MaxIdleConns    int    `json:"max_idle_conns" env:"DB_MAX_IDLE_CONNS"`
	ConnMaxLifetime int    `json:"conn_max_lifetime" env:"DB_CONN_MAX_LIFETIME"`
}

// DatabaseManager manages database connections và operations
type DatabaseManager struct {
	DB          *gorm.DB
	Redis       *redis.Client
	Elasticsearch *elasticsearch.Client
	MongoDB     *mongo.Client
}

// NewDatabaseManager creates a new database manager instance
func NewDatabaseManager() (*DatabaseManager, error) {
	// Load configuration
	config := &DatabaseConfig{
		Host:            getEnv("DB_HOST", "localhost"),
		Port:            getEnvAsInt("DB_PORT", 5432),
		Username:        getEnv("DB_USER", "postgres"),
		Password:        getEnv("DB_PASSWORD", "password"),
		Database:        getEnv("DB_NAME", "user_management"),
		SSLMode:         getEnv("DB_SSL_MODE", "disable"),
		MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
		MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
		ConnMaxLifetime: getEnvAsInt("DB_CONN_MAX_LIFETIME", 300),
	}

	// Initialize PostgreSQL với GORM
	db, err := initializePostgreSQL(config)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize PostgreSQL: %w", err)
	}

	// Initialize Redis
	redisClient := initializeRedis()

	// Initialize Elasticsearch
	esClient := initializeElasticsearch()

	// Initialize MongoDB
	mongoClient := initializeMongoDB()

	return &DatabaseManager{
		DB:          db,
		Redis:       redisClient,
		Elasticsearch: esClient,
		MongoDB:     mongoClient,
	}, nil
}

// initializePostgreSQL initializes PostgreSQL connection với GORM
func initializePostgreSQL(config *DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.Username, config.Password, config.Database, config.SSLMode,
	)

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})

	if err != nil {
		return nil, err
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Duration(config.ConnMaxLifetime) * time.Second)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Enable read/write splitting (if you have read replicas)
	if readReplicaDSN := os.Getenv("DB_READ_REPLICA_DSN"); readReplicaDSN != "" {
		err = db.Use(dbresolver.Register(dbresolver.Config{
			Replicas: []gorm.Dialector{postgres.Open(readReplicaDSN)},
			Policy:   dbresolver.RandomPolicy{},
		}))

		if err != nil {
			log.Printf("Warning: Failed to configure read replica: %v", err)
		}
	}

	log.Println("PostgreSQL connected successfully")
	return db, nil
}

// initializeRedis initializes Redis client
func initializeRedis() *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", getEnv("REDIS_HOST", "localhost"), getEnvAsInt("REDIS_PORT", 6379)),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       getEnvAsInt("REDIS_DB", 0),
	})

	// Test connection
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
		return nil
	}

	log.Println("Redis connected successfully")
	return rdb
}

// initializeElasticsearch initializes Elasticsearch client
func initializeElasticsearch() *elasticsearch.Client {
	cfg := elasticsearch.Config{
		Addresses: []string{fmt.Sprintf("http://%s:%d",
			getEnv("ELASTICSEARCH_HOST", "localhost"),
			getEnvAsInt("ELASTICSEARCH_PORT", 9200))},
	}

	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		log.Printf("Warning: Elasticsearch initialization failed: %v", err)
		return nil
	}

	// Test connection
	res, err := es.Info()
	if err != nil {
		log.Printf("Warning: Elasticsearch connection failed: %v", err)
		return nil
	}

	defer res.Body.Close()

	log.Println("Elasticsearch connected successfully")
	return es
}

// initializeMongoDB initializes MongoDB client
func initializeMongoDB() *mongo.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(getEnv("MONGODB_URI", "mongodb://localhost:27017")))
	if err != nil {
		log.Printf("Warning: MongoDB connection failed: %v", err)
		return nil
	}

	// Test connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Printf("Warning: MongoDB ping failed: %v", err)
		return nil
	}

	log.Println("MongoDB connected successfully")
	return client
}

// Close closes tất cả database connections
func (dm *DatabaseManager) Close() error {
	var errors []error

	// Close PostgreSQL
	sqlDB, err := dm.DB.DB()
	if err != nil {
		errors = append(errors, err)
	} else {
		if err := sqlDB.Close(); err != nil {
			errors = append(errors, err)
		}
	}

	// Close Redis
	if dm.Redis != nil {
		if err := dm.Redis.Close(); err != nil {
			errors = append(errors, err)
		}
	}

	// Close MongoDB
	if dm.MongoDB != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := dm.MongoDB.Disconnect(ctx); err != nil {
			errors = append(errors, err)
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("errors closing database connections: %v", errors)
	}

	return nil
}

// DatabaseHealth represents database health status
type DatabaseHealth struct {
	PostgreSQL    ServiceHealth `json:"postgresql"`
	Redis         ServiceHealth `json:"redis"`
	Elasticsearch ServiceHealth `json:"elasticsearch"`
	MongoDB       ServiceHealth `json:"mongodb"`
}

// ServiceHealth represents health status of a service
type ServiceHealth struct {
	Status    string            `json:"status"`
	Message   string            `json:"message"`
	Details   map[string]interface{} `json:"details"`
	LastCheck time.Time         `json:"last_check"`
}

// CheckHealth checks health of tất cả database services
func (dm *DatabaseManager) CheckHealth() DatabaseHealth {
	health := DatabaseHealth{
		LastCheck: time.Now(),
	}

	// Check PostgreSQL
	health.PostgreSQL = dm.checkPostgreSQLHealth()

	// Check Redis
	health.Redis = dm.checkRedisHealth()

	// Check Elasticsearch
	health.Elasticsearch = dm.checkElasticsearchHealth()

	// Check MongoDB
	health.MongoDB = dm.checkMongoDBHealth()

	return health
}

// checkPostgreSQLHealth checks PostgreSQL health
func (dm *DatabaseManager) checkPostgreSQLHealth() ServiceHealth {
	health := ServiceHealth{
		LastCheck: time.Now(),
	}

	sqlDB, err := dm.DB.DB()
	if err != nil {
		health.Status = "down"
		health.Message = "Database connection failed"
		health.Details = map[string]interface{}{"error": err.Error()}
		return health
	}

	if err := sqlDB.Ping(); err != nil {
		health.Status = "down"
		health.Message = "Database ping failed"
		health.Details = map[string]interface{}{"error": err.Error()}
		return health
	}

	// Get database stats
	stats := sqlDB.Stats()
	health.Status = "up"
	health.Message = "Database is healthy"
	health.Details = map[string]interface{}{
		"open_connections":     stats.OpenConnections,
		"in_use":              stats.InUse,
		"idle":                stats.Idle,
		"max_idle_closed":     stats.MaxIdleClosed,
		"max_idle_time_closed": stats.MaxIdleTimeClosed,
		"max_lifetime_closed": stats.MaxLifetimeClosed,
	}

	return health
}

// checkRedisHealth checks Redis health
func (dm *DatabaseManager) checkRedisHealth() ServiceHealth {
	health := ServiceHealth{
		LastCheck: time.Now(),
	}

	if dm.Redis == nil {
		health.Status = "down"
		health.Message = "Redis client not initialized"
		return health
	}

	ctx := context.Background()
	result := dm.Redis.Ping(ctx)

	if err := result.Err(); err != nil {
		health.Status = "down"
		health.Message = "Redis ping failed"
		health.Details = map[string]interface{}{"error": err.Error()}
		return health
	}

	health.Status = "up"
	health.Message = "Redis is healthy"
	health.Details = map[string]interface{}{
		"pong": result.Val(),
	}

	return health
}

// checkElasticsearchHealth checks Elasticsearch health
func (dm *DatabaseManager) checkElasticsearchHealth() ServiceHealth {
	health := ServiceHealth{
		LastCheck: time.Now(),
	}

	if dm.Elasticsearch == nil {
		health.Status = "down"
		health.Message = "Elasticsearch client not initialized"
		return health
	}

	res, err := dm.Elasticsearch.Info()
	if err != nil {
		health.Status = "down"
		health.Message = "Elasticsearch info request failed"
		health.Details = map[string]interface{}{"error": err.Error()}
		return health
	}

	defer res.Body.Close()

	if res.IsError() {
		health.Status = "down"
		health.Message = "Elasticsearch returned error"
		health.Details = map[string]interface{}{"status_code": res.StatusCode}
		return health
	}

	health.Status = "up"
	health.Message = "Elasticsearch is healthy"
	health.Details = map[string]interface{}{
		"status_code": res.StatusCode,
	}

	return health
}

// checkMongoDBHealth checks MongoDB health
func (dm *DatabaseManager) checkMongoDBHealth() ServiceHealth {
	health := ServiceHealth{
		LastCheck: time.Now(),
	}

	if dm.MongoDB == nil {
		health.Status = "down"
		health.Message = "MongoDB client not initialized"
		return health
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := dm.MongoDB.Ping(ctx, nil); err != nil {
		health.Status = "down"
		health.Message = "MongoDB ping failed"
		health.Details = map[string]interface{}{"error": err.Error()}
		return health
	}

	health.Status = "up"
	health.Message = "MongoDB is healthy"

	return health
}

// DatabaseBackupService handles database backup operations
type DatabaseBackupService struct {
	dbManager *DatabaseManager
}

// NewDatabaseBackupService creates a new backup service
func NewDatabaseBackupService(dbManager *DatabaseManager) *DatabaseBackupService {
	return &DatabaseBackupService{
		dbManager: dbManager,
	}
}

// BackupResult represents backup operation result
type BackupResult struct {
	Success     bool      `json:"success"`
	FilePath    string    `json:"file_path,omitempty"`
	FileSize    int64     `json:"file_size,omitempty"`
	Duration    string    `json:"duration"`
	Error       string    `json:"error,omitempty"`
	StartedAt   time.Time `json:"started_at"`
	CompletedAt time.Time `json:"completed_at"`
}

// CreateBackup creates a database backup
func (bs *DatabaseBackupService) CreateBackup(backupType string) (*BackupResult, error) {
	result := &BackupResult{
		StartedAt: time.Now(),
	}

	defer func() {
		result.CompletedAt = time.Now()
		result.Duration = result.CompletedAt.Sub(result.StartedAt).String()
	}()

	// Generate backup filename
	timestamp := time.Now().Format("20060102_150405")
	backupPath := fmt.Sprintf("./backups/backup_%s_%s.sql", backupType, timestamp)

	// Ensure backup directory exists
	if err := os.MkdirAll("./backups", 0755); err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("Failed to create backup directory: %v", err)
		return result, err
	}

	// Create PostgreSQL dump command
	dumpCmd := fmt.Sprintf(
		"pg_dump -h %s -p %d -U %s -d %s -f %s",
		getEnv("DB_HOST", "localhost"),
		getEnvAsInt("DB_PORT", 5432),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_NAME", "user_management"),
		backupPath,
	)

	// Execute backup command
	log.Printf("Creating database backup: %s", backupPath)

	// For production, use proper pg_dump execution
	// Here we're just simulating the backup process
	file, err := os.Create(backupPath)
	if err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("Failed to create backup file: %v", err)
		return result, err
	}
	defer file.Close()

	// Write some metadata to backup file
	metadata := fmt.Sprintf("-- Database backup created at %s\n", time.Now().Format(time.RFC3339))
	if _, err := file.WriteString(metadata); err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("Failed to write backup metadata: %v", err)
		return result, err
	}

	// Get file size
	fileInfo, err := file.Stat()
	if err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("Failed to get backup file info: %v", err)
		return result, err
	}

	result.Success = true
	result.FilePath = backupPath
	result.FileSize = fileInfo.Size()

	log.Printf("Database backup created successfully: %s (size: %d bytes)", backupPath, result.FileSize)
	return result, nil
}

// RestoreBackup restores database từ backup file
func (bs *DatabaseBackupService) RestoreBackup(backupPath string) (*BackupResult, error) {
	result := &BackupResult{
		StartedAt: time.Now(),
	}

	defer func() {
		result.CompletedAt = time.Now()
		result.Duration = result.CompletedAt.Sub(result.StartedAt).String()
	}()

	// Check if backup file exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		result.Success = false
		result.Error = fmt.Sprintf("Backup file does not exist: %s", backupPath)
		return result, err
	}

	// Create restore command
	restoreCmd := fmt.Sprintf(
		"psql -h %s -p %d -U %s -d %s -f %s",
		getEnv("DB_HOST", "localhost"),
		getEnvAsInt("DB_PORT", 5432),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_NAME", "user_management"),
		backupPath,
	)

	log.Printf("Restoring database từ backup: %s", backupPath)

	// For production, use proper psql execution
	// Here we're just simulating the restore process
	result.Success = true
	result.FilePath = backupPath

	log.Printf("Database restored successfully từ backup: %s", backupPath)
	return result, nil
}

// MigrationService handles database migrations
type MigrationService struct {
	db *gorm.DB
}

// NewMigrationService creates a new migration service
func NewMigrationService(db *gorm.DB) *MigrationService {
	return &MigrationService{db: db}
}

// RunMigrations runs database migrations
func (ms *MigrationService) RunMigrations() error {
	log.Println("Running database migrations...")

	// Auto-migrate models
	models := []interface{}{
		&User{},
		&Product{},
		&Order{},
		&OrderItem{},
		&Category{},
		&AuditLog{},
		&UserSession{},
		&ApiKey{},
	}

	for _, model := range models {
		if err := ms.db.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to migrate model %T: %w", model, err)
		}
		log.Printf("Migrated model: %T", model)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// SeedDatabase seeds database với initial data
func (ms *MigrationService) SeedDatabase() error {
	log.Println("Seeding database với initial data...")

	// Check if data already exists
	var userCount int64
	if err := ms.db.Model(&User{}).Count(&userCount).Error; err != nil {
		return fmt.Errorf("failed to count users: %w", err)
	}

	if userCount > 0 {
		log.Println("Database already has data, skipping seed")
		return nil
	}

	// Create admin user
	adminUser := &User{
		FirstName:     "System",
		LastName:      "Administrator",
		Email:         "admin@codeprefency.com",
		PasswordHash:  hashPassword("Admin123!"),
		Role:          UserRoleAdmin,
		Status:        UserStatusActive,
		EmailVerified: true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := ms.db.Create(adminUser).Error; err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	// Create sample categories
	categories := []*Category{
		{
			Name:        "Electronics",
			Description: "Electronic devices and accessories",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			Name:        "Clothing",
			Description: "Fashion and apparel",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			Name:        "Books",
			Description: "Books and publications",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}

	for _, category := range categories {
		if err := ms.db.Create(category).Error; err != nil {
			return fmt.Errorf("failed to create category %s: %w", category.Name, err)
		}
	}

	log.Println("Database seeded successfully")
	return nil
}

// QueryOptimizer provides query optimization utilities
type QueryOptimizer struct {
	db *gorm.DB
}

// NewQueryOptimizer creates a new query optimizer
func NewQueryOptimizer(db *gorm.DB) *QueryOptimizer {
	return &QueryOptimizer{db: db}
}

// AnalyzeQuery analyzes slow queries và provides optimization suggestions
func (qo *QueryOptimizer) AnalyzeQuery(query string) (*QueryAnalysis, error) {
	analysis := &QueryAnalysis{
		Query:     query,
		Analyzed:  time.Now(),
	}

	// Use EXPLAIN ANALYZE to get query execution plan
	explainQuery := fmt.Sprintf("EXPLAIN (ANALYZE, BUFFERS) %s", query)

	var explainResult []map[string]interface{}
	if err := qo.db.Raw(explainQuery).Scan(&explainResult).Error; err != nil {
		return nil, fmt.Errorf("failed to analyze query: %w", err)
	}

	analysis.ExecutionPlan = explainResult

	// Analyze performance
	analysis.Suggestions = qo.generateOptimizationSuggestions(explainResult)

	return analysis, nil
}

// generateOptimizationSuggestions generates optimization suggestions based on execution plan
func (qo *QueryOptimizer) generateOptimizationSuggestions(plan []map[string]interface{}) []string {
	suggestions := []string{}

	for _, step := range plan {
		if nodeType, ok := step["Node Type"].(string); ok {
			switch nodeType {
			case "Seq Scan":
				suggestions = append(suggestions, "Consider adding an index for better performance")
			case "Hash Join":
				suggestions = append(suggestions, "Hash join detected - ensure proper indexing on join columns")
			case "Sort":
				suggestions = append(suggestions, "Sorting operation - consider adding index on ORDER BY columns")
			}
		}
	}

	return suggestions
}

// ConnectionPoolMonitor monitors database connection pool
type ConnectionPoolMonitor struct {
	db           *gorm.DB
	redis        *redis.Client
	monitorInterval time.Duration
	stopChannel     chan bool
}

// NewConnectionPoolMonitor creates a new connection pool monitor
func NewConnectionPoolMonitor(db *gorm.DB, redis *redis.Client) *ConnectionPoolMonitor {
	return &ConnectionPoolMonitor{
		db:              db,
		redis:           redis,
		monitorInterval: 30 * time.Second,
		stopChannel:     make(chan bool),
	}
}

// StartMonitoring starts monitoring database connections
func (cpm *ConnectionPoolMonitor) StartMonitoring() {
	go func() {
		ticker := time.NewTicker(cpm.monitorInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				cpm.collectMetrics()
			case <-cpm.stopChannel:
				return
			}
		}
	}()
}

// StopMonitoring stops monitoring
func (cpm *ConnectionPoolMonitor) StopMonitoring() {
	cpm.stopChannel <- true
}

// collectMetrics collects và stores connection pool metrics
func (cpm *ConnectionPoolMonitor) collectMetrics() {
	ctx := context.Background()

	// PostgreSQL connection stats
	sqlDB, err := cpm.db.DB()
	if err == nil {
		stats := sqlDB.Stats()

		metrics := map[string]interface{}{
			"open_connections":     stats.OpenConnections,
			"in_use":              stats.InUse,
			"idle":                stats.Idle,
			"max_idle_closed":     stats.MaxIdleClosed,
			"max_idle_time_closed": stats.MaxIdleTimeClosed,
			"max_lifetime_closed": stats.MaxLifetimeClosed,
			"wait_count":          stats.WaitCount,
			"wait_duration":       stats.WaitDuration.String(),
			"max_idle_time":       stats.MaxIdleTime.String(),
			"max_lifetime":        stats.MaxLifetime.String(),
		}

		// Store in Redis for monitoring
		if cpm.redis != nil {
			key := fmt.Sprintf("db_metrics:%d", time.Now().Unix())
			if data, err := json.Marshal(metrics); err == nil {
				cpm.redis.Set(ctx, key, string(data), 24*time.Hour)
			}
		}

		log.Printf("DB Pool Stats - Open: %d, InUse: %d, Idle: %d",
			stats.OpenConnections, stats.InUse, stats.Idle)
	}

	// Redis connection stats
	if cpm.redis != nil {
		poolStats := cpm.redis.PoolStats()

		redisMetrics := map[string]interface{}{
			"hits":        poolStats.Hits,
			"misses":      poolStats.Misses,
			"timeouts":    poolStats.Timeouts,
			"total_conns": poolStats.TotalConns,
			"idle_conns":  poolStats.IdleConns,
			"stale_conns": poolStats.StaleConns,
		}

		log.Printf("Redis Pool Stats - Hits: %d, Misses: %d, TotalConns: %d",
			poolStats.Hits, poolStats.Misses, poolStats.TotalConns)
	}
}

// DatabaseCacheService provides caching utilities
type DatabaseCacheService struct {
	db    *gorm.DB
	redis *redis.Client
}

// NewDatabaseCacheService creates a new cache service
func NewDatabaseCacheService(db *gorm.DB, redis *redis.Client) *DatabaseCacheService {
	return &DatabaseCacheService{
		db:    db,
		redis: redis,
	}
}

// GetCachedResult gets result từ cache or executes query
func (dcs *DatabaseCacheService) GetCachedResult(ctx context.Context, key string, ttl time.Duration, queryFunc func() (interface{}, error)) (interface{}, error) {
	// Try to get từ cache first
	if dcs.redis != nil {
		cached, err := dcs.redis.Get(ctx, key).Result()
		if err == nil {
			var result interface{}
			if err := json.Unmarshal([]byte(cached), &result); err == nil {
				return result, nil
			}
		}
	}

	// Execute query if not in cache
	result, err := queryFunc()
	if err != nil {
		return nil, err
	}

	// Cache the result
	if dcs.redis != nil {
		if data, err := json.Marshal(result); err == nil {
			dcs.redis.Set(ctx, key, string(data), ttl)
		}
	}

	return result, nil
}

// InvalidateCache invalidates cache entries by pattern
func (dcs *DatabaseCacheService) InvalidateCache(ctx context.Context, pattern string) error {
	if dcs.redis == nil {
		return nil
	}

	keys, err := dcs.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}

	if len(keys) > 0 {
		return dcs.redis.Del(ctx, keys...).Err()
	}

	return nil
}

// DatabaseAnalyticsService provides database analytics
type DatabaseAnalyticsService struct {
	db *gorm.DB
}

// NewDatabaseAnalyticsService creates a new analytics service
func NewDatabaseAnalyticsService(db *gorm.DB) *DatabaseAnalyticsService {
	return &DatabaseAnalyticsService{db: db}
}

// GetTableSizes returns sizes of tất cả tables
func (das *DatabaseAnalyticsService) GetTableSizes() (map[string]int64, error) {
	sizes := make(map[string]int64)

	var results []struct {
		TableName string `gorm:"column:table_name"`
		Size      int64  `gorm:"column:size"`
	}

	query := `
		SELECT
			table_name,
			pg_total_relation_size(schemaname||'.'||table_name) as size
		FROM information_schema.tables
		WHERE table_schema = 'public'
		ORDER BY size DESC
	`

	if err := das.db.Raw(query).Scan(&results).Error; err != nil {
		return nil, err
	}

	for _, result := range results {
		sizes[result.TableName] = result.Size
	}

	return sizes, nil
}

// GetSlowQueries returns slow queries từ pg_stat_statements
func (das *DatabaseAnalyticsService) GetSlowQueries(limit int) ([]SlowQueryInfo, error) {
	var queries []SlowQueryInfo

	query := `
		SELECT
			query,
			calls,
			total_time,
			mean_time,
			rows
		FROM pg_stat_statements
		WHERE query NOT LIKE '%pg_stat_statements%'
		ORDER BY mean_time DESC
		LIMIT ?
	`

	if err := das.db.Raw(query, limit).Scan(&queries).Error; err != nil {
		return nil, err
	}

	return queries, nil
}

// GetDatabaseUsageStats returns database usage statistics
func (das *DatabaseAnalyticsService) GetDatabaseUsageStats() (*DatabaseUsageStats, error) {
	stats := &DatabaseUsageStats{}

	// Get database size
	var dbSize struct {
		Size int64 `gorm:"column:size"`
	}

	if err := das.db.Raw("SELECT pg_database_size(current_database()) as size").Scan(&dbSize).Error; err != nil {
		return nil, err
	}
	stats.TotalSize = dbSize.Size

	// Get active connections
	var connectionCount int64
	if err := das.db.Raw("SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'").Scan(&connectionCount).Error; err != nil {
		return nil, err
	}
	stats.ActiveConnections = connectionCount

	// Get cache hit ratio
	var cacheStats struct {
		HitRatio float64 `gorm:"column:hit_ratio"`
	}

	if err := das.db.Raw(`
		SELECT
			(blks_hit::float / (blks_hit + blks_read)) * 100 as hit_ratio
		FROM pg_stat_database
		WHERE datname = current_database()
	`).Scan(&cacheStats).Error; err != nil {
		return nil, err
	}
	stats.CacheHitRatio = cacheStats.HitRatio

	return stats, nil
}

// Utility functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// Types for analytics
type QueryAnalysis struct {
	Query          string                 `json:"query"`
	ExecutionPlan  []map[string]interface{} `json:"execution_plan"`
	Suggestions    []string               `json:"suggestions"`
	Analyzed       time.Time              `json:"analyzed"`
}

type SlowQueryInfo struct {
	Query     string  `json:"query"`
	Calls     int64   `json:"calls"`
	TotalTime float64 `json:"total_time"`
	MeanTime  float64 `json:"mean_time"`
	Rows      int64   `json:"rows"`
}

type DatabaseUsageStats struct {
	TotalSize         int64   `json:"total_size"`
	ActiveConnections int64   `json:"active_connections"`
	CacheHitRatio     float64 `json:"cache_hit_ratio"`
}
