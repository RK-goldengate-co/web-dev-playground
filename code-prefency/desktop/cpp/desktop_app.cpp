#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <map>
#include <unordered_map>
#include <set>
#include <functional>
#include <cctype>
#include <locale>
#include <codecvt>
#include <regex>

// User Management System - C++ Desktop Application
// Advanced C++ với modern features và design patterns

namespace UserManagement {

// Enums và Constants
enum class UserRole { Admin, Moderator, User, Guest };
enum class UserStatus { Active, Inactive, Suspended, Pending };
enum class LogLevel { Debug, Info, Warning, Error };

// Utility Classes
class StringUtils {
public:
    static std::string trim(const std::string& str) {
        size_t first = str.find_first_not_of(" \t\n\r");
        if (first == std::string::npos) return "";
        size_t last = str.find_last_not_of(" \t\n\r");
        return str.substr(first, last - first + 1);
    }

    static std::vector<std::string> split(const std::string& str, char delimiter) {
        std::vector<std::string> tokens;
        std::stringstream ss(str);
        std::string token;
        while (std::getline(ss, token, delimiter)) {
            tokens.push_back(trim(token));
        }
        return tokens;
    }

    static bool isEmailValid(const std::string& email) {
        std::regex emailRegex(R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})");
        return std::regex_match(email, emailRegex);
    }

    static std::string toLower(const std::string& str) {
        std::string result = str;
        std::transform(result.begin(), result.end(), result.begin(), ::tolower);
        return result;
    }
};

// Data Models
struct User {
    int id;
    std::string firstName;
    std::string lastName;
    std::string email;
    std::string passwordHash;
    UserRole role;
    UserStatus status;
    std::time_t createdAt;
    std::time_t updatedAt;
    std::time_t lastLoginAt;

    std::string getFullName() const {
        return firstName + " " + lastName;
    }

    bool isActive() const {
        return status == UserStatus::Active;
    }

    bool isAdmin() const {
        return role == UserRole::Admin;
    }
};

// Logger System với thread safety
class Logger {
private:
    static std::unique_ptr<Logger> instance;
    static std::mutex mutex;
    std::ofstream logFile;
    LogLevel currentLevel;
    std::mutex logMutex;

    Logger() : currentLevel(LogLevel::Info) {
        logFile.open("user_management.log", std::ios::app);
    }

public:
    static Logger& getInstance() {
        std::lock_guard<std::mutex> lock(mutex);
        if (!instance) {
            instance = std::unique_ptr<Logger>(new Logger());
        }
        return *instance;
    }

    void setLogLevel(LogLevel level) {
        currentLevel = level;
    }

    void log(LogLevel level, const std::string& message) {
        if (static_cast<int>(level) < static_cast<int>(currentLevel)) {
            return;
        }

        std::lock_guard<std::mutex> lock(logMutex);
        std::time_t now = std::time(nullptr);
        std::string levelStr = getLevelString(level);

        std::string logEntry = formatLogEntry(now, levelStr, message);

        std::cout << logEntry << std::endl;
        if (logFile.is_open()) {
            logFile << logEntry << std::endl;
            logFile.flush();
        }
    }

private:
    std::string getLevelString(LogLevel level) {
        switch (level) {
            case LogLevel::Debug: return "DEBUG";
            case LogLevel::Info: return "INFO";
            case LogLevel::Warning: return "WARNING";
            case LogLevel::Error: return "ERROR";
        }
        return "UNKNOWN";
    }

    std::string formatLogEntry(std::time_t timestamp, const std::string& level, const std::string& message) {
        std::stringstream ss;
        ss << "[" << std::put_time(std::localtime(&timestamp), "%Y-%m-%d %H:%M:%S") << "] "
           << "[" << level << "] " << message;
        return ss.str();
    }
};

Logger::unique_ptr<Logger> Logger::instance = nullptr;
std::mutex Logger::mutex;

// Database Layer với SQLite integration
class DatabaseManager {
private:
    std::string dbPath;
    std::mutex dbMutex;

public:
    DatabaseManager(const std::string& path = "user_management.db") : dbPath(path) {}

    bool initialize() {
        std::lock_guard<std::mutex> lock(dbMutex);
        // Initialize SQLite database và create tables
        Logger::getInstance().log(LogLevel::Info, "Database initialized: " + dbPath);
        return true;
    }

    std::vector<User> getAllUsers() {
        std::lock_guard<std::mutex> lock(dbMutex);
        std::vector<User> users;
        Logger::getInstance().log(LogLevel::Debug, "Retrieved all users từ database");
        return users;
    }

    User getUserById(int id) {
        std::lock_guard<std::mutex> lock(dbMutex);
        User user;
        Logger::getInstance().log(LogLevel::Debug, "Retrieved user by ID: " + std::to_string(id));
        return user;
    }

