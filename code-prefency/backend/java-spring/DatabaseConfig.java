package com.codeprefency.usermanagement.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.Properties;

/**
 * Database Configuration for User Management System
 * Advanced database setup với connection pooling, JPA, và transaction management
 */
@Configuration
@EnableJpaRepositories(
    basePackages = "com.codeprefency.usermanagement.repository",
    entityManagerFactoryRef = "userEntityManagerFactory",
    transactionManagerRef = "userTransactionManager"
)
@EnableTransactionManagement
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${spring.datasource.driver-class-name}")
    private String datasourceDriver;

    @Value("${spring.jpa.hibernate.ddl-auto}")
    private String hibernateDdlAuto;

    @Value("${spring.jpa.show-sql}")
    private Boolean showSql;

    @Value("${spring.jpa.properties.hibernate.dialect}")
    private String hibernateDialect;

    @Value("${spring.jpa.properties.hibernate.format_sql}")
    private Boolean formatSql;

    @Value("${spring.jpa.properties.hibernate.use_sql_comments}")
    private Boolean useSqlComments;

    /**
     * Primary DataSource với HikariCP connection pooling
     */
    @Bean
    @Primary
    public DataSource userDataSource() {
        HikariConfig config = new HikariConfig();

        // Basic configuration
        config.setJdbcUrl(datasourceUrl);
        config.setUsername(datasourceUsername);
        config.setPassword(datasourcePassword);
        config.setDriverClassName(datasourceDriver);

        // Connection pool configuration
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setLeakDetectionThreshold(60000);

        // Connection validation
        config.setConnectionTestQuery("SELECT 1");
        config.setValidationTimeout(5000);

        // Performance tuning
        config.setAutoCommit(false);
        config.setPoolName("UserManagementHikariPool");

        // Additional properties
        Properties dsProperties = new Properties();
        dsProperties.setProperty("cachePrepStmts", "true");
        dsProperties.setProperty("prepStmtCacheSize", "250");
        dsProperties.setProperty("prepStmtCacheSqlLimit", "2048");
        dsProperties.setProperty("useServerPrepStmts", "true");
        dsProperties.setProperty("useLocalSessionState", "true");
        dsProperties.setProperty("rewriteBatchedStatements", "true");
        dsProperties.setProperty("cacheResultSetMetadata", "true");
        dsProperties.setProperty("cacheServerConfiguration", "true");
        dsProperties.setProperty("elideSetAutoCommits", "true");
        dsProperties.setProperty("maintainTimeStats", "false");

        config.setDataSourceProperties(dsProperties);

        return new HikariDataSource(config);
    }

    /**
     * JPA Entity Manager Factory
     */
    @Bean
    @Primary
    public LocalContainerEntityManagerFactoryBean userEntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(userDataSource());
        factory.setPackagesToScan("com.codeprefency.usermanagement.entity");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Properties jpaProperties = new Properties();
        jpaProperties.setProperty("hibernate.hbm2ddl.auto", hibernateDdlAuto);
        jpaProperties.setProperty("hibernate.dialect", hibernateDialect);
        jpaProperties.setProperty("hibernate.show_sql", showSql.toString());
        jpaProperties.setProperty("hibernate.format_sql", formatSql.toString());
        jpaProperties.setProperty("hibernate.use_sql_comments", useSqlComments.toString());

        // Additional Hibernate properties
        jpaProperties.setProperty("hibernate.jdbc.batch_size", "20");
        jpaProperties.setProperty("hibernate.order_inserts", "true");
        jpaProperties.setProperty("hibernate.order_updates", "true");
        jpaProperties.setProperty("hibernate.jdbc.batch_versioned_data", "true");
        jpaProperties.setProperty("hibernate.connection.provider_disables_autocommit", "true");

        // Second level cache
        jpaProperties.setProperty("hibernate.cache.use_second_level_cache", "true");
        jpaProperties.setProperty("hibernate.cache.use_query_cache", "true");
        jpaProperties.setProperty("hibernate.cache.region.factory_class", "org.hibernate.cache.ehcache.SingletonEhCacheRegionFactory");

        // Statistics (for monitoring)
        jpaProperties.setProperty("hibernate.generate_statistics", "true");
        jpaProperties.setProperty("hibernate.session.events.log", "true");

        factory.setJpaProperties(jpaProperties);

        return factory;
    }

    /**
     * JPA Transaction Manager
     */
    @Bean
    @Primary
    public PlatformTransactionManager userTransactionManager() {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(userEntityManagerFactory().getObject());
        return transactionManager;
    }
}

