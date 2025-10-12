package com.codeprefency.usermanagement

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.lifecycle.asLiveData
import androidx.lifecycle.liveData
import androidx.lifecycle.switchMap
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.cachedIn
import kotlinx.coroutines.flow.Flow

/**
 * UserViewModel - Kotlin ViewModel với LiveData và Coroutines
 * MVVM pattern với reactive programming và async operations
 */
class UserViewModel(application: Application) : AndroidViewModel(application) {

    private val userRepository = UserRepository.getInstance(application)

    // LiveData cho UI state
    private val _uiState = MutableLiveData<UIState>()
    val uiState: LiveData<UIState> = _uiState

    private val _currentUser = MutableLiveData<User?>()
    val currentUser: LiveData<User?> = _currentUser

    private val _userList = MutableLiveData<List<User>>()
    val userList: LiveData<List<User>> = _userList

    // Search và filter
    private val _searchQuery = MutableLiveData<String>("")
    val searchQuery: LiveData<String> = _searchQuery

    private val _selectedRole = MutableLiveData<UserRole?>()
    val selectedRole: LiveData<UserRole?> = _selectedRole

    // Paging support
    val usersFlow: Flow<PagingData<User>> = Pager(
        config = PagingConfig(
            pageSize = 20,
            enablePlaceholders = false,
            prefetchDistance = 5
        ),
        pagingSourceFactory = { UserPagingSource(userRepository) }
    ).flow.cachedIn(viewModelScope)

    // Filtered users dựa trên search và role
    val filteredUsers = searchQuery.switchMap { query ->
        selectedRole.switchMap { role ->
            liveData {
                val users = withContext(Dispatchers.IO) {
                    if (query.isEmpty() && role == null) {
                        userRepository.getAllUsers()
                    } else {
                        userRepository.searchUsers(query, role)
                    }
                }
                emit(users)
            }
        }
    }

    init {
        loadUsers()
        loadCurrentUser()
    }

    /**
     * Load tất cả users
     */
    fun loadUsers() {
        _uiState.value = UIState.Loading

        viewModelScope.launch {
            try {
                val users = withContext(Dispatchers.IO) {
                    userRepository.getAllUsers()
                }
                _userList.value = users
                _uiState.value = UIState.Success

            } catch (e: Exception) {
                _uiState.value = UIState.Error(e.message ?: "Unknown error")
                e.printStackTrace()
            }
        }
    }

    /**
     * Load current user từ shared preferences
     */
    private fun loadCurrentUser() {
        viewModelScope.launch {
            try {
                val user = withContext(Dispatchers.IO) {
                    userRepository.getCurrentUser()
                }
                _currentUser.value = user

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Create new user
     */
    fun createUser(user: User) {
        _uiState.value = UIState.Loading

        viewModelScope.launch {
            try {
                val createdUser = withContext(Dispatchers.IO) {
                    userRepository.createUser(user)
                }

                // Refresh user list
                loadUsers()

                // Show success message
                _uiState.value = UIState.SuccessWithMessage("User created successfully")

            } catch (e: Exception) {
                _uiState.value = UIState.Error(e.message ?: "Failed to create user")
                e.printStackTrace()
            }
        }
    }

    /**
     * Update user
     */
    fun updateUser(user: User) {
        _uiState.value = UIState.Loading

        viewModelScope.launch {
            try {
                val updatedUser = withContext(Dispatchers.IO) {
                    userRepository.updateUser(user)
                }

                // Update current user if it's the same user
                if (_currentUser.value?.id == user.id) {
                    _currentUser.value = updatedUser
                }

                // Refresh user list
                loadUsers()

                _uiState.value = UIState.SuccessWithMessage("User updated successfully")

            } catch (e: Exception) {
                _uiState.value = UIState.Error(e.message ?: "Failed to update user")
                e.printStackTrace()
            }
        }
    }

    /**
     * Delete user
     */
    fun deleteUser(userId: Long) {
        _uiState.value = UIState.Loading

        viewModelScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    userRepository.deleteUser(userId)
                }

                // Refresh user list
                loadUsers()

                _uiState.value = UIState.SuccessWithMessage("User deleted successfully")

            } catch (e: Exception) {
                _uiState.value = UIState.Error(e.message ?: "Failed to delete user")
                e.printStackTrace()
            }
        }
    }

    /**
     * Search users
     */
    fun searchUsers(query: String) {
        _searchQuery.value = query
    }

    /**
     * Filter by role
     */
    fun filterByRole(role: UserRole?) {
        _selectedRole.value = role
    }

    /**
     * Login user
     */
    fun loginUser(email: String, password: String) {
        _uiState.value = UIState.Loading

        viewModelScope.launch {
            try {
                val user = withContext(Dispatchers.IO) {
                    userRepository.loginUser(email, password)
                }

                _currentUser.value = user
                _uiState.value = UIState.SuccessWithMessage("Login successful")

            } catch (e: Exception) {
                _uiState.value = UIState.Error(e.message ?: "Login failed")
                e.printStackTrace()
            }
        }
    }

    /**
     * Logout user
     */
    fun logoutUser() {
        viewModelScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    userRepository.logoutUser()
                }

                _currentUser.value = null
                _uiState.value = UIState.SuccessWithMessage("Logout successful")

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Refresh data
     */
    fun refreshData() {
        loadUsers()
        loadCurrentUser()
    }

    /**
     * Retry failed operation
     */
    fun retry() {
        when (_uiState.value) {
            is UIState.Error -> {
                loadUsers()
            }
            else -> {
                // Do nothing
            }
        }
    }

    /**
     * Clear filters
     */
    fun clearFilters() {
        _searchQuery.value = ""
        _selectedRole.value = null
    }

    /**
     * Get user statistics
     */
    fun getUserStatistics(): LiveData<UserStatistics> {
        return liveData {
            try {
                val stats = withContext(Dispatchers.IO) {
                    userRepository.getUserStatistics()
                }
                emit(stats)

            } catch (e: Exception) {
                emit(UserStatistics()) // Empty stats on error
                e.printStackTrace()
            }
        }
    }
}

/**
 * UI State sealed class cho reactive UI updates
 */
sealed class UIState {
    object Loading : UIState()
    object Success : UIState()
    data class SuccessWithMessage(val message: String) : UIState()
    data class Error(val message: String) : UIState()
}

/**
 * User Statistics data class
 */
data class UserStatistics(
    val totalUsers: Int = 0,
    val activeUsers: Int = 0,
    val inactiveUsers: Int = 0,
    val adminUsers: Int = 0,
    val moderatorUsers: Int = 0,
    val regularUsers: Int = 0,
    val newUsersThisMonth: Int = 0
)

/**
 * User Paging Source cho infinite scroll
 */
class UserPagingSource(
    private val userRepository: UserRepository
) : androidx.paging.PagingSource<Int, User>() {

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, User> {
        return try {
            val page = params.key ?: 0
            val pageSize = params.loadSize

            val users = userRepository.getUsersPaged(page, pageSize)
            val prevKey = if (page > 0) page - 1 else null
            val nextKey = if (users.size == pageSize) page + 1 else null

            LoadResult.Page(
                data = users,
                prevKey = prevKey,
                nextKey = nextKey
            )

        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }

    override fun getRefreshKey(state: PagingState<Int, User>): Int? {
        return state.anchorPosition?.let { anchorPosition ->
            val anchorPage = state.closestPageToPosition(anchorPosition)
            anchorPage?.prevKey?.plus(1) ?: anchorPage?.nextKey?.minus(1)
        }
    }
}
