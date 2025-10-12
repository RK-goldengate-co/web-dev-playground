// C# ASP.NET Core Web API
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseInMemoryDatabase("UserManagement"));
builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Models
public class User
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; } = UserRole.User;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string Preferences { get; set; } = "{\"theme\":\"light\",\"notifications\":true}";
}

public enum UserRole
{
    Admin,
    Moderator,
    User
}

// DTOs
public class CreateUserDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.User;

    public UserPreferencesDto? Preferences { get; set; }
}

public class UpdateUserDto
{
    [StringLength(100)]
    public string? Name { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    public UserRole? Role { get; set; }

    public bool? IsActive { get; set; }

    public UserPreferencesDto? Preferences { get; set; }
}

public class UserPreferencesDto
{
    public string Theme { get; set; } = "light";
    public bool Notifications { get; set; } = true;
    public string Language { get; set; } = "en";
    public string Timezone { get; set; } = "UTC";
}

// Database Context
public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
}

// Controllers
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserDbContext _context;

    public UsersController(UserDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<User>>>> GetUsers(
        int page = 1,
        int limit = 10,
        UserRole? role = null,
        string? search = null)
    {
        var query = _context.Users.AsQueryable();

        // Filter by role
        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        // Filter by search term
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u =>
                u.Name.Contains(search) ||
                u.Email.Contains(search));
        }

        // Pagination
        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(new ApiResponse<IEnumerable<User>>
        {
            Success = true,
            Data = users,
            Pagination = new PaginationInfo
            {
                Page = page,
                Limit = limit,
                Total = total,
                TotalPages = (int)Math.Ceiling(total / (double)limit)
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<User>>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new ApiResponse<User>
            {
                Success = false,
                Error = "User not found"
            });
        }

        return Ok(new ApiResponse<User>
        {
            Success = true,
            Data = user
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<User>>> CreateUser(CreateUserDto userDto)
    {
        // Validate model
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<User>
            {
                Success = false,
                Error = "Invalid input data"
            });
        }

        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == userDto.Email);

        if (existingUser != null)
        {
            return Conflict(new ApiResponse<User>
            {
                Success = false,
                Error = "Email already exists"
            });
        }

        var user = new User
        {
            Name = userDto.Name,
            Email = userDto.Email,
            Role = userDto.Role,
            Preferences = JsonSerializer.Serialize(userDto.Preferences ?? new UserPreferencesDto())
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id },
            new ApiResponse<User>
            {
                Success = true,
                Data = user,
                Message = "User created successfully"
            });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<User>>> UpdateUser(int id, UpdateUserDto userDto)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new ApiResponse<User>
            {
                Success = false,
                Error = "User not found"
            });
        }

        // Check if email already exists (excluding current user)
        if (userDto.Email != null)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == userDto.Email && u.Id != id);

            if (existingUser != null)
            {
                return Conflict(new ApiResponse<User>
                {
                    Success = false,
                    Error = "Email already exists"
                });
            }
        }

        // Update user properties
        if (userDto.Name != null) user.Name = userDto.Name;
        if (userDto.Email != null) user.Email = userDto.Email;
        if (userDto.Role.HasValue) user.Role = userDto.Role.Value;
        if (userDto.IsActive.HasValue) user.IsActive = userDto.IsActive.Value;
        if (userDto.Preferences != null)
            user.Preferences = JsonSerializer.Serialize(userDto.Preferences);

        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<User>
        {
            Success = true,
            Data = user,
            Message = "User updated successfully"
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = "User not found"
            });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "User deleted successfully"
        });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<UserStats>>> GetStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
        var adminCount = await _context.Users.CountAsync(u => u.Role == UserRole.Admin);
        var moderatorCount = await _context.Users.CountAsync(u => u.Role == UserRole.Moderator);
        var userCount = await _context.Users.CountAsync(u => u.Role == UserRole.User);

        var stats = new UserStats
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            InactiveUsers = totalUsers - activeUsers,
            RoleDistribution = new Dictionary<string, int>
            {
                ["admin"] = adminCount,
                ["moderator"] = moderatorCount,
                ["user"] = userCount
            }
        };

        return Ok(new ApiResponse<UserStats>
        {
            Success = true,
            Data = stats
        });
    }
}

// Response models
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string? Message { get; set; }
    public PaginationInfo? Pagination { get; set; }
}

public class PaginationInfo
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }
}

public class UserStats
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public Dictionary<string, int> RoleDistribution { get; set; } = new();
}