/**
 * Advanced Database Configuration với multiple datasources
 */
@Configuration
@EnableJpaRepositories(
    basePackages = "com.codeprefency.usermanagement.analytics.repository",
    entityManagerFactoryRef = "analyticsEntityManagerFactory",
    transactionManagerRef = "analyticsTransactionManager"
)
class AnalyticsDatabaseConfig {

    @Value("${analytics.datasource.url}")
    private String analyticsDatasourceUrl;

    @Value("${analytics.datasource.username}")
    private String analyticsDatasourceUsername;

    @Value("${analytics.datasource.password}")
    private String analyticsDatasourcePassword;

    @Bean
    public DataSource analyticsDataSource() {
        HikariConfig config = new HikariConfig();

        config.setJdbcUrl(analyticsDatasourceUrl);
        config.setUsername(analyticsDatasourceUsername);
        config.setPassword(analyticsDatasourcePassword);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");

        // Read-only datasource configuration
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(10000);
        config.setReadOnly(true);
        config.setAutoCommit(true);

        return new HikariDataSource(config);
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean analyticsEntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(analyticsDataSource());
        factory.setPackagesToScan("com.codeprefency.usermanagement.analytics.entity");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Properties jpaProperties = new Properties();
        jpaProperties.setProperty("hibernate.dialect", "org.hibernate.dialect.MySQL8Dialect");
        jpaProperties.setProperty("hibernate.show_sql", "false");
        jpaProperties.setProperty("hibernate.format_sql", "true");

        factory.setJpaProperties(jpaProperties);

        return factory;
    }

    @Bean
    public PlatformTransactionManager analyticsTransactionManager() {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(analyticsEntityManagerFactory().getObject());
        return transactionManager;
    }
}

/**
 * Database Health Check Configuration
 */
@Configuration
class DatabaseHealthConfig {

    @Bean
    public DatabaseHealthIndicator databaseHealthIndicator(DataSource dataSource) {
        return new DatabaseHealthIndicator(dataSource);
    }
}

/**
 * Custom Database Health Indicator
 */
@Component
class DatabaseHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;
    private final Logger logger = LoggerFactory.getLogger(DatabaseHealthIndicator.class);

    public DatabaseHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            // Test basic connectivity
            try (PreparedStatement statement = connection.prepareStatement("SELECT 1")) {
                statement.execute();

                // Get database metadata
                DatabaseMetaData metaData = connection.getMetaData();
                Map<String, Object> details = new HashMap<>();
                details.put("databaseProductName", metaData.getDatabaseProductName());
                details.put("databaseProductVersion", metaData.getDatabaseProductVersion());
                details.put("driverName", metaData.getDriverName());
                details.put("driverVersion", metaData.getDriverVersion());

                return Health.up().withDetails(details).build();
            }
        } catch (SQLException e) {
            logger.error("Database health check failed", e);
            return Health.down()
                    .withException(e)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}

/**
 * Database Migration Configuration
 */
@Configuration
@EnableJpaRepositories
class FlywayConfig {

    @Bean
    public Flyway flyway(DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .validateOnMigrate(true)
                .cleanDisabled(true)
                .load();

        return flyway;
    }

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Custom migration strategy
            flyway.migrate();
        };
    }
}

/**
 * Redis Configuration cho caching và session storage
 */
@Configuration
@EnableCaching
class RedisConfig {

    @Value("${spring.redis.host}")
    private String redisHost;

    @Value("${spring.redis.port}")
    private int redisPort;

    @Value("${spring.redis.password}")
    private String redisPassword;

    @Value("${spring.redis.timeout}")
    private int redisTimeout;

    @Bean
    public JedisConnectionFactory jedisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        config.setPassword(redisPassword);

        JedisConnectionFactory factory = new JedisConnectionFactory(config);
        return factory;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(jedisConnectionFactory());

