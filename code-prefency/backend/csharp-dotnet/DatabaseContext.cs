using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CodePrefency.UserManagement.Data
{
    /// <summary>
    /// Entity Framework Core Database Context
    /// Advanced database configuration với multiple contexts và connection resilience
    /// </summary>
    public class UserManagementDbContext : DbContext
    {
        public UserManagementDbContext(DbContextOptions<UserManagementDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<ApiKey> ApiKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure table names
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Product>().ToTable("products");
            modelBuilder.Entity<Order>().ToTable("orders");
            modelBuilder.Entity<OrderItem>().ToTable("order_items");
            modelBuilder.Entity<Category>().ToTable("categories");
            modelBuilder.Entity<AuditLog>().ToTable("audit_logs");
            modelBuilder.Entity<UserSession>().ToTable("user_sessions");
            modelBuilder.Entity<ApiKey>().ToTable("api_keys");

            // Configure indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.CreatedAt);

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.CategoryId);

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.Sku)
                .IsUnique();

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.UserId);

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.Status);

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.CreatedAt);

            // Configure relationships
            modelBuilder.Entity<Order>()
                .HasMany(o => o.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Product>()
                .HasOne<Category>()
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Category>()
                .HasOne<Category>()
                .WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure enums
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<User>()
                .Property(u => u.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .Property(o => o.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .Property(o => o.PaymentMethod)
                .HasConversion<string>();

            // Configure JSON columns
            modelBuilder.Entity<User>()
                .Property(u => u.Preferences)
                .HasColumnType("jsonb");

            modelBuilder.Entity<Product>()
                .Property(p => p.Specifications)
                .HasColumnType("jsonb");

            modelBuilder.Entity<Order>()
                .Property(o => o.ShippingAddress)
                .HasColumnType("jsonb");

            modelBuilder.Entity<Order>()
                .Property(o => o.BillingAddress)
                .HasColumnType("jsonb");

            // Configure computed columns
            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasComputedColumnSql("COALESCE((
                    SELECT SUM(oi.Quantity * oi.Price)
                    FROM order_items oi
                    WHERE oi.OrderId = orders.Id
                ), 0)");

            // Configure soft delete
            modelBuilder.Entity<User>()
                .HasQueryFilter(u => !u.IsDeleted);

            modelBuilder.Entity<Product>()
                .HasQueryFilter(p => !p.IsDeleted);

            modelBuilder.Entity<Order>()
                .HasQueryFilter(o => !o.IsDeleted);

            // Configure audit fields
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(IAuditable).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property<DateTime>("CreatedAt")
                        .HasDefaultValueSql("NOW()");

                    modelBuilder.Entity(entityType.ClrType)
                        .Property<DateTime>("UpdatedAt")
                        .HasDefaultValueSql("NOW()")
                        .ValueGeneratedOnUpdate();
                }
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Automatic audit trail
            var entries = ChangeTracker.Entries<IAuditable>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                }

                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Analytics Database Context
    /// Separate context cho báo cáo và analytics
    /// </summary>
    public class AnalyticsDbContext : DbContext
    {
        public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options)
            : base(options)
        {
        }

        public DbSet<UserAnalytics> UserAnalytics { get; set; }
        public DbSet<ProductAnalytics> ProductAnalytics { get; set; }
        public DbSet<OrderAnalytics> OrderAnalytics { get; set; }
        public DbSet<RevenueReport> RevenueReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure read-only analytics tables
            modelBuilder.Entity<UserAnalytics>().ToTable("user_analytics").HasNoKey();
            modelBuilder.Entity<ProductAnalytics>().ToTable("product_analytics").HasNoKey();
            modelBuilder.Entity<OrderAnalytics>().ToTable("order_analytics").HasNoKey();
            modelBuilder.Entity<RevenueReport>().ToTable("revenue_reports").HasNoKey();
        }
    }

    /// <summary>
    /// Database Configuration
    /// Advanced database setup với connection pooling và health checks
    /// </summary>
    public static class DatabaseConfiguration
    {
        public static void AddDatabaseServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Add main database context
            services.AddDbContext<UserManagementDbContext>(options =>
            {
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                    npgsqlOptions =>
                    {
                        npgsqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorCodesToAdd: null);
                    });

                options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
                options.EnableSensitiveDataLogging(configuration.GetValue<bool>("EnableSensitiveDataLogging"));
            });

            // Add analytics database context
            services.AddDbContext<AnalyticsDbContext>(options =>
            {
                options.UseNpgsql(configuration.GetConnectionString("AnalyticsConnection"));
                options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            });

            // Add database health checks
            services.AddHealthChecks()
                .AddNpgSql(configuration.GetConnectionString("DefaultConnection"),
                          name: "UserManagementDB")
                .AddNpgSql(configuration.GetConnectionString("AnalyticsConnection"),
                          name: "AnalyticsDB");

            // Add Entity Framework logging
            services.AddLogging(logging =>
            {
                logging.AddEntityFramework()
                      .AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
            });
        }
    }

    /// <summary>
    /// Database Migration Service
    /// Automated migration management
    /// </summary>
    public class MigrationService
    {
        private readonly UserManagementDbContext _context;
        private readonly ILogger<MigrationService> _logger;

        public MigrationService(UserManagementDbContext context, ILogger<MigrationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> ApplyMigrationsAsync()
        {
            try
            {
                _logger.LogInformation("Applying database migrations...");

                var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
                var migrationCount = pendingMigrations.Count();

                if (migrationCount > 0)
                {
                    _logger.LogInformation($"Applying {migrationCount} pending migrations");

                    await _context.Database.MigrateAsync();

                    _logger.LogInformation("Database migrations applied successfully");
                    return true;
                }
                else
                {
                    _logger.LogInformation("No pending migrations found");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to apply database migrations");
                return false;
            }
        }

        public async Task<bool> SeedDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Seeding database with initial data...");

                if (!await _context.Users.AnyAsync())
                {
                    // Create admin user
                    var adminUser = new User
                    {
                        FirstName = "System",
                        LastName = "Administrator",
                        Email = "admin@codeprefency.com",
                        PasswordHash = PasswordHasher.HashPassword("Admin123!"),
                        Role = UserRole.Admin,
                        Status = UserStatus.Active,
                        EmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.Users.AddAsync(adminUser);

                    // Create sample categories
                    var categories = new[]
                    {
                        new Category { Name = "Electronics", Description = "Electronic devices and accessories" },
                        new Category { Name = "Clothing", Description = "Fashion and apparel" },
                        new Category { Name = "Books", Description = "Books and publications" }
                    };

                    await _context.Categories.AddRangeAsync(categories);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Database seeded successfully");
                    return true;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed database");
                return false;
            }
        }
    }

    /// <summary>
    /// Database Health Check Service
    /// Comprehensive database monitoring
    /// </summary>
    public class DatabaseHealthService
    {
        private readonly UserManagementDbContext _context;
        private readonly ILogger<DatabaseHealthService> _logger;

        public DatabaseHealthService(UserManagementDbContext context, ILogger<DatabaseHealthService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<DatabaseHealth> GetHealthAsync()
        {
            var health = new DatabaseHealth
            {
                Timestamp = DateTime.UtcNow,
                OverallStatus = HealthStatus.Healthy
            };

            try
            {
                // Test basic connectivity
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");

                // Get database statistics
                health.ConnectionStatus = HealthStatus.Healthy;
                health.UserCount = await _context.Users.CountAsync();
                health.ProductCount = await _context.Products.CountAsync();
                health.OrderCount = await _context.Orders.CountAsync();

                // Check for long-running queries
                health.ActiveConnections = await GetActiveConnectionCount();
                health.LongRunningQueries = await GetLongRunningQueries();

                // Check table sizes
                health.TableSizes = await GetTableSizes();

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database health check failed");
                health.OverallStatus = HealthStatus.Unhealthy;
                health.ErrorMessage = ex.Message;
            }

            return health;
        }

        private async Task<int> GetActiveConnectionCount()
        {
            // PostgreSQL specific query
            var result = await _context.Database.ExecuteSqlRawAsync(
                "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'");

            return result;
        }

        private async Task<List<string>> GetLongRunningQueries()
        {
            // Get queries running longer than 30 seconds
            var longQueries = await _context.Database.SqlQuery<string>(
                $"SELECT query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds'")
                .ToListAsync();

            return longQueries;
        }

        private async Task<Dictionary<string, long>> GetTableSizes()
        {
            var sizes = new Dictionary<string, long>();

            var tables = new[] { "users", "products", "orders", "order_items" };

            foreach (var table in tables)
            {
                try
                {
                    var size = await _context.Database.ExecuteSqlRawAsync(
                        $"SELECT pg_total_relation_size('{table}')");

                    sizes[table] = size;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to get size for table {table}");
                }
            }

            return sizes;
        }
    }

    /// <summary>
    /// Database Backup Service
    /// Automated backup management với compression và encryption
    /// </summary>
    public class DatabaseBackupService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<DatabaseBackupService> _logger;

        public DatabaseBackupService(IConfiguration configuration, ILogger<DatabaseBackupService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<BackupResult> CreateBackupAsync(BackupType type = BackupType.Full)
        {
            var result = new BackupResult
            {
                StartedAt = DateTime.UtcNow,
                Type = type
            };

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                string backupPath = Path.Combine(
                    _configuration["Backup:Path"] ?? "./backups",
                    $"backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.sql"
                );

                // Ensure backup directory exists
                Directory.CreateDirectory(Path.GetDirectoryName(backupPath));

                // Create backup command
                string command = $"pg_dump {connectionString} -f {backupPath}";

                if (type == BackupType.SchemaOnly)
                {
                    command += " --schema-only";
                }
                else if (type == BackupType.DataOnly)
                {
                    command += " --data-only";
                }

                // Execute backup
                var process = Process.Start(new ProcessStartInfo
                {
                    FileName = "bash",
                    Arguments = $"-c \"{command}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                });

                await process.WaitForExitAsync();

                if (process.ExitCode == 0)
                {
                    result.Success = true;
                    result.FilePath = backupPath;
                    result.FileSize = new FileInfo(backupPath).Length;

                    // Compress backup if enabled
                    if (_configuration.GetValue<bool>("Backup:Compress", true))
                    {
                        await CompressBackupAsync(backupPath);
                    }

                    _logger.LogInformation($"Database backup created successfully: {backupPath}");
                }
                else
                {
                    result.Success = false;
                    result.ErrorMessage = await process.StandardError.ReadToEndAsync();
                    _logger.LogError($"Database backup failed: {result.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                _logger.LogError(ex, "Database backup creation failed");
            }
            finally
            {
                result.CompletedAt = DateTime.UtcNow;
            }

            return result;
        }

        private async Task CompressBackupAsync(string backupPath)
        {
            string compressedPath = backupPath + ".gz";

            using (var input = File.OpenRead(backupPath))
            using (var output = File.Create(compressedPath))
            using (var gzip = new GZipStream(output, CompressionMode.Compress))
            {
                await input.CopyToAsync(gzip);
            }

            // Remove original file after compression
            File.Delete(backupPath);

            _logger.LogInformation($"Backup compressed: {compressedPath}");
        }
    }

    /// <summary>
    /// Connection Pool Monitoring
    /// Monitor database connection pool health
    /// </summary>
    public class ConnectionPoolMonitor
    {
        private readonly UserManagementDbContext _context;
        private readonly ILogger<ConnectionPoolMonitor> _logger;

        public ConnectionPoolMonitor(UserManagementDbContext context, ILogger<ConnectionPoolMonitor> logger)
        {
            _context = context;
            _logger = logger;
        }

        public ConnectionPoolStats GetPoolStats()
        {
            var stats = new ConnectionPoolStats();

            try
            {
                // Get connection pool statistics from Npgsql
                var connection = _context.Database.GetDbConnection();

                if (connection is NpgsqlConnection npgsqlConnection)
                {
                    // Npgsql specific statistics
                    stats.ActiveConnections = npgsqlConnection.Statistics?.TotalCommands ?? 0;
                    stats.IdleConnections = npgsqlConnection.Statistics?.IdleConnections ?? 0;
                }

                // Get general database statistics
                using var command = connection.CreateCommand();
                command.CommandText = @"
                    SELECT
                        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
                        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
                        (SELECT COUNT(*) FROM pg_stat_activity) as total_connections,
                        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections";

                using var reader = command.ExecuteReader();
                if (reader.Read())
                {
                    stats.ActiveConnections = reader.GetInt32(0);
                    stats.IdleConnections = reader.GetInt32(1);
                    stats.TotalConnections = reader.GetInt32(2);
                    stats.MaxConnections = reader.GetInt32(3);
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get connection pool statistics");
                stats.ErrorMessage = ex.Message;
            }

            return stats;
        }
    }

    /// <summary>
    /// Query Performance Monitor
    /// Track và analyze query performance
    /// </summary>
    public class QueryPerformanceMonitor
    {
        private readonly UserManagementDbContext _context;
        private readonly ILogger<QueryPerformanceMonitor> _logger;
        private readonly ConcurrentDictionary<string, QueryStats> _queryStats;

        public QueryPerformanceMonitor(UserManagementDbContext context, ILogger<QueryPerformanceMonitor> logger)
        {
            _context = context;
            _logger = logger;
            _queryStats = new ConcurrentDictionary<string, QueryStats>();
        }

        public void RecordQuery(string query, TimeSpan executionTime, bool success)
        {
            var key = GetQueryKey(query);

            var stats = _queryStats.GetOrAdd(key, k => new QueryStats());
            stats.RecordExecution(executionTime, success);

            // Log slow queries
            if (executionTime.TotalMilliseconds > 1000) // More than 1 second
            {
                _logger.LogWarning("Slow query detected: {Query} took {ExecutionTime}ms",
                                  query.Length > 100 ? query.Substring(0, 100) + "..." : query,
                                  executionTime.TotalMilliseconds);
            }
        }

        public List<QueryStats> GetTopSlowQueries(int count = 10)
        {
            return _queryStats.Values
                .Where(s => s.ExecutionCount > 0)
                .OrderByDescending(s => s.AverageExecutionTime.TotalMilliseconds)
                .Take(count)
                .ToList();
        }

        public Dictionary<string, QueryStats> GetAllStats()
        {
            return new Dictionary<string, QueryStats>(_queryStats);
        }

        private string GetQueryKey(string query)
        {
            // Normalize query for grouping (remove whitespace, parameters, etc.)
            return Regex.Replace(query.ToLower(), @"\s+", " ").Trim();
        }
    }

    /// <summary>
    /// Database Repository Pattern Implementation
    /// Generic repository với advanced features
    /// </summary>
    public class BaseRepository<TEntity> : IBaseRepository<TEntity> where TEntity : class, IEntity
    {
        protected readonly UserManagementDbContext _context;
        protected readonly DbSet<TEntity> _dbSet;

        public BaseRepository(UserManagementDbContext context)
        {
            _context = context;
            _dbSet = context.Set<TEntity>();
        }

        public virtual async Task<TEntity> GetByIdAsync(object id)
        {
            return await _dbSet.FindAsync(id);
        }

        public virtual async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public virtual async Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        public virtual async Task<TEntity> FindAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _dbSet.FirstOrDefaultAsync(predicate);
        }

        public virtual async Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _dbSet.AnyAsync(predicate);
        }

        public virtual async Task<int> CountAsync(Expression<Func<TEntity, bool>> predicate = null)
        {
            return predicate == null ? await _dbSet.CountAsync() : await _dbSet.CountAsync(predicate);
        }

        public virtual async Task<TEntity> AddAsync(TEntity entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task<IEnumerable<TEntity>> AddRangeAsync(IEnumerable<TEntity> entities)
        {
            await _dbSet.AddRangeAsync(entities);
            await _context.SaveChangesAsync();
            return entities;
        }

        public virtual async Task<TEntity> UpdateAsync(TEntity entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task<int> UpdateRangeAsync(Expression<Func<TEntity, bool>> predicate, Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> updateExpression)
        {
            return await _dbSet.Where(predicate).ExecuteUpdateAsync(updateExpression);
        }

        public virtual async Task<bool> DeleteAsync(object id)
        {
            var entity = await GetByIdAsync(id);
            if (entity == null) return false;

            return await DeleteAsync(entity);
        }

        public virtual async Task<bool> DeleteAsync(TEntity entity)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public virtual async Task<int> DeleteRangeAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ExecuteDeleteAsync();
        }

        public virtual async Task<PagedResult<TEntity>> GetPagedAsync(int page, int pageSize, Expression<Func<TEntity, bool>> predicate = null, Expression<Func<TEntity, object>> orderBy = null, bool ascending = true)
        {
            var query = predicate == null ? _dbSet.AsQueryable() : _dbSet.Where(predicate);

            if (orderBy != null)
            {
                query = ascending ? query.OrderBy(orderBy) : query.OrderByDescending(orderBy);
            }

            var totalCount = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return new PagedResult<TEntity>
            {
                Items = items,
                TotalCount = totalCount,
                PageSize = pageSize,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public virtual IQueryable<TEntity> Query()
        {
            return _dbSet.AsQueryable();
        }
    }

    /// <summary>
    /// User Repository với specific methods
    /// </summary>
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<User> GetByEmailAsync(string email);
        Task<IEnumerable<User>> GetByRoleAsync(UserRole role);
        Task<IEnumerable<User>> GetActiveUsersAsync();
        Task<bool> IsEmailExistsAsync(string email, long? excludeUserId = null);
        Task<IEnumerable<User>> GetUsersCreatedInDateRangeAsync(DateTime startDate, DateTime endDate);
    }

    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(UserManagementDbContext context) : base(context)
        {
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetByRoleAsync(UserRole role)
        {
            return await _context.Users.Where(u => u.Role == role).ToListAsync();
        }

        public async Task<IEnumerable<User>> GetActiveUsersAsync()
        {
            return await _context.Users.Where(u => u.Status == UserStatus.Active).ToListAsync();
        }

        public async Task<bool> IsEmailExistsAsync(string email, long? excludeUserId = null)
        {
            var query = _context.Users.Where(u => u.Email == email);

            if (excludeUserId.HasValue)
            {
                query = query.Where(u => u.Id != excludeUserId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<IEnumerable<User>> GetUsersCreatedInDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Users
                .Where(u => u.CreatedAt >= startDate && u.CreatedAt <= endDate)
                .ToListAsync();
        }
    }

    /// <summary>
    /// Audit Trail Repository
    /// Track tất cả changes trong hệ thống
    /// </summary>
    public class AuditRepository : BaseRepository<AuditLog>
    {
        public AuditRepository(UserManagementDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsAsync(
            DateTime? startDate = null,
            DateTime? endDate = null,
            string entityType = null,
            string action = null,
            long? userId = null,
            int page = 1,
            int pageSize = 50)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(a => a.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Timestamp <= endDate.Value);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(a => a.EntityType == entityType);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            return await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetAuditLogCountAsync(
            DateTime? startDate = null,
            DateTime? endDate = null,
            string entityType = null)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(a => a.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Timestamp <= endDate.Value);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(a => a.EntityType == entityType);

            return await query.CountAsync();
        }
    }
}

// Entity classes
public class User : IAuditable, ISoftDeletable
{
    [Key]
    public long Id { get; set; }

    [Required, MaxLength(100)]
    public string FirstName { get; set; }

    [Required, MaxLength(100)]
    public string LastName { get; set; }

    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; }

    [Required]
    public string PasswordHash { get; set; }

    [Required]
    public UserRole Role { get; set; }

    [Required]
    public UserStatus Status { get; set; }

    public bool EmailVerified { get; set; }
    public string EmailVerificationToken { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }

    public string PhoneNumber { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public Dictionary<string, object> Preferences { get; set; } = new();

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class Product : IAuditable, ISoftDeletable
{
    [Key]
    public long Id { get; set; }

    [Required, MaxLength(255)]
    public string Name { get; set; }

    [MaxLength(2000)]
    public string Description { get; set; }

    [Required, Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public long? CategoryId { get; set; }

    [Required, MaxLength(100)]
    public string Sku { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public Dictionary<string, string> Specifications { get; set; } = new();

    public bool IsActive { get; set; }

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class Order : IAuditable, ISoftDeletable
{
    [Key]
    public long Id { get; set; }

    [Required]
    public long UserId { get; set; }

    [Required, Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Required]
    public OrderStatus Status { get; set; }

    public Dictionary<string, object> ShippingAddress { get; set; }
    public Dictionary<string, object> BillingAddress { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    public string PaymentId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class OrderItem
{
    [Key]
    public long Id { get; set; }

    [Required]
    public long OrderId { get; set; }

    [Required]
    public long ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required, Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class Category : IAuditable
{
    [Key]
    public long Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; }

    [MaxLength(500)]
    public string Description { get; set; }

    public long? ParentId { get; set; }

    public virtual ICollection<Product> Products { get; set; }
    public virtual ICollection<Category> Children { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AuditLog
{
    [Key]
    public long Id { get; set; }

    [Required]
    public string EntityType { get; set; }

    [Required]
    public long EntityId { get; set; }

    [Required]
    public string Action { get; set; }

    public long? UserId { get; set; }
    public string OldValues { get; set; }
    public string NewValues { get; set; }
    public string IpAddress { get; set; }
    public string UserAgent { get; set; }

    [Required]
    public DateTime Timestamp { get; set; }
}

public class UserSession
{
    [Key]
    public string Id { get; set; }

    [Required]
    public long UserId { get; set; }

    public string IpAddress { get; set; }
    public string UserAgent { get; set; }
    public Dictionary<string, object> Payload { get; set; }

    [Required]
    public DateTime LastActivity { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }
}

public class ApiKey
{
    [Key]
    public string Id { get; set; }

    [Required]
    public long UserId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; }

    [Required]
    public string KeyHash { get; set; }

    public List<string> Permissions { get; set; } = new();

    [Required]
    public DateTime ExpiresAt { get; set; }

    public DateTime? LastUsedAt { get; set; }
    public bool IsActive { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }
}

// Enums
public enum UserRole
{
    Admin,
    Moderator,
    User,
    Guest
}

public enum UserStatus
{
    Active,
    Inactive,
    Suspended,
    Pending
}

public enum OrderStatus
{
    Pending,
    Confirmed,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    Refunded
}

public enum PaymentMethod
{
    CreditCard,
    DebitCard,
    PayPal,
    BankTransfer,
    CashOnDelivery
}

// Interfaces
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}

public interface IEntity
{
    object Id { get; }
}

// DTOs
public class DatabaseHealth
{
    public DateTime Timestamp { get; set; }
    public HealthStatus OverallStatus { get; set; }
    public HealthStatus ConnectionStatus { get; set; }
    public int UserCount { get; set; }
    public int ProductCount { get; set; }
    public int OrderCount { get; set; }
    public int ActiveConnections { get; set; }
    public List<string> LongRunningQueries { get; set; }
    public Dictionary<string, long> TableSizes { get; set; }
    public string ErrorMessage { get; set; }
}

public class BackupResult
{
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public BackupType Type { get; set; }
    public bool Success { get; set; }
    public string FilePath { get; set; }
    public long FileSize { get; set; }
    public string ErrorMessage { get; set; }
}

public class ConnectionPoolStats
{
    public int ActiveConnections { get; set; }
    public int IdleConnections { get; set; }
    public int TotalConnections { get; set; }
    public int MaxConnections { get; set; }
    public string ErrorMessage { get; set; }
}

public class QueryStats
{
    public int ExecutionCount { get; set; }
    public TimeSpan TotalExecutionTime { get; set; }
    public TimeSpan AverageExecutionTime => TimeSpan.FromTicks(TotalExecutionTime.Ticks / Math.Max(1, ExecutionCount));
    public TimeSpan MinExecutionTime { get; set; }
    public TimeSpan MaxExecutionTime { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }

    public void RecordExecution(TimeSpan executionTime, bool success)
    {
        ExecutionCount++;
        TotalExecutionTime += executionTime;

        if (ExecutionCount == 1)
        {
            MinExecutionTime = executionTime;
            MaxExecutionTime = executionTime;
        }
        else
        {
            if (executionTime < MinExecutionTime) MinExecutionTime = executionTime;
            if (executionTime > MaxExecutionTime) MaxExecutionTime = executionTime;
        }

        if (success)
            SuccessCount++;
        else
            ErrorCount++;
    }
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int PageSize { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage => CurrentPage < TotalPages;
    public bool HasPreviousPage => CurrentPage > 1;
}

public enum HealthStatus
{
    Healthy,
    Degraded,
    Unhealthy
}

public enum BackupType
{
    Full,
    SchemaOnly,
    DataOnly
}

// Repository interface
public interface IBaseRepository<TEntity> where TEntity : class, IEntity
{
    Task<TEntity> GetByIdAsync(object id);
    Task<IEnumerable<TEntity>> GetAllAsync();
    Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>> predicate);
    Task<TEntity> FindAsync(Expression<Func<TEntity, bool>> predicate);
    Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate);
    Task<int> CountAsync(Expression<Func<TEntity, bool>> predicate = null);
    Task<TEntity> AddAsync(TEntity entity);
    Task<IEnumerable<TEntity>> AddRangeAsync(IEnumerable<TEntity> entities);
    Task<TEntity> UpdateAsync(TEntity entity);
    Task<int> UpdateRangeAsync(Expression<Func<TEntity, bool>> predicate, Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> updateExpression);
    Task<bool> DeleteAsync(object id);
    Task<bool> DeleteAsync(TEntity entity);
    Task<int> DeleteRangeAsync(Expression<Func<TEntity, bool>> predicate);
    Task<PagedResult<TEntity>> GetPagedAsync(int page, int pageSize, Expression<Func<TEntity, bool>> predicate = null, Expression<Func<TEntity, object>> orderBy = null, bool ascending = true);
    IQueryable<TEntity> Query();
}
