// Header file for User Management System
// Contains type definitions, function declarations, and macros

#ifndef USER_MANAGEMENT_H
#define USER_MANAGEMENT_H

#include <stdbool.h>
#include <time.h>

// Constants and macros
#define MAX_NAME_LENGTH 100
#define MAX_EMAIL_LENGTH 255
#define MAX_USERS 1000
#define DATABASE_FILE "users.db"

// User roles enumeration
typedef enum {
    USER_ROLE_USER = 0,
    USER_ROLE_MODERATOR = 1,
    USER_ROLE_ADMIN = 2
} UserRole;

// User status enumeration
typedef enum {
    USER_STATUS_INACTIVE = 0,
    USER_STATUS_ACTIVE = 1,
    USER_STATUS_SUSPENDED = 2,
    USER_STATUS_DELETED = 3
} UserStatus;

// User preferences structure
typedef struct {
    char theme[20];           // "light", "dark", "auto"
    bool notifications;       // Enable/disable notifications
    char language[10];        // Language code (e.g., "en", "vi")
    char timezone[50];        // Timezone string
} UserPreferences;

// Main user structure
typedef struct {
    int id;
    char name[MAX_NAME_LENGTH];
    char email[MAX_EMAIL_LENGTH];
    UserRole role;
    UserStatus status;
    time_t created_at;
    time_t updated_at;
    UserPreferences preferences;
} User;

// Database structure
typedef struct {
    User users[MAX_USERS];
    int count;
    int next_id;
} UserDatabase;

// Function declarations

// Database management functions
bool init_database(UserDatabase* db);
bool save_database(UserDatabase* db);
bool load_database(UserDatabase* db);

// User management functions
int add_user(UserDatabase* db, const char* name, const char* email, UserRole role);
bool update_user(UserDatabase* db, int user_id, const char* name, const char* email, UserRole role, UserStatus status);
bool delete_user(UserDatabase* db, int user_id);
User* find_user_by_id(UserDatabase* db, int user_id);
User* find_user_by_email(UserDatabase* db, const char* email);

// Search and filter functions
void search_users_by_name(UserDatabase* db, const char* name_query, User* results[], int* result_count);
void search_users_by_email(UserDatabase* db, const char* email_query, User* results[], int* result_count);
void filter_users_by_role(UserDatabase* db, UserRole role, User* results[], int* result_count);
void filter_users_by_status(UserDatabase* db, UserStatus status, User* results[], int* result_count);

// Statistics functions
int get_total_users(UserDatabase* db);
int get_active_users(UserDatabase* db);
int get_users_by_role(UserDatabase* db, UserRole role);
int get_users_by_status(UserDatabase* db, UserStatus status);

// Utility functions
const char* role_to_string(UserRole role);
const char* status_to_string(UserStatus status);
bool is_valid_email(const char* email);
bool is_valid_name(const char* name);
char* trim_string(char* str);
char* strtolower(char* str);
char* strtoupper(char* str);

// Memory management
void free_user_results(User* results[], int count);

// Error handling macros
#define CHECK_NULL(ptr, msg) \
    if (ptr == NULL) { \
        fprintf(stderr, "Error: %s\n", msg); \
        return false; \
    }

#define CHECK_DB(db) \
    if (db == NULL || db->count < 0) { \
        fprintf(stderr, "Error: Invalid database\n"); \
        return false; \
    }

#define LOG_ERROR(msg) \
    fprintf(stderr, "[ERROR] %s at %s:%d\n", msg, __FILE__, __LINE__)

#define LOG_INFO(msg) \
    fprintf(stdout, "[INFO] %s\n", msg)

// Validation macros
#define IS_VALID_EMAIL(email) (email && strlen(email) > 0 && strlen(email) <= MAX_EMAIL_LENGTH && is_valid_email(email))
#define IS_VALID_NAME(name) (name && strlen(name) > 0 && strlen(name) <= MAX_NAME_LENGTH && is_valid_name(name))
#define IS_VALID_ROLE(role) (role >= USER_ROLE_USER && role <= USER_ROLE_ADMIN)
#define IS_VALID_STATUS(status) (status >= USER_STATUS_INACTIVE && status <= USER_STATUS_DELETED)

// Database operations macros
#define DB_FILE_EXISTS(filename) (access(filename, F_OK) == 0)
#define CREATE_DB_DIR() mkdir("data", 0755)

// Function pointer types for extensibility
typedef bool (*UserFilter)(const User* user, void* context);
typedef void (*UserProcessor)(User* user, void* context);

// Advanced search with custom filters
int search_users_advanced(UserDatabase* db, UserFilter filter, void* context, User* results[], int max_results);

// Batch operations
bool batch_update_users(UserDatabase* db, int user_ids[], int count, UserProcessor processor, void* context);
bool batch_delete_users(UserDatabase* db, int user_ids[], int count);

