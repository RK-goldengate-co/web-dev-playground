# User Management System - Beginner Friendly Implementation
# Using Python - The most beginner-friendly programming language

import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Optional

# Define colors for better visual output
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    RESET = '\033[0m'

# User class - simple and easy to understand
class User:
    def __init__(self, name: str, email: str, role: str = "user"):
        self.name = name
        self.email = email
        self.role = role
        self.is_active = True
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self) -> Dict:
        """Convert user to dictionary for saving"""
        return {
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'User':
        """Create user from dictionary"""
        user = cls(data["name"], data["email"], data["role"])
        user.is_active = data["is_active"]
        user.created_at = data["created_at"]
        return user

# User Manager - handles all user operations
class UserManager:
    def __init__(self, filename: str = "users.json"):
        self.filename = filename
        self.users: List[User] = []
        self.load_users()

    def load_users(self) -> None:
        """Load users from file"""
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    data = json.load(f)
                    self.users = [User.from_dict(user_data) for user_data in data]
                print(f"{Colors.GREEN}✓ Loaded {len(self.users)} users from {self.filename}{Colors.RESET}")
            except Exception as e:
                print(f"{Colors.RED}✗ Error loading users: {e}{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}⚠ No existing user file found. Starting fresh!{Colors.RESET}")

    def save_users(self) -> None:
        """Save users to file"""
        try:
            data = [user.to_dict() for user in self.users]
            with open(self.filename, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"{Colors.GREEN}✓ Users saved to {self.filename}{Colors.RESET}")
        except Exception as e:
            print(f"{Colors.RED}✗ Error saving users: {e}{Colors.RESET}")

    def add_user(self, name: str, email: str, role: str = "user") -> bool:
        """Add a new user"""
        # Check if email already exists
        for user in self.users:
            if user.email == email:
                print(f"{Colors.RED}✗ Email '{email}' already exists!{Colors.RESET}")
                return False

        # Create and add new user
        new_user = User(name, email, role)
        self.users.append(new_user)

        print(f"{Colors.GREEN}✓ Added user: {name} ({email}){Colors.RESET}")
        self.save_users()
        return True

    def display_users(self) -> None:
        """Display all users in a nice format"""
        if not self.users:
            print(f"{Colors.YELLOW}📭 No users found.{Colors.RESET}")
            return

        print(f"\n{Colors.CYAN}=== User List ==={Colors.RESET}")
        print(f"{Colors.WHITE}{'ID':<3} {'Name':<20} {'Email':<25} {'Role':<12} {'Active':<8} {'Created':<19}{Colors.RESET}")
        print("-" * 90)

        for i, user in enumerate(self.users, 1):
            active_status = "✓" if user.is_active else "✗"
            print(f"{Colors.WHITE}{i:<3} {user.name:<20} {user.email:<25} {user.role:<12} {active_status:<8} {user.created_at:<19}{Colors.RESET}")

        print(f"\n{Colors.BLUE}Total users: {len(self.users)}{Colors.RESET}")

    def search_users(self, query: str) -> None:
        """Search users by name or email"""
        results = []
        query_lower = query.lower()

        for user in self.users:
            if (query_lower in user.name.lower() or
                query_lower in user.email.lower()):
                results.append(user)

        if not results:
            print(f"{Colors.YELLOW}🔍 No users found for: '{query}'{Colors.RESET}")
            return

        print(f"\n{Colors.CYAN}=== Search Results for: '{query}' ==={Colors.RESET}")
        for user in results:
            print(f"• {user.name} ({user.email}) - {user.role}")

    def update_user(self, email: str, **updates) -> bool:
        """Update user information"""
        for user in self.users:
            if user.email == email:
                # Update allowed fields
                if 'name' in updates:
                    user.name = updates['name']
                if 'role' in updates:
                    user.role = updates['role']
                if 'is_active' in updates:
                    user.is_active = updates['is_active']

                print(f"{Colors.GREEN}✓ Updated user: {user.name}{Colors.RESET}")
                self.save_users()
                return True

        print(f"{Colors.RED}✗ User with email '{email}' not found{Colors.RESET}")
        return False

    def delete_user(self, email: str) -> bool:
        """Delete user by email"""
        for i, user in enumerate(self.users):
            if user.email == email:
                deleted_user = self.users.pop(i)
                print(f"{Colors.GREEN}✓ Deleted user: {deleted_user.name}{Colors.RESET}")
                self.save_users()
                return True

        print(f"{Colors.RED}✗ User with email '{email}' not found{Colors.RESET}")
        return False

    def export_to_csv(self, filename: str = "users.csv") -> None:
        """Export users to CSV file"""
        try:
            with open(filename, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Name", "Email", "Role", "Active", "Created At"])

                for user in self.users:
                    writer.writerow([
                        user.name,
                        user.email,
                        user.role,
                        "Yes" if user.is_active else "No",
                        user.created_at
                    ])

            print(f"{Colors.GREEN}✓ Exported {len(self.users)} users to {filename}{Colors.RESET}")
        except Exception as e:
            print(f"{Colors.RED}✗ Error exporting to CSV: {e}{Colors.RESET}")

    def get_stats(self) -> Dict[str, int]:
        """Get user statistics"""
        total = len(self.users)
        active = sum(1 for user in self.users if user.is_active)

        role_counts = {}
        for user in self.users:
            role_counts[user.role] = role_counts.get(user.role, 0) + 1

        return {
            "total_users": total,
            "active_users": active,
            "inactive_users": total - active,
            "role_distribution": role_counts
        }

# Main menu function
def show_menu() -> None:
    """Display the main menu"""
    print(f"\n{Colors.CYAN}=== User Management System ==={Colors.RESET}")
    print(f"{Colors.WHITE}1. Add User{Colors.RESET}")
    print(f"{Colors.WHITE}2. Display Users{Colors.RESET}")
    print(f"{Colors.WHITE}3. Search Users{Colors.RESET}")
    print(f"{Colors.WHITE}4. Update User{Colors.RESET}")
    print(f"{Colors.WHITE}5. Delete User{Colors.RESET}")
    print(f"{Colors.WHITE}6. Show Statistics{Colors.RESET}")
    print(f"{Colors.WHITE}7. Export to CSV{Colors.RESET}")
    print(f"{Colors.WHITE}0. Exit{Colors.RESET}")
    print(f"{Colors.YELLOW}Choose an option (0-7):{Colors.RESET} ", end="")

# Input helper functions
def get_string_input(prompt: str) -> str:
    """Get string input from user"""
    print(f"{Colors.BLUE}{prompt}{Colors.RESET}", end="")
    return input().strip()

def get_int_input(prompt: str, min_val: int = 0, max_val: int = 100) -> int:
    """Get integer input from user with validation"""
    while True:
        try:
            value = int(get_string_input(prompt))
            if min_val <= value <= max_val:
                return value
            else:
                print(f"{Colors.RED}✗ Please enter a number between {min_val} and {max_val}{Colors.RESET}")
        except ValueError:
            print(f"{Colors.RED}✗ Please enter a valid number{Colors.RESET}")

def get_yes_no_input(prompt: str) -> bool:
    """Get yes/no input from user"""
    while True:
        response = get_string_input(prompt).lower()
        if response in ['y', 'yes']:
            return True
        elif response in ['n', 'no']:
            return False
        else:
            print(f"{Colors.RED}✗ Please enter 'y' or 'n'{Colors.RESET}")

# Main program
def main():
    """Main program function"""
    print(f"{Colors.GREEN}🚀 Welcome to User Management System!{Colors.RESET}")
    print(f"{Colors.CYAN}Built with Python - Perfect for beginners! 🐍{Colors.RESET}")

    # Create user manager
    manager = UserManager()

    # Add some sample users for demonstration
    if len(manager.users) == 0:
        print(f"\n{Colors.YELLOW}📝 Adding sample users for demonstration...{Colors.RESET}")
        manager.add_user("Alice Johnson", "alice@example.com", "admin")
        manager.add_user("Bob Smith", "bob@example.com", "moderator")
        manager.add_user("Carol Davis", "carol@example.com", "user")

    while True:
        show_menu()
        choice = get_int_input("", 0, 7)

        if choice == 1:
            # Add user
            name = get_string_input("Enter name: ")
            email = get_string_input("Enter email: ")
            role = get_string_input("Enter role (user/moderator/admin): ").lower()

            if role not in ["user", "moderator", "admin"]:
                role = "user"

            manager.add_user(name, email, role)

        elif choice == 2:
            # Display users
            manager.display_users()

        elif choice == 3:
            # Search users
            query = get_string_input("Enter search term: ")
            manager.search_users(query)

        elif choice == 4:
            # Update user
            email = get_string_input("Enter user email to update: ")
            print("Leave fields empty to keep current values:")

            new_name = get_string_input("New name: ")
            new_role = get_string_input("New role: ")

            updates = {}
            if new_name:
                updates['name'] = new_name
            if new_role:
                updates['role'] = new_role

            if updates:
                manager.update_user(email, **updates)

        elif choice == 5:
            # Delete user
            email = get_string_input("Enter user email to delete: ")

            if get_yes_no_input(f"Are you sure you want to delete '{email}'? (y/n): "):
                manager.delete_user(email)

        elif choice == 6:
            # Show statistics
            stats = manager.get_stats()
            print(f"\n{Colors.CYAN}=== Statistics ==={Colors.RESET}")
            print(f"Total Users: {Colors.GREEN}{stats['total_users']}{Colors.RESET}")
            print(f"Active Users: {Colors.GREEN}{stats['active_users']}{Colors.RESET}")
            print(f"Inactive Users: {Colors.RED}{stats['inactive_users']}{Colors.RESET}")

            print(f"\nRole Distribution:")
            for role, count in stats['role_distribution'].items():
                print(f"  {role.title()}: {Colors.BLUE}{count}{Colors.RESET}")

        elif choice == 7:
            # Export to CSV
            filename = get_string_input("Enter CSV filename (default: users.csv): ")
            if not filename:
                filename = "users.csv"
            manager.export_to_csv(filename)

        elif choice == 0:
            # Exit
            print(f"{Colors.GREEN}👋 Thanks for using User Management System! Goodbye!{Colors.RESET}")
            break

        # Pause before showing menu again
        if choice != 0:
            input(f"\n{Colors.YELLOW}Press Enter to continue...{Colors.RESET}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}👋 Program interrupted. Goodbye!{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.RED}✗ An error occurred: {e}{Colors.RESET}")
        print(f"{Colors.YELLOW}Please check your input and try again.{Colors.RESET}")
