// C++ Console Application for User Management
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <ctime>
#include <iomanip>
#include <sstream>

// User struct
struct User {
    int id;
    std::string name;
    std::string email;
    std::string role;
    bool isActive;
    time_t createdAt;

    User(int id, const std::string& name, const std::string& email,
         const std::string& role, bool isActive = true)
        : id(id), name(name), email(email), role(role), isActive(isActive) {
        createdAt = time(nullptr);
    }
};

// UserPreferences struct
struct UserPreferences {
    std::string theme = "light";
    bool notifications = true;
    std::string language = "en";
    std::string timezone = "UTC";
};

// UserManager class
class UserManager {
private:
    std::vector<User> users;
    int nextId = 1;

public:
    // Add new user
    void addUser(const std::string& name, const std::string& email,
                 const std::string& role) {
        // Check if email already exists
        for (const auto& user : users) {
            if (user.email == email) {
                std::cout << "Error: Email already exists!" << std::endl;
                return;
            }
        }

        User newUser(nextId++, name, email, role);
        users.push_back(newUser);
        std::cout << "User added successfully!" << std::endl;
    }

    // Display all users
    void displayUsers() const {
        if (users.empty()) {
            std::cout << "No users found." << std::endl;
            return;
        }

        std::cout << "\n=== User List ===" << std::endl;
        std::cout << std::left << std::setw(5) << "ID"
                  << std::setw(20) << "Name"
                  << std::setw(25) << "Email"
                  << std::setw(15) << "Role"
                  << std::setw(10) << "Active"
                  << std::setw(20) << "Created" << std::endl;
        std::cout << std::string(95, '-') << std::endl;

        for (const auto& user : users) {
            std::cout << std::left << std::setw(5) << user.id
                      << std::setw(20) << user.name.substr(0, 19)
                      << std::setw(25) << user.email.substr(0, 24)
                      << std::setw(15) << user.role.substr(0, 14)
                      << std::setw(10) << (user.isActive ? "Yes" : "No")
                      << std::setw(20) << formatDateTime(user.createdAt)
                      << std::endl;
        }
    }

    // Find user by ID
    User* findUserById(int id) {
        auto it = std::find_if(users.begin(), users.end(),
            [id](const User& user) { return user.id == id; });

        return (it != users.end()) ? &(*it) : nullptr;
    }

    // Update user
    bool updateUser(int id, const std::string& name, const std::string& email,
                   const std::string& role, bool isActive) {
        User* user = findUserById(id);
        if (!user) {
            std::cout << "Error: User not found!" << std::endl;
            return false;
        }

        // Check if new email already exists (excluding current user)
        for (const auto& u : users) {
            if (u.id != id && u.email == email) {
                std::cout << "Error: Email already exists!" << std::endl;
                return false;
            }
        }

        user->name = name;
        user->email = email;
        user->role = role;
        user->isActive = isActive;

        std::cout << "User updated successfully!" << std::endl;
        return true;
    }

    // Delete user
    bool deleteUser(int id) {
        auto it = std::remove_if(users.begin(), users.end(),
            [id](const User& user) { return user.id == id; });

        if (it != users.end()) {
            users.erase(it, users.end());
            std::cout << "User deleted successfully!" << std::endl;
            return true;
        }

        std::cout << "Error: User not found!" << std::endl;
        return false;
    }

    // Search users
    void searchUsers(const std::string& query) const {
        std::vector<User> results;

        for (const auto& user : users) {
            if (user.name.find(query) != std::string::npos ||
                user.email.find(query) != std::string::npos ||
                user.role.find(query) != std::string::npos) {
                results.push_back(user);
            }
        }

        if (results.empty()) {
            std::cout << "No users found matching: " << query << std::endl;
            return;
        }

        std::cout << "\n=== Search Results for: " << query << " ===" << std::endl;
        for (const auto& user : results) {
            std::cout << "ID: " << user.id << " | Name: " << user.name
                      << " | Email: " << user.email << " | Role: " << user.role
                      << " | Active: " << (user.isActive ? "Yes" : "No") << std::endl;
        }
    }