        // Set serializers
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        cacheConfigurations.put("users", config.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("products", config.entryTtl(Duration.ofHours(2)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(config)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}

/**
 * MongoDB Configuration cho NoSQL data
 */
@Configuration
@EnableMongoRepositories(
    basePackages = "com.codeprefency.usermanagement.nosql.repository",
    mongoTemplateRef = "userMongoTemplate"
)
class MongoConfig {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database}")
    private String database;

    @Bean
    public MongoClient mongoClient() {
        ConnectionString connectionString = new ConnectionString(mongoUri);
        MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .build();

        return MongoClients.create(mongoClientSettings);
    }

    @Bean
    public MongoTemplate userMongoTemplate() {
        return new MongoTemplate(mongoClient(), database);
    }
}

/**
 * Elasticsearch Configuration cho search functionality
 */
@Configuration
class ElasticsearchConfig {

    @Value("${elasticsearch.host}")
    private String elasticsearchHost;

    @Value("${elasticsearch.port}")
    private int elasticsearchPort;

    @Bean
    public RestHighLevelClient elasticsearchClient() {
        return new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost(elasticsearchHost, elasticsearchPort, "http")
                )
        );
    }

    @Bean
    public ElasticsearchOperations elasticsearchTemplate() {
        return new ElasticsearchRestTemplate(elasticsearchClient());
    }
}

/**
 * Database Utilities và Helper Methods
 */
@Component
class DatabaseUtils {

    private final DataSource dataSource;
    private final Logger logger = LoggerFactory.getLogger(DatabaseUtils.class);

    public DatabaseUtils(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Execute query với automatic retry và connection management
     */
    public <T> T executeQuery(String sql, Function<ResultSet, T> mapper, Object... params) {
        return executeWithRetry(() -> {
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {

                // Set parameters
                for (int i = 0; i < params.length; i++) {
                    stmt.setObject(i + 1, params[i]);
                }

                try (ResultSet rs = stmt.executeQuery()) {
                    return mapper.apply(rs);
                }
            }
        });
    }

    /**
     * Execute update với transaction support
     */
    public int executeUpdate(String sql, Object... params) {
        return executeWithRetry(() -> {
            try (Connection conn = dataSource.getConnection()) {
                conn.setAutoCommit(false);

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    for (int i = 0; i < params.length; i++) {
                        stmt.setObject(i + 1, params[i]);
                    }

                    int result = stmt.executeUpdate();
                    conn.commit();

                    return result;
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                }
            }
        });
    }

    /**
     * Batch insert với performance optimization
     */
    public int[] batchInsert(String sql, List<List<Object>> batchParams) {
        return executeWithRetry(() -> {
            try (Connection conn = dataSource.getConnection()) {
                conn.setAutoCommit(false);

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    for (List<Object> params : batchParams) {
                        for (int i = 0; i < params.size(); i++) {
                            stmt.setObject(i + 1, params.get(i));
                        }
                        stmt.addBatch();
                    }

                    int[] results = stmt.executeBatch();
                    conn.commit();

                    return results;
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                }
            }
        });
    }

    /**
     * Execute với retry logic cho transient failures
     */
    private <T> T executeWithRetry(Supplier<T> operation) {
        int maxRetries = 3;
        long retryDelay = 1000; // milliseconds

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return operation.get();
            } catch (SQLException e) {
                if (attempt == maxRetries || !isRetryableException(e)) {
                    logger.error("Database operation failed after {} attempts", maxRetries, e);
                    throw new RuntimeException("Database operation failed", e);
                }

                logger.warn("Database operation failed, retrying in {}ms (attempt {}/{})",
                           retryDelay, attempt, maxRetries);

                try {
                    Thread.sleep(retryDelay);
                    retryDelay *= 2; // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Retry interrupted", ie);
                }
            }
        }

        throw new RuntimeException("Should not reach here");
    }

    private boolean isRetryableException(SQLException e) {
        // Check for transient SQL exceptions
        String sqlState = e.getSQLState();
        int errorCode = e.getErrorCode();

        // MySQL transient errors
        return (sqlState != null && sqlState.startsWith("08")) || // Connection errors
               errorCode == 1205 || // Lock wait timeout
               errorCode == 1213 || // Deadlock
               errorCode == 2006 || // Connection lost
               errorCode == 2013;   // Connection lost during query
    }

    /**
     * Get database statistics
     */
    public Map<String, Object> getDatabaseStats() {
        Map<String, Object> stats = new HashMap<>();

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();

            stats.put("databaseProductName", metaData.getDatabaseProductName());
            stats.put("databaseProductVersion", metaData.getDatabaseProductVersion());
            stats.put("driverName", metaData.getDriverName());
            stats.put("driverVersion", metaData.getDriverVersion());
            stats.put("url", metaData.getURL());

            // Get table count
            try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?")) {
                stmt.setString(1, conn.getCatalog());

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        stats.put("tableCount", rs.getInt("table_count"));
                    }
                }
            }

        } catch (SQLException e) {
            logger.error("Failed to get database stats", e);
            stats.put("error", e.getMessage());
        }

        return stats;
    }
}