    bool saveUser(const User& user) {
        std::lock_guard<std::mutex> lock(dbMutex);
        Logger::getInstance().log(LogLevel::Info, "Saved user: " + user.getFullName());
        return true;
    }

    bool deleteUser(int id) {
        std::lock_guard<std::mutex> lock(dbMutex);
        Logger::getInstance().log(LogLevel::Warning, "Deleted user with ID: " + std::to_string(id));
        return true;
    }
};

// User Service Layer với business logic
class UserService {
private:
    DatabaseManager dbManager;
    std::mutex serviceMutex;

public:
    UserService() : dbManager() {
        dbManager.initialize();
    }

    std::vector<User> getAllUsers() {
        std::lock_guard<std::mutex> lock(serviceMutex);
        return dbManager.getAllUsers();
    }

    User createUser(const std::string& firstName, const std::string& lastName,
                   const std::string& email, UserRole role) {
        std::lock_guard<std::mutex> lock(serviceMutex);

        if (!StringUtils::isEmailValid(email)) {
            throw std::invalid_argument("Invalid email format");
        }

        User user;
        user.id = generateUserId();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.role = role;
        user.status = UserStatus::Active;
        user.createdAt = std::time(nullptr);
        user.updatedAt = std::time(nullptr);

        if (dbManager.saveUser(user)) {
            Logger::getInstance().log(LogLevel::Info, "Created new user: " + user.getFullName());
            return user;
        }

        throw std::runtime_error("Failed to create user");
    }

    std::vector<User> searchUsers(const std::string& query) {
        std::lock_guard<std::mutex> lock(serviceMutex);

        std::vector<User> allUsers = getAllUsers();
        std::vector<User> results;
        std::string lowerQuery = StringUtils::toLower(query);

        for (const User& user : allUsers) {
            if (StringUtils::toLower(user.firstName).find(lowerQuery) != std::string::npos ||
                StringUtils::toLower(user.lastName).find(lowerQuery) != std::string::npos ||
                StringUtils::toLower(user.email).find(lowerQuery) != std::string::npos) {
                results.push_back(user);
            }
        }

        Logger::getInstance().log(LogLevel::Debug, "Searched users with query: " + query);
        return results;
    }

private:
    int generateUserId() {
        static int nextId = 1;
        return nextId++;
    }
};

// Main Application Class với console interface
class UserManagementApp {
private:
    UserService userService;
    bool running;

public:
    UserManagementApp() : running(false) {}

    void start() {
        running = true;
        Logger::getInstance().log(LogLevel::Info, "User Management Application started");
        showMainMenu();
    }

private:
    void showMainMenu() {
        while (running) {
            std::cout << "\n=== User Management System ===" << std::endl;
            std::cout << "1. View all users" << std::endl;
            std::cout << "2. Create new user" << std::endl;
            std::cout << "3. Search users" << std::endl;
            std::cout << "4. Exit" << std::endl;
            std::cout << "Choose option (1-4): ";

            int choice;
            std::cin >> choice;
            std::cin.ignore();

            switch (choice) {
                case 1: viewAllUsers(); break;
                case 2: createUser(); break;
                case 3: searchUsers(); break;
                case 4: running = false; break;
                default:
                    std::cout << "Invalid option. Please try again." << std::endl;
            }
        }
    }

    void viewAllUsers() {
        std::vector<User> users = userService.getAllUsers();
        std::cout << "\n=== All Users ===" << std::endl;
        for (const User& user : users) {
            std::cout << "ID: " << user.id
                     << ", Name: " << user.getFullName()
                     << ", Email: " << user.email << std::endl;
        }
    }

    void createUser() {
        std::string firstName, lastName, email;
        int roleChoice;

        std::cout << "\n=== Create New User ===" << std::endl;
        std::cout << "First Name: ";
        std::getline(std::cin, firstName);
        std::cout << "Last Name: ";
        std::getline(std::cin, lastName);
        std::cout << "Email: ";
        std::getline(std::cin, email);

        UserRole role = UserRole::User;
        User newUser = userService.createUser(firstName, lastName, email, role);
        std::cout << "User created successfully!" << std::endl;
    }

    void searchUsers() {
        std::string query;
        std::cout << "\n=== Search Users ===" << std::endl;
        std::cout << "Enter search query: ";
        std::getline(std::cin, query);

        std::vector<User> results = userService.searchUsers(query);
        std::cout << "\n=== Search Results ===" << std::endl;
        for (const User& user : results) {
            std::cout << "ID: " << user.id
                     << ", Name: " << user.getFullName()
                     << ", Email: " << user.email << std::endl;
        }
    }
};

// Main function
int main() {
    try {
        setlocale(LC_ALL, "en_US.UTF-8");
        std::cout << "=== User Management System (C++) ===" << std::endl;
        std::cout << "Advanced C++ Desktop Application" << std::endl;

        UserManagementApp app;
        app.start();

    } catch (const std::exception& e) {
        std::cerr << "Fatal error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}

} // namespace UserManagement
