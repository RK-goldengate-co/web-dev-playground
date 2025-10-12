import React, { useState, useEffect, FC } from 'react';
import { User, UserPreferences, ApiResponse } from './types';
import { ApiClient, Utils } from './utils';

interface AppProps {
  title?: string;
  apiBaseUrl?: string;
}

const App: FC<AppProps> = ({
  title = 'User Management System',
  apiBaseUrl = 'http://localhost:3000/api'
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<User['role'] | 'all'>('all');

  const apiClient = new ApiClient(apiBaseUrl);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response: ApiResponse<User[]> = await apiClient.getUsers();

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const response: ApiResponse<User> = await apiClient.createUser(userData);

      if (response.success && response.data) {
        setUsers(prevUsers => [...prevUsers, response.data!]);
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleUpdateUser = async (updatedUser: User): Promise<void> => {
    try {
      const response: ApiResponse<User> = await apiClient.updateUser(updatedUser.id, updatedUser);

      if (response.success && response.data) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === updatedUser.id ? response.data! : user
          )
        );
      } else {
        setError(response.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response: ApiResponse<void> = await apiClient.deleteUser(id);

      if (response.success) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      } else {
        setError(response.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleSearchChange = Utils.debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  return (
    <div className="user-management-app">
      <header className="app-header">
        <h1>{title}</h1>
        <p>TypeScript + React Application</p>
      </header>

      <main className="app-main">
        {/* Search and Filter Controls */}
        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <label htmlFor="role-filter">Filter by role:</label>
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as User['role'] | 'all')}
              className="role-filter"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          <button
            onClick={() => {/* Open create user modal */}}
            className="btn btn-primary"
          >
            Add User
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadUsers} className="btn btn-secondary">
              Retry
            </button>
          </div>
        )}

        {/* Users Grid */}
        {!loading && !error && (
          <div className="users-grid">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div key={user.id} className="user-card-wrapper">
                  <UserCard
                    user={user}
                    onUpdate={handleUpdateUser}
                    onDelete={handleDeleteUser}
                  />
                </div>
              ))
            ) : (
              <div className="no-users">
                <p>No users found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        <div className="statistics">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{users.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p className="stat-number">
              {users.filter(user => user.isActive).length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <p className="stat-number">
              {users.filter(user => user.role === 'admin').length}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

// User Card Component (inline for this example)
interface UserCardProps {
  user: User;
  onUpdate: (user: User) => void;
  onDelete: (id: number) => void;
}

const UserCard: FC<UserCardProps> = ({ user, onUpdate, onDelete }) => {
  return (
    <div className="user-card">
      <div className="user-avatar">
        {user.name.charAt(0).toUpperCase()}
      </div>

      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <span className={`role-badge role-${user.role}`}>
          {user.role}
        </span>
      </div>

      <div className="user-actions">
        <button
          onClick={() => {/* Open edit modal */}}
          className="btn btn-secondary"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(user.id)}
          className="btn btn-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default App;