/**
 * Database Connection Pool Monitoring
 */
@Component
class ConnectionPoolMonitor {

    private final HikariDataSource dataSource;
    private final Logger logger = LoggerFactory.getLogger(ConnectionPoolMonitor.class);

    public ConnectionPoolMonitor(@Qualifier("userDataSource") HikariDataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void logPoolStats() {
        HikariPoolMXBean poolMXBean = dataSource.getHikariPoolMXBean();

        logger.info("Connection Pool Stats:");
        logger.info("  Active Connections: {}", poolMXBean.getActiveConnections());
        logger.info("  Idle Connections: {}", poolMXBean.getIdleConnections());
        logger.info("  Total Connections: {}", poolMXBean.getTotalConnections());
        logger.info("  Threads Awaiting Connection: {}", poolMXBean.getThreadsAwaitingConnection());

        if (poolMXBean.getTotalConnections() > 15) {
            logger.warn("High connection pool usage detected!");
        }
    }
}

/**
 * Custom JPA Repository với advanced features
 */
@NoRepositoryBean
interface BaseRepository<T, ID> extends JpaRepository<T, ID> {

    /**
     * Find by multiple criteria với pagination
     */
    Page<T> findByCriteria(Map<String, Object> criteria, Pageable pageable);

    /**
     * Bulk update operation
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.updatedAt = CURRENT_TIMESTAMP WHERE e.id IN :ids")
    int bulkUpdateTimestamp(@Param("ids") List<ID> ids);

    /**
     * Find with projections
     */
    <P> List<P> findBy(Class<P> projectionClass);

    /**
     * Custom query với named parameters
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.createdAt >= :startDate")
    List<T> findRecent(@Param("startDate") LocalDateTime startDate);
}

/**
 * Example Custom Repository Implementation
 */
@Repository
interface UserRepository extends BaseRepository<User, Long> {

    List<User> findByRoleAndActive(UserRole role, boolean active);

    List<User> findByEmailContaining(String emailPart);

    @Query("SELECT u FROM User u WHERE u.lastLoginAt < :cutoffDate")
    List<User> findInactiveUsers(@Param("cutoffDate") LocalDateTime cutoffDate);

    @Query(value = "SELECT * FROM users WHERE email LIKE %:email%", nativeQuery = true)
    List<User> findByEmailNative(@Param("email") String email);

    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = u.failedLoginAttempts + 1 WHERE u.email = :email")
    int incrementFailedAttempts(@Param("email") String email);
}

/**
 * Database Backup và Recovery Service
 */
@Service
class DatabaseBackupService {

    private final DataSource dataSource;
    private final Logger logger = LoggerFactory.getLogger(DatabaseBackupService.class);

    public DatabaseBackupService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Create full database backup
     */
    public boolean createBackup(String backupPath) {
        try {
            // Get database name and credentials
            String dbName = getDatabaseName();
            String username = getDatabaseUsername();
            String password = getDatabasePassword();
            String host = getDatabaseHost();

            // Create backup command
            String command = String.format(
                "mysqldump -h %s -u %s -p%s %s > %s",
                host, username, password, dbName, backupPath
            );

            Process process = Runtime.getRuntime().exec(command);
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                logger.info("Database backup created successfully: {}", backupPath);
                return true;
            } else {
                logger.error("Database backup failed with exit code: {}", exitCode);
                return false;
            }

        } catch (Exception e) {
            logger.error("Failed to create database backup", e);
            return false;
        }
    }

    /**
     * Restore database từ backup
     */
    public boolean restoreFromBackup(String backupPath) {
        try {
            String dbName = getDatabaseName();
            String username = getDatabaseUsername();
            String password = getDatabasePassword();
            String host = getDatabaseHost();

            // Create restore command
            String command = String.format(
                "mysql -h %s -u %s -p%s %s < %s",
                host, username, password, dbName, backupPath
            );

            Process process = Runtime.getRuntime().exec(command);
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                logger.info("Database restored successfully from: {}", backupPath);
                return true;
            } else {
                logger.error("Database restore failed with exit code: {}", exitCode);
                return false;
            }

        } catch (Exception e) {
            logger.error("Failed to restore database", e);
            return false;
        }
    }

