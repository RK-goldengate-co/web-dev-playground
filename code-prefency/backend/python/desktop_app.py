#!/usr/bin/env python3
"""
Python Desktop Application with PyQt6
Modern GUI application for user management
"""

import sys
import json
import sqlite3
from datetime import datetime
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QTableWidget, QTableWidgetItem,
                             QPushButton, QLineEdit, QComboBox, QMessageBox,
                             QHeaderView, QAbstractItemView, QDialog, QFormLayout,
                             QLabel, QSpinBox, QCheckBox)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QAction, QIcon


class User:
    def __init__(self, id=None, name="", email="", role="user", is_active=True):
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.is_active = is_active
        self.created_at = datetime.now().isoformat()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data):
        user = cls()
        user.id = data.get("id")
        user.name = data.get("name", "")
        user.email = data.get("email", "")
        user.role = data.get("role", "user")
        user.is_active = data.get("is_active", True)
        user.created_at = data.get("created_at", datetime.now().isoformat())
        return user


class Database:
    def __init__(self, db_name="users.db"):
        self.db_name = db_name
        self.init_db()

    def init_db(self):
        """Initialize database and create tables"""
        with sqlite3.connect(self.db_name) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role TEXT NOT NULL,
                    is_active BOOLEAN NOT NULL,
                    created_at TEXT NOT NULL,
                    preferences TEXT
                )
            """)

    def get_all_users(self):
        """Get all users from database"""
        with sqlite3.connect(self.db_name) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM users ORDER BY created_at DESC")
            return [User.from_dict(dict(row)) for row in cursor.fetchall()]

    def get_user_by_id(self, user_id):
        """Get user by ID"""
        with sqlite3.connect(self.db_name) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return User.from_dict(dict(row)) if row else None

    def add_user(self, user):
        """Add new user to database"""
        with sqlite3.connect(self.db_name) as conn:
            cursor = conn.execute("""
                INSERT INTO users (name, email, role, is_active, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (user.name, user.email, user.role, user.is_active, user.created_at))
            user.id = cursor.lastrowid
            return user

    def update_user(self, user):
        """Update existing user"""
        with sqlite3.connect(self.db_name) as conn:
            conn.execute("""
                UPDATE users SET name = ?, email = ?, role = ?, is_active = ?
                WHERE id = ?
            """, (user.name, user.email, user.role, user.is_active, user.id))
            return user

    def delete_user(self, user_id):
        """Delete user by ID"""
        with sqlite3.connect(self.db_name) as conn:
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            return conn.total_changes > 0

    def get_stats(self):
        """Get user statistics"""
        with sqlite3.connect(self.db_name) as conn:
            cursor = conn.execute("""
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
                    COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
                    COUNT(CASE WHEN role = 'user' THEN 1 END) as users
                FROM users
            """)
            row = cursor.fetchone()
            return {
                "total_users": row[0],
                "active_users": row[1],
                "inactive_users": row[0] - row[1],
                "admins": row[2],
                "moderators": row[3],
                "users": row[4]
            }


class AddUserDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add New User")
        self.setModal(True)
        self.resize(400, 300)

        layout = QVBoxLayout()

        # Form layout
        form_layout = QFormLayout()

        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Enter full name")
        form_layout.addRow("Name:", self.name_input)

        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Enter email address")
        form_layout.addRow("Email:", self.email_input)

        self.role_combo = QComboBox()
        self.role_combo.addItems(["user", "moderator", "admin"])
        form_layout.addRow("Role:", self.role_combo)

        self.active_checkbox = QCheckBox("Active")
        self.active_checkbox.setChecked(True)
        form_layout.addRow("", self.active_checkbox)

        layout.addLayout(form_layout)

        # Buttons
        buttons_layout = QHBoxLayout()

        save_button = QPushButton("Save")
        save_button.clicked.connect(self.accept)
        buttons_layout.addWidget(save_button)

        cancel_button = QPushButton("Cancel")
        cancel_button.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_button)

        layout.addLayout(buttons_layout)
        self.setLayout(layout)

    def get_user_data(self):
        return {
            "name": self.name_input.text().strip(),
            "email": self.email_input.text().strip(),
            "role": self.role_combo.currentText(),
            "is_active": self.active_checkbox.isChecked()
        }


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.db = Database()
        self.init_ui()
        self.load_users()

        # Auto-refresh timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.refresh_data)
        self.timer.start(30000)  # Refresh every 30 seconds

    def init_ui(self):
        """Initialize user interface"""
        self.setWindowTitle("User Management System")
        self.setGeometry(100, 100, 1000, 600)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Main layout
        layout = QVBoxLayout()

        # Toolbar
        toolbar_layout = QHBoxLayout()

        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search users...")
        self.search_input.textChanged.connect(self.filter_users)
        toolbar_layout.addWidget(self.search_input)

        self.role_filter = QComboBox()
        self.role_filter.addItem("All Roles", "")
        self.role_filter.addItems(["user", "moderator", "admin"])
        self.role_filter.currentIndexChanged.connect(self.filter_users)
        toolbar_layout.addWidget(self.role_filter)

        add_user_btn = QPushButton("Add User")
        add_user_btn.clicked.connect(self.show_add_user_dialog)
        toolbar_layout.addWidget(add_user_btn)

        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self.refresh_data)
        toolbar_layout.addWidget(refresh_btn)

        layout.addLayout(toolbar_layout)

        # Users table
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["ID", "Name", "Email", "Role", "Active", "Created"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)

        layout.addWidget(self.table)

        # Status bar
        self.status_label = QLabel("Ready")
        self.statusBar().addWidget(self.status_label)
        self.statusBar().addPermanentWidget(QLabel("PyQt6 User Management"))

        central_widget.setLayout(layout)

        # Menu bar
        menubar = self.menuBar()

        file_menu = menubar.addMenu("File")
        export_action = QAction("Export to JSON", self)
        export_action.triggered.connect(self.export_to_json)
        file_menu.addAction(export_action)

        help_menu = menubar.addMenu("Help")
        about_action = QAction("About", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)

    def load_users(self):
        """Load users from database and display in table"""
        try:
            users = self.db.get_all_users()
            self.display_users(users)
            self.status_label.setText(f"Loaded {len(users)} users")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load users: {str(e)}")

    def display_users(self, users):
        """Display users in table"""
        self.table.setRowCount(len(users))

        for row, user in enumerate(users):
            self.table.setItem(row, 0, QTableWidgetItem(str(user.id)))
            self.table.setItem(row, 1, QTableWidgetItem(user.name))
            self.table.setItem(row, 2, QTableWidgetItem(user.email))
            self.table.setItem(row, 3, QTableWidgetItem(user.role.title()))
            self.table.setItem(row, 4, QTableWidgetItem("Yes" if user.is_active else "No"))

            # Format date
            try:
                dt = datetime.fromisoformat(user.created_at.replace('Z', '+00:00'))
                self.table.setItem(row, 5, QTableWidgetItem(dt.strftime("%Y-%m-%d %H:%M")))
            except:
                self.table.setItem(row, 5, QTableWidgetItem(user.created_at))

    def filter_users(self):
        """Filter users based on search and role"""
        search_text = self.search_input.text().lower()
        role_filter = self.role_filter.currentData()

        for row in range(self.table.rowCount()):
            show_row = True

            # Search filter
            if search_text:
                name_item = self.table.item(row, 1)
                email_item = self.table.item(row, 2)
                if name_item and email_item:
                    if (search_text not in name_item.text().lower() and
                        search_text not in email_item.text().lower()):
                        show_row = False

            # Role filter
            if role_filter:
                role_item = self.table.item(row, 3)
                if role_item and role_item.text().lower() != role_filter:
                    show_row = False

            self.table.setRowHidden(row, not show_row)

    def show_add_user_dialog(self):
        """Show add user dialog"""
        dialog = AddUserDialog(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_user_data()

            if not data["name"] or not data["email"]:
                QMessageBox.warning(self, "Validation Error", "Name and email are required!")
                return

            try:
                user = User(name=data["name"], email=data["email"],
                           role=data["role"], is_active=data["is_active"])
                self.db.add_user(user)
                self.load_users()
                QMessageBox.information(self, "Success", "User added successfully!")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to add user: {str(e)}")

    def refresh_data(self):
        """Refresh user data"""
        self.load_users()

    def export_to_json(self):
        """Export users to JSON file"""
        try:
            users = self.db.get_all_users()
            data = {
                "exported_at": datetime.now().isoformat(),
                "total_users": len(users),
                "users": [user.to_dict() for user in users]
            }

            with open("users_export.json", "w") as f:
                json.dump(data, f, indent=2)

            QMessageBox.information(self, "Export Complete",
                                  f"Exported {len(users)} users to users_export.json")
        except Exception as e:
            QMessageBox.critical(self, "Export Error", f"Failed to export: {str(e)}")

    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(self, "About",
            "User Management System\n\n"
            "Built with PyQt6 and SQLite\n"
            "Modern desktop application for user management\n\n"
            "Version 1.0.0")


def main():
    app = QApplication(sys.argv)

    # Set application properties
    app.setApplicationName("User Management System")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("Code Prefency")

    # Apply dark theme (optional)
    app.setStyle("Fusion")

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