// Export/Import functions
bool export_users_to_csv(UserDatabase* db, const char* filename);
bool export_users_to_json(UserDatabase* db, const char* filename);
bool import_users_from_csv(UserDatabase* db, const char* filename);
bool import_users_from_json(UserDatabase* db, const char* filename);

// Audit and logging functions
void log_user_action(const char* action, int user_id, const char* details);
void generate_audit_report(UserDatabase* db, const char* filename);

// Performance monitoring
typedef struct {
    time_t start_time;
    time_t end_time;
    int operations_count;
    double avg_response_time;
} PerformanceMetrics;

void start_performance_monitor(PerformanceMetrics* metrics);
void end_performance_monitor(PerformanceMetrics* metrics);
void print_performance_report(PerformanceMetrics* metrics);

// Thread-safe operations (for multi-threaded applications)
#ifdef _WIN32
    #include <windows.h>
    typedef CRITICAL_SECTION Mutex;
    #define MUTEX_INIT(mutex) InitializeCriticalSection(&mutex)
    #define MUTEX_LOCK(mutex) EnterCriticalSection(&mutex)
    #define MUTEX_UNLOCK(mutex) LeaveCriticalSection(&mutex)
    #define MUTEX_DESTROY(mutex) DeleteCriticalSection(&mutex)
#else
    #include <pthread.h>
    typedef pthread_mutex_t Mutex;
    #define MUTEX_INIT(mutex) pthread_mutex_init(&mutex, NULL)
    #define MUTEX_LOCK(mutex) pthread_mutex_lock(&mutex)
    #define MUTEX_UNLOCK(mutex) pthread_mutex_unlock(&mutex)
    #define MUTEX_DESTROY(mutex) pthread_mutex_destroy(&mutex)
#endif

// Thread-safe database operations
bool thread_safe_add_user(UserDatabase* db, Mutex* mutex, const char* name, const char* email, UserRole role);
bool thread_safe_update_user(UserDatabase* db, Mutex* mutex, int user_id, const char* name, const char* email, UserRole role);
bool thread_safe_delete_user(UserDatabase* db, Mutex* mutex, int user_id);

// Memory pool for efficient memory management
#define MEMORY_POOL_SIZE 1024 * 1024  // 1MB pool

typedef struct {
    char pool[MEMORY_POOL_SIZE];
    size_t offset;
    Mutex mutex;
} MemoryPool;

bool init_memory_pool(MemoryPool* pool);
void* pool_alloc(MemoryPool* pool, size_t size);
void pool_free(MemoryPool* pool, void* ptr);
void destroy_memory_pool(MemoryPool* pool);

// Configuration management
typedef struct {
    char db_path[MAX_PATH];
    int max_users;
    bool enable_logging;
    bool enable_audit;
    int session_timeout;
    char default_timezone[50];
} SystemConfig;

bool load_config(const char* filename, SystemConfig* config);
bool save_config(const char* filename, SystemConfig* config);

// Plugin system for extensibility
typedef struct {
    char name[100];
    char version[20];
    void* handle;  // Plugin handle (platform specific)
    bool (*initialize)();
    bool (*cleanup)();
    User* (*process_user)(User* user);
} Plugin;

bool load_plugin(const char* filename, Plugin* plugin);
bool unload_plugin(Plugin* plugin);
int get_loaded_plugins(Plugin plugins[], int max_plugins);

// Network utilities
bool send_user_notification(User* user, const char* message);
bool check_email_deliverability(const char* email);
int get_user_activity_score(User* user);

// Backup and recovery
bool create_backup(UserDatabase* db, const char* filename);
bool restore_backup(UserDatabase* db, const char* filename);
bool validate_backup_integrity(const char* filename);

// Data validation functions
bool validate_user_data(const User* user);
bool sanitize_user_input(char* input);
bool check_password_strength(const char* password);

// Rate limiting
typedef struct {
    time_t window_start;
    int request_count;
    int max_requests;
    time_t window_duration;
} RateLimiter;

bool init_rate_limiter(RateLimiter* limiter, int max_requests, time_t window_duration);
bool check_rate_limit(RateLimiter* limiter, const char* identifier);

// Caching layer
typedef struct {
    User* cache[MAX_USERS];
    time_t timestamps[MAX_USERS];
    Mutex mutex;
} UserCache;

bool init_user_cache(UserCache* cache);
User* get_cached_user(UserCache* cache, int user_id);
bool set_cached_user(UserCache* cache, User* user);
void clear_user_cache(UserCache* cache);

// Internationalization support
typedef struct {
    char language[10];
    char country[10];
    char locale[20];
} Locale;

bool set_locale(Locale* locale, const char* language, const char* country);
const char* get_localized_string(Locale* locale, const char* key);

// Testing utilities
#ifdef TEST_MODE
void run_unit_tests();
void run_integration_tests();
void generate_test_report(const char* filename);
#endif

#endif // USER_MANAGEMENT_H