    private String getDatabaseName() {
        try (Connection conn = dataSource.getConnection()) {
            return conn.getCatalog();
        } catch (SQLException e) {
            throw new RuntimeException("Cannot get database name", e);
        }
    }

    private String getDatabaseUsername() {
        // Get from configuration
        return "root"; // Simplified for example
    }

    private String getDatabasePassword() {
        // Get from configuration
        return ""; // Simplified for example
    }

    private String getDatabaseHost() {
        // Get from configuration
        return "localhost"; // Simplified for example
    }
}

/**
 * Database Query Performance Monitor
 */
@Component
@Aspect
class QueryPerformanceMonitor {

    private final Logger logger = LoggerFactory.getLogger(QueryPerformanceMonitor.class);

    @Around("execution(* com.codeprefency.usermanagement.repository.*.*(..))")
    public Object monitorQueryPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();

            long executionTime = System.currentTimeMillis() - startTime;

            // Log slow queries
            if (executionTime > 1000) { // More than 1 second
                logger.warn("Slow query detected in {}: {}ms",
                           joinPoint.getSignature().toShortString(),
                           executionTime);
            }

            // Log query statistics
            logger.debug("Query executed in {}: {}ms",
                        joinPoint.getSignature().toShortString(),
                        executionTime);

            return result;

        } catch (Throwable throwable) {
            long executionTime = System.currentTimeMillis() - startTime;

            logger.error("Query failed in {} after {}ms: {}",
                        joinPoint.getSignature().toShortString(),
                        executionTime,
                        throwable.getMessage());

            throw throwable;
        }
    }
}

/**
 * Database Schema Validation
 */
@Service
class SchemaValidator {

    private final DataSource dataSource;
    private final Logger logger = LoggerFactory.getLogger(SchemaValidator.class);

    public SchemaValidator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Validate database schema
     */
    public List<String> validateSchema() {
        List<String> issues = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {
            // Check required tables
            String[] requiredTables = {"users", "products", "orders", "categories"};
            for (String table : requiredTables) {
                if (!tableExists(conn, table)) {
                    issues.add("Missing required table: " + table);
                }
            }

            // Check table structures
            issues.addAll(validateUsersTable(conn));
            issues.addAll(validateProductsTable(conn));
            issues.addAll(validateOrdersTable(conn));

            // Check indexes
            issues.addAll(validateIndexes(conn));

            // Check foreign key constraints
            issues.addAll(validateForeignKeys(conn));

        } catch (SQLException e) {
            issues.add("Schema validation failed: " + e.getMessage());
        }

        return issues;
    }

    private boolean tableExists(Connection conn, String tableName) throws SQLException {
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?")) {
            stmt.setString(1, tableName);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private List<String> validateUsersTable(Connection conn) {
        List<String> issues = new ArrayList<>();

        try {
            DatabaseMetaData metaData = conn.getMetaData();
            try (ResultSet columns = metaData.getColumns(null, null, "users", null)) {
                Set<String> columnNames = new HashSet<>();

                while (columns.next()) {
                    columnNames.add(columns.getString("COLUMN_NAME").toLowerCase());
                }

                // Check required columns
                String[] requiredColumns = {"id", "email", "name", "role", "created_at"};
                for (String column : requiredColumns) {
                    if (!columnNames.contains(column)) {
                        issues.add("Users table missing required column: " + column);
                    }
                }
            }
        } catch (SQLException e) {
            issues.add("Failed to validate users table: " + e.getMessage());
        }

        return issues;
    }

    private List<String> validateProductsTable(Connection conn) {
        // Similar validation for products table
        return new ArrayList<>();
    }

    private List<String> validateOrdersTable(Connection conn) {
        // Similar validation for orders table
        return new ArrayList<>();
    }

    private List<String> validateIndexes(Connection conn) {
        // Check for required indexes
        return new ArrayList<>();
    }

    private List<String> validateForeignKeys(Connection conn) {
        // Check foreign key constraints
        return new ArrayList<>();
    }
}

// Import statements cần thiết
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.stereotype.Component;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import java.time.Duration;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.DatabaseMetaData;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClientSettings;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.data.elasticsearch.core.ElasticsearchRestTemplate;
import org.apache.http.HttpHost;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.RestClients;
import java.util.function.Function;
import java.util.function.Supplier;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import org.springframework.data.repository.query.Param;
import java.util.Date;
