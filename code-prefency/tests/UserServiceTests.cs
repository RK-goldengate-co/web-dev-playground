using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using UserManagementSystem.Data;
using UserManagementSystem.Models;
using UserManagementSystem.Services;
using UserManagementSystem.DTOs;
using UserManagementSystem.Repositories;
using UserManagementSystem.Exceptions;

namespace UserManagementSystem.Tests.Services
{
    /// <summary>
    /// Unit Tests cho UserService
    /// Comprehensive testing với mocking và best practices
    /// </summary>
    [TestFixture]
    public class UserServiceTests
    {
        private Mock<IUserRepository> _userRepositoryMock;
        private Mock<ILogger<UserService>> _loggerMock;
        private Mock<IEmailService> _emailServiceMock;
        private Mock<ICacheService> _cacheServiceMock;
        private UserService _userService;

        [SetUp]
        public void Setup()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _loggerMock = new Mock<ILogger<UserService>>();
            _emailServiceMock = new Mock<IEmailService>();
            _cacheServiceMock = new Mock<ICacheService>();

            _userService = new UserService(
                _userRepositoryMock.Object,
                _loggerMock.Object,
                _emailServiceMock.Object,
                _cacheServiceMock.Object);
        }

        [Test]
        public async Task GetUserByIdAsync_ExistingUser_ReturnsUser()
        {
            // Arrange
            var userId = 1;
            var expectedUser = CreateTestUser(userId, "John", "Doe");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(expectedUser);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(userId));
            Assert.That(result.FirstName, Is.EqualTo("John"));
            _userRepositoryMock.Verify(r => r.GetByIdAsync(userId), Times.Once);
        }

        [Test]
        public async Task GetUserByIdAsync_NonExistingUser_ReturnsNull()
        {
            // Arrange
            var userId = 999;
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User)null);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            Assert.That(result, Is.Null);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(userId), Times.Once);
        }

        [Test]
        public async Task CreateUserAsync_ValidUser_CreatesUserAndSendsEmail()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "SecurePass123!",
                Role = UserRole.User
            };

            var createdUser = CreateTestUser(1, "John", "Doe");
            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(createUserDto.Email)).ReturnsAsync(false);
            _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync(createdUser);
            _emailServiceMock.Setup(e => e.SendWelcomeEmailAsync(createdUser)).ReturnsAsync(true);

            // Act
            var result = await _userService.CreateUserAsync(createUserDto);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.FirstName, Is.EqualTo("John"));
            Assert.That(result.Email, Is.EqualTo("john.doe@example.com"));

            _userRepositoryMock.Verify(r => r.IsEmailExistsAsync(createUserDto.Email), Times.Once);
            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
            _emailServiceMock.Verify(e => e.SendWelcomeEmailAsync(createdUser), Times.Once);
        }

        [Test]
        public async Task CreateUserAsync_EmailAlreadyExists_ThrowsValidationException()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "SecurePass123!",
                Role = UserRole.User
            };

            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(createUserDto.Email)).ReturnsAsync(true);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ValidationException>(() =>
                _userService.CreateUserAsync(createUserDto));

            Assert.That(exception.Message, Contains.Substring("Email already exists"));
            _userRepositoryMock.Verify(r => r.IsEmailExistsAsync(createUserDto.Email), Times.Once);
            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
        }

        [Test]
        public async Task CreateUserAsync_InvalidPassword_ThrowsValidationException()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "weak", // Too weak password
                Role = UserRole.User
            };

            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(createUserDto.Email)).ReturnsAsync(false);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ValidationException>(() =>
                _userService.CreateUserAsync(createUserDto));

            Assert.That(exception.Message, Contains.Substring("Password does not meet requirements"));
        }

        [Test]
        public async Task UpdateUserAsync_ValidUser_UpdatesUser()
        {
            // Arrange
            var userId = 1;
            var updateUserDto = new UpdateUserDto
            {
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane.smith@example.com"
            };

            var existingUser = CreateTestUser(userId, "John", "Doe");
            var updatedUser = CreateTestUser(userId, "Jane", "Smith");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(updateUserDto.Email, userId)).ReturnsAsync(false);
            _userRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<User>())).ReturnsAsync(updatedUser);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateUserDto);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.FirstName, Is.EqualTo("Jane"));
            Assert.That(result.LastName, Is.EqualTo("Smith"));

            _userRepositoryMock.Verify(r => r.GetByIdAsync(userId), Times.Once);
            _userRepositoryMock.Verify(r => r.IsEmailExistsAsync(updateUserDto.Email, userId), Times.Once);
            _userRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<User>()), Times.Once);
        }

        [Test]
        public async Task UpdateUserAsync_EmailConflict_ThrowsValidationException()
        {
            // Arrange
            var userId = 1;
            var updateUserDto = new UpdateUserDto
            {
                Email = "existing@example.com"
            };

            var existingUser = CreateTestUser(userId, "John", "Doe");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(updateUserDto.Email, userId)).ReturnsAsync(true);

            // Act & Assert
            var exception = Assert.ThrowsAsync<ValidationException>(() =>
                _userService.UpdateUserAsync(userId, updateUserDto));

            Assert.That(exception.Message, Contains.Substring("Email is already in use"));
            _userRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<User>()), Times.Never);
        }

        [Test]
        public async Task DeleteUserAsync_ExistingUser_DeletesUser()
        {
            // Arrange
            var userId = 1;
            var user = CreateTestUser(userId, "John", "Doe");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _userRepositoryMock.Setup(r => r.DeleteAsync(userId)).ReturnsAsync(true);

            // Act
            await _userService.DeleteUserAsync(userId);

            // Assert
            _userRepositoryMock.Verify(r => r.GetByIdAsync(userId), Times.Once);
            _userRepositoryMock.Verify(r => r.DeleteAsync(userId), Times.Once);
        }

        [Test]
        public async Task DeleteUserAsync_NonExistingUser_ThrowsNotFoundException()
        {
            // Arrange
            var userId = 999;
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User)null);

            // Act & Assert
            var exception = Assert.ThrowsAsync<NotFoundException>(() =>
                _userService.DeleteUserAsync(userId));

            Assert.That(exception.Message, Contains.Substring("User not found"));
            _userRepositoryMock.Verify(r => r.DeleteAsync(userId), Times.Never);
        }

        [Test]
        public async Task SearchUsersAsync_ValidQuery_ReturnsFilteredUsers()
        {
            // Arrange
            var query = "john";
            var users = new List<User>
            {
                CreateTestUser(1, "John", "Doe"),
                CreateTestUser(2, "Jane", "Smith"),
                CreateTestUser(3, "Johnny", "Walker")
            };

            _userRepositoryMock.Setup(r => r.SearchUsersAsync(query)).ReturnsAsync(users.Where(u =>
                u.FirstName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                u.LastName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                u.Email.Contains(query, StringComparison.OrdinalIgnoreCase)).ToList());

            // Act
            var result = await _userService.SearchUsersAsync(query);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(2)); // John Doe và Johnny Walker
            _userRepositoryMock.Verify(r => r.SearchUsersAsync(query), Times.Once);
        }

        [Test]
        public async Task AuthenticateUserAsync_ValidCredentials_ReturnsUser()
        {
            // Arrange
            var email = "john.doe@example.com";
            var password = "SecurePass123!";
            var user = CreateTestUser(1, "John", "Doe");
            user.PasswordHash = PasswordHasher.HashPassword(password);

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(email)).ReturnsAsync(user);

            // Act
            var result = await _userService.AuthenticateUserAsync(email, password);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(user.Id));
            _userRepositoryMock.Verify(r => r.GetByEmailAsync(email), Times.Once);
        }

        [Test]
        public async Task AuthenticateUserAsync_InvalidCredentials_ThrowsUnauthorizedException()
        {
            // Arrange
            var email = "john.doe@example.com";
            var password = "WrongPassword";
            var user = CreateTestUser(1, "John", "Doe");

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(email)).ReturnsAsync(user);

            // Act & Assert
            var exception = Assert.ThrowsAsync<UnauthorizedException>(() =>
                _userService.AuthenticateUserAsync(email, password));

            Assert.That(exception.Message, Contains.Substring("Invalid credentials"));
        }

        [Test]
        public async Task GetUsersPagedAsync_ValidRequest_ReturnsPagedResult()
        {
            // Arrange
            var page = 1;
            var pageSize = 10;
            var totalCount = 25;
            var users = Enumerable.Range(1, 10).Select(i => CreateTestUser(i, $"User{i}", $"Last{i}")).ToList();

            _userRepositoryMock.Setup(r => r.GetPagedAsync(page, pageSize, null, null, true))
                .ReturnsAsync(new PagedResult<User>
                {
                    Items = users,
                    TotalCount = totalCount,
                    PageSize = pageSize,
                    CurrentPage = page,
                    TotalPages = 3
                });

            // Act
            var result = await _userService.GetUsersPagedAsync(page, pageSize);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Items.Count, Is.EqualTo(pageSize));
            Assert.That(result.TotalCount, Is.EqualTo(totalCount));
            Assert.That(result.TotalPages, Is.EqualTo(3));
            _userRepositoryMock.Verify(r => r.GetPagedAsync(page, pageSize, null, null, true), Times.Once);
        }

        [Test]
        public async Task GetUserStatisticsAsync_ValidRequest_ReturnsStatistics()
        {
            // Arrange
            var totalUsers = 100;
            var activeUsers = 85;
            var adminUsers = 5;

            _userRepositoryMock.Setup(r => r.CountAsync()).ReturnsAsync(totalUsers);
            _userRepositoryMock.Setup(r => r.CountAsync(u => u.Status == UserStatus.Active)).ReturnsAsync(activeUsers);
            _userRepositoryMock.Setup(r => r.CountAsync(u => u.Role == UserRole.Admin)).ReturnsAsync(adminUsers);

            // Act
            var result = await _userService.GetUserStatisticsAsync();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.TotalUsers, Is.EqualTo(totalUsers));
            Assert.That(result.ActiveUsers, Is.EqualTo(activeUsers));
            Assert.That(result.AdminUsers, Is.EqualTo(adminUsers));

            _userRepositoryMock.Verify(r => r.CountAsync(), Times.Once);
            _userRepositoryMock.Verify(r => r.CountAsync(u => u.Status == UserStatus.Active), Times.Once);
            _userRepositoryMock.Verify(r => r.CountAsync(u => u.Role == UserRole.Admin), Times.Once);
        }

        [Test]
        public async Task CreateUserAsync_DatabaseError_LogsErrorAndThrowsException()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "SecurePass123!",
                Role = UserRole.User
            };

            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(createUserDto.Email)).ReturnsAsync(false);
            _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).ThrowsAsync(new Exception("Database error"));

            // Act & Assert
            var exception = Assert.ThrowsAsync<Exception>(() =>
                _userService.CreateUserAsync(createUserDto));

            Assert.That(exception.Message, Is.EqualTo("Database error"));
            _loggerMock.Verify(l => l.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<object>(), exception,
                It.IsAny<Func<object, Exception, string>>()), Times.Once);
        }

        [Test]
        public async Task CreateUserAsync_EmailServiceFails_StillCreatesUser()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "SecurePass123!",
                Role = UserRole.User
            };

            var createdUser = CreateTestUser(1, "John", "Doe");
            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(createUserDto.Email)).ReturnsAsync(false);
            _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync(createdUser);
            _emailServiceMock.Setup(e => e.SendWelcomeEmailAsync(createdUser)).ThrowsAsync(new Exception("Email service error"));

            // Act
            var result = await _userService.CreateUserAsync(createUserDto);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.FirstName, Is.EqualTo("John"));

            // User should still be created even if email fails
            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
            _emailServiceMock.Verify(e => e.SendWelcomeEmailAsync(createdUser), Times.Once);
        }

        [Test]
        public async Task GetUserByIdAsync_CachedUser_ReturnsFromCache()
        {
            // Arrange
            var userId = 1;
            var cachedUser = CreateTestUser(userId, "John", "Doe");

            _cacheServiceMock.Setup(c => c.GetAsync<User>($"user:{userId}")).ReturnsAsync(cachedUser);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(userId));

            // Should get from cache, not repository
            _cacheServiceMock.Verify(c => c.GetAsync<User>($"user:{userId}"), Times.Once);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(userId), Times.Never);
        }

        [Test]
        public async Task GetUserByIdAsync_CacheMiss_LoadsFromRepositoryAndCaches()
        {
            // Arrange
            var userId = 1;
            var user = CreateTestUser(userId, "John", "Doe");

            _cacheServiceMock.Setup(c => c.GetAsync<User>($"user:{userId}")).ReturnsAsync((User)null);
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(userId));

            // Should load from repository và cache
            _cacheServiceMock.Verify(c => c.GetAsync<User>($"user:{userId}"), Times.Once);
            _userRepositoryMock.Verify(r => r.GetByIdAsync(userId), Times.Once);
            _cacheServiceMock.Verify(c => c.SetAsync($"user:{userId}", user, TimeSpan.FromMinutes(30)), Times.Once);
        }

        [Test]
        public async Task UpdateUserAsync_UpdatesCache()
        {
            // Arrange
            var userId = 1;
            var updateUserDto = new UpdateUserDto { FirstName = "Jane" };
            var existingUser = CreateTestUser(userId, "John", "Doe");
            var updatedUser = CreateTestUser(userId, "Jane", "Doe");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(r => r.IsEmailExistsAsync(existingUser.Email, userId)).ReturnsAsync(false);
            _userRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<User>())).ReturnsAsync(updatedUser);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateUserDto);

            // Assert
            Assert.That(result.FirstName, Is.EqualTo("Jane"));

            // Should invalidate cache
            _cacheServiceMock.Verify(c => c.RemoveAsync($"user:{userId}"), Times.Once);
        }

        [Test]
        public async Task DeleteUserAsync_InvalidatesCache()
        {
            // Arrange
            var userId = 1;
            var user = CreateTestUser(userId, "John", "Doe");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _userRepositoryMock.Setup(r => r.DeleteAsync(userId)).ReturnsAsync(true);

            // Act
            await _userService.DeleteUserAsync(userId);

            // Assert
            // Should invalidate cache
            _cacheServiceMock.Verify(c => c.RemoveAsync($"user:{userId}"), Times.Once);
        }

        [Test]
        public async Task GetAllUsersAsync_UsesCache()
        {
            // Arrange
            var users = new List<User>
            {
                CreateTestUser(1, "John", "Doe"),
                CreateTestUser(2, "Jane", "Smith")
            };

            _cacheServiceMock.Setup(c => c.GetAsync<List<User>>("users:all")).ReturnsAsync(users);

            // Act
            var result = await _userService.GetAllUsersAsync();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(2));

            // Should get from cache
            _cacheServiceMock.Verify(c => c.GetAsync<List<User>>("users:all"), Times.Once);
            _userRepositoryMock.Verify(r => r.GetAllAsync(), Times.Never);
        }

        [Test]
        public async Task CreateUserAsync_ConcurrentRequests_HandlesCorrectly()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "SecurePass123!",
                Role = UserRole.User
            };

            var createdUser = CreateTestUser(1, "John", "Doe");

            // First call
            _userRepositoryMock.SetupSequence(r => r.IsEmailExistsAsync(createUserDto.Email))
                .ReturnsAsync(false) // First check
                .ReturnsAsync(true); // Second check (should not happen due to race condition)

            _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync(createdUser);
            _emailServiceMock.Setup(e => e.SendWelcomeEmailAsync(createdUser)).ReturnsAsync(true);

            // Act - Simulate concurrent requests
            var task1 = _userService.CreateUserAsync(createUserDto);
            var task2 = _userService.CreateUserAsync(createUserDto);

            await Task.WhenAll(task1, task2);

            // Assert
            _userRepositoryMock.Verify(r => r.IsEmailExistsAsync(createUserDto.Email), Times.Exactly(2));
            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
        }

        // Helper method to create test user
        private User CreateTestUser(int id, string firstName, string lastName)
        {
            return new User
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}@example.com",
                PasswordHash = "hashed_password",
                Role = UserRole.User,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}