    // Get statistics
    void showStats() const {
        if (users.empty()) {
            std::cout << "No users to show statistics." << std::endl;
            return;
        }

        int totalUsers = users.size();
        int activeUsers = 0;
        int adminCount = 0;
        int moderatorCount = 0;
        int userCount = 0;

        for (const auto& user : users) {
            if (user.isActive) activeUsers++;

            if (user.role == "admin") adminCount++;
            else if (user.role == "moderator") moderatorCount++;
            else if (user.role == "user") userCount++;
        }

        std::cout << "\n=== User Statistics ===" << std::endl;
        std::cout << "Total Users: " << totalUsers << std::endl;
        std::cout << "Active Users: " << activeUsers << std::endl;
        std::cout << "Inactive Users: " << (totalUsers - activeUsers) << std::endl;
        std::cout << "Administrators: " << adminCount << std::endl;
        std::cout << "Moderators: " << moderatorCount << std::endl;
        std::cout << "Users: " << userCount << std::endl;
    }

    // Export users to CSV
    void exportToCSV() const {
        std::ofstream file("users.csv");
        if (!file) {
            std::cout << "Error: Cannot create CSV file!" << std::endl;
            return;
        }

        file << "ID,Name,Email,Role,IsActive,CreatedAt\n";
        for (const auto& user : users) {
            file << user.id << ","
                 << "\"" << user.name << "\","
                 << "\"" << user.email << "\","
                 << "\"" << user.role << "\","
                 << (user.isActive ? "true" : "false") << ","
                 << formatDateTime(user.createdAt) << "\n";
        }

        file.close();
        std::cout << "Users exported to users.csv successfully!" << std::endl;
    }

private:
    std::string formatDateTime(time_t timestamp) const {
        std::tm* tm = std::localtime(&timestamp);
        std::ostringstream oss;
        oss << std::put_time(tm, "%Y-%m-%d %H:%M:%S");
        return oss.str();
    }
};

// Menu system
void showMenu() {
    std::cout << "\n=== User Management System ===" << std::endl;
    std::cout << "1. Add User" << std::endl;
    std::cout << "2. Display All Users" << std::endl;
    std::cout << "3. Search Users" << std::endl;
    std::cout << "4. Update User" << std::endl;
    std::cout << "5. Delete User" << std::endl;
    std::cout << "6. Show Statistics" << std::endl;
    std::cout << "7. Export to CSV" << std::endl;
    std::cout << "0. Exit" << std::endl;
    std::cout << "Choose an option: ";
}

std::string getInput(const std::string& prompt) {
    std::string input;
    std::cout << prompt;
    std::getline(std::cin, input);
    return input;
}

int getIntInput(const std::string& prompt) {
    std::string input = getInput(prompt);
    try {
        return std::stoi(input);
    } catch (const std::exception&) {
        return -1;
    }
}

int main() {
    UserManager userManager;

    std::cout << "Welcome to User Management System (C++)" << std::endl;

    // Add some sample users for demonstration
    userManager.addUser("John Doe", "john.doe@example.com", "admin");
    userManager.addUser("Jane Smith", "jane.smith@example.com", "moderator");
    userManager.addUser("Bob Johnson", "bob.johnson@example.com", "user");

    int choice;
    do {
        showMenu();
        choice = getIntInput("");

        switch (choice) {
            case 1: {
                std::string name = getInput("Enter name: ");
                std::string email = getInput("Enter email: ");
                std::string role = getInput("Enter role (admin/moderator/user): ");
                userManager.addUser(name, email, role);
                break;
            }
            case 2:
                userManager.displayUsers();
                break;
            case 3: {
                std::string query = getInput("Enter search term: ");
                userManager.searchUsers(query);
                break;
            }
            case 4: {
                int id = getIntInput("Enter user ID to update: ");
                if (id > 0) {
                    User* user = userManager.findUserById(id);
                    if (user) {
                        std::string name = getInput("Enter new name (leave empty to keep current): ");
                        std::string email = getInput("Enter new email (leave empty to keep current): ");
                        std::string role = getInput("Enter new role (leave empty to keep current): ");

                        std::string currentName = name.empty() ? user->name : name;
                        std::string currentEmail = email.empty() ? user->email : email;
                        std::string currentRole = role.empty() ? user->role : role;

                        userManager.updateUser(id, currentName, currentEmail, currentRole, user->isActive);
                    } else {
                        std::cout << "User not found!" << std::endl;
                    }
                }
                break;
            }
            case 5: {
                int id = getIntInput("Enter user ID to delete: ");
                if (id > 0) {
                    userManager.deleteUser(id);
                }
                break;
            }
            case 6:
                userManager.showStats();
                break;
            case 7:
                userManager.exportToCSV();
                break;
            case 0:
                std::cout << "Goodbye!" << std::endl;
                break;
            default:
                std::cout << "Invalid option! Please try again." << std::endl;
                break;
        }

        if (choice != 0) {
            std::cout << "\nPress Enter to continue...";
            std::cin.get();
        }

    } while (choice != 0);

    return 0;
}
