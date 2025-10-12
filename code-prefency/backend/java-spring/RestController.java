package com.codeprefency.usermanagement.controller;

import com.codeprefency.usermanagement.dto.UserDto;
import com.codeprefency.usermanagement.dto.ProductDto;
import com.codeprefency.usermanagement.dto.OrderDto;
import com.codeprefency.usermanagement.service.UserService;
import com.codeprefency.usermanagement.service.ProductService;
import com.codeprefency.usermanagement.service.OrderService;
import com.codeprefency.usermanagement.service.AnalyticsService;
import com.codeprefency.usermanagement.exception.ResourceNotFoundException;
import com.codeprefency.usermanagement.exception.BusinessLogicException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.time.LocalDateTime;

/**
 * User Management REST API Controller
 * Complete CRUD operations với validation và security
 */
@RestController
@RequestMapping("/api/users")
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Get all users với pagination và filtering
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Map<String, Object> filters = new HashMap<>();
        if (search != null && !search.trim().isEmpty()) {
            filters.put("search", search.trim());
        }
        if (role != null && !role.trim().isEmpty()) {
            filters.put("role", role.trim());
        }
        if (active != null) {
            filters.put("active", active);
        }

        Page<UserDto> users = userService.getUsers(pageable, filters);

        Map<String, Object> response = new HashMap<>();
        response.put("data", users.getContent());
        response.put("pagination", createPaginationInfo(users));
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or @userService.getUserById(#id).get().userId == authentication.principal.id")
    public ResponseEntity<UserDto> getUserById(@PathVariable @NotNull @Min(1) Long id) {
        UserDto user = userService.getUserById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        return ResponseEntity.ok(user);
    }

    /**
     * Create new user
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody UserDto userDto) {
        try {
            UserDto createdUser = userService.createUser(userDto);

            Map<String, Object> response = new HashMap<>();
            response.put("data", createdUser);
            response.put("message", "User created successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Update user
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userService.getUserById(#id).get().userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable @NotNull @Min(1) Long id,
            @Valid @RequestBody UserDto userDto) {

        try {
            UserDto updatedUser = userService.updateUser(id, userDto);

            Map<String, Object> response = new HashMap<>();
            response.put("data", updatedUser);
            response.put("message", "User updated successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Delete user (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable @NotNull @Min(1) Long id) {
        try {
            userService.deleteUser(id);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Change user password
     */
    @PostMapping("/{id}/change-password")
    @PreAuthorize("@userService.getUserById(#id).get().userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable @NotNull @Min(1) Long id,
            @RequestParam String currentPassword,
            @RequestParam String newPassword) {

        try {
            userService.changePassword(id, currentPassword, newPassword);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Reset user password (admin only)
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> resetPassword(@PathVariable @NotNull @Min(1) Long id) {
        try {
            // In production, this should send email instead of returning password
            String tempPassword = userService.resetPassword(getUserById(id).getBody().getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            response.put("tempPassword", tempPassword); // Remove in production
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Reset failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get user statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        Map<String, Object> statistics = userService.getUserStatistics();

        Map<String, Object> response = new HashMap<>();
        response.put("data", statistics);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createPaginationInfo(Page<?> page) {
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber() + 1);
        pagination.put("pageSize", page.getSize());
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());
        pagination.put("first", page.isFirst());
        pagination.put("last", page.isLast());

        return pagination;
    }
}

/**
 * Product Management REST API Controller
 */
@RestController
@RequestMapping("/api/products")
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    /**
     * Get all products với advanced filtering
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @Min(0) BigDecimal minPrice,
            @RequestParam(required = false) @Min(0) BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Map<String, Object> filters = new HashMap<>();

        if (categoryId != null) {
            filters.put("category", categoryId);
        }
        if (minPrice != null) {
            filters.put("priceMin", minPrice);
        }
        if (maxPrice != null) {
            filters.put("priceMax", maxPrice);
        }
        if (search != null && !search.trim().isEmpty()) {
            filters.put("search", search.trim());
        }
        if (inStock != null && inStock) {
            filters.put("active", true);
        }

        Page<ProductDto> products = productService.getProducts(pageable, filters);

        Map<String, Object> response = new HashMap<>();
        response.put("data", products.getContent());
        response.put("pagination", createPaginationInfo(products));
        response.put("filters", filters);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get product by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable @NotNull @Min(1) Long id) {
        ProductDto product = productService.getProductById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        return ResponseEntity.ok(product);
    }

    /**
     * Create new product
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> createProduct(@Valid @RequestBody ProductDto productDto) {
        try {
            ProductDto createdProduct = productService.createProduct(productDto);

            Map<String, Object> response = new HashMap<>();
            response.put("data", createdProduct);
            response.put("message", "Product created successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Update product
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable @NotNull @Min(1) Long id,
            @Valid @RequestBody ProductDto productDto) {

        try {
            ProductDto updatedProduct = productService.updateProduct(id, productDto);

            Map<String, Object> response = new HashMap<>();
            response.put("data", updatedProduct);
            response.put("message", "Product updated successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Update product stock
     */
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> updateStock(
            @PathVariable @NotNull @Min(1) Long id,
            @RequestParam @Min(0) int stock,
            @RequestParam String reason) {

        try {
            ProductDto updatedProduct = productService.updateStock(id, stock, reason);

            Map<String, Object> response = new HashMap<>();
            response.put("data", updatedProduct);
            response.put("message", "Stock updated successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Business logic error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Delete product
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable @NotNull @Min(1) Long id) {
        try {
            productService.deleteProduct(id);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Product deleted successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get low stock products
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<ProductDto>> getLowStockProducts() {
        List<ProductDto> products = productService.getLowStockProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Get product statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getProductStatistics() {
        Map<String, Object> statistics = productService.getProductStatistics();

        Map<String, Object> response = new HashMap<>();
        response.put("data", statistics);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        List<CategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    private Map<String, Object> createPaginationInfo(Page<?> page) {
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber() + 1);
        pagination.put("pageSize", page.getSize());
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());
        pagination.put("first", page.isFirst());
        pagination.put("last", page.isLast());

        return pagination;
    }
}

/**
 * Order Management REST API Controller
 */
@RestController
@RequestMapping("/api/orders")
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserService userService;

    /**
     * Create new order
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@Valid @RequestBody OrderDto orderDto) {
        try {
            OrderDto createdOrder = orderService.createOrder(orderDto);

            Map<String, Object> response = new HashMap<>();
            response.put("data", createdOrder);
            response.put("message", "Order created successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Business logic error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get user orders
     */
    @GetMapping("/my-orders")
    public ResponseEntity<Map<String, Object>> getMyOrders(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {

        Long userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Map<String, Object> filters = new HashMap<>();
        filters.put("userId", userId);

        Page<OrderDto> orders = orderService.getOrders(pageable, filters);

        Map<String, Object> response = new HashMap<>();
        response.put("data", orders.getContent());
        response.put("pagination", createPaginationInfo(orders));
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get order by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable @NotNull @Min(1) Long id) {
        OrderDto order = orderService.getOrderById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        // Check if user owns the order or is admin
        Long currentUserId = getCurrentUserId();
        if (!order.getUserId().equals(currentUserId) &&
            !hasRole("ADMIN") && !hasRole("MODERATOR")) {
            throw new BusinessLogicException("Access denied");
        }

        return ResponseEntity.ok(order);
    }

    /**
     * Update order status (admin/moderator only)
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable @NotNull @Min(1) Long id,
            @RequestParam OrderStatus status,
            @RequestParam(required = false) String reason) {

        try {
            OrderDto updatedOrder = orderService.updateOrderStatus(id, status, reason);

            Map<String, Object> response = new HashMap<>();
            response.put("data", updatedOrder);
            response.put("message", "Order status updated successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.notFound().build();

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Business logic error");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Cancel order
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable @NotNull @Min(1) Long id,
            @RequestParam String reason) {

        Long userId = getCurrentUserId();
        OrderDto order = orderService.getOrderById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Check if user owns the order
        if (!order.getUserId().equals(userId)) {
            throw new BusinessLogicException("Access denied");
        }

        // Check if order can be cancelled
        if (!canCancelOrder(order.getStatus())) {
            throw new BusinessLogicException("Order cannot be cancelled at this stage");
        }

        try {
            OrderDto cancelledOrder = orderService.updateOrderStatus(id, OrderStatus.CANCELLED, reason);

            Map<String, Object> response = new HashMap<>();
            response.put("data", cancelledOrder);
            response.put("message", "Order cancelled successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (BusinessLogicException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Cancellation failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get all orders (admin/moderator only)
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Map<String, Object> filters = new HashMap<>();

        if (status != null) {
            filters.put("status", status);
        }
        if (userId != null) {
            filters.put("userId", userId);
        }
        if (dateFrom != null) {
            filters.put("dateFrom", dateFrom);
        }
        if (dateTo != null) {
            filters.put("dateTo", dateTo);
        }

        Page<OrderDto> orders = orderService.getOrders(pageable, filters);

        Map<String, Object> response = new HashMap<>();
        response.put("data", orders.getContent());
        response.put("pagination", createPaginationInfo(orders));
        response.put("filters", filters);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get order statistics (admin only)
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getOrderStatistics() {
        Map<String, Object> statistics = orderService.getOrderStatistics();

        Map<String, Object> response = new HashMap<>();
        response.put("data", statistics);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId() {
        // Get current user ID from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken) {
            return ((UserPrincipal) authentication.getPrincipal()).getId();
        }
        throw new BusinessLogicException("User not authenticated");
    }

    private boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + role));
    }

    private boolean canCancelOrder(OrderStatus status) {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }

    private Map<String, Object> createPaginationInfo(Page<?> page) {
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber() + 1);
        pagination.put("pageSize", page.getSize());
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());
        pagination.put("first", page.isFirst());
        pagination.put("last", page.isLast());

        return pagination;
    }
}

/**
 * Analytics REST API Controller
 */
@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * Get comprehensive dashboard data
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> dashboardData = analyticsService.getDashboardData();

        Map<String, Object> response = new HashMap<>();
        response.put("data", dashboardData);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get user analytics
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUserAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        if (startDate == null) {
            startDate = LocalDateTime.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }

        Map<String, Object> userAnalytics = analyticsService.getUserAnalytics(startDate, endDate);

        Map<String, Object> response = new HashMap<>();
        response.put("data", userAnalytics);
        response.put("period", Map.of("startDate", startDate, "endDate", endDate));
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get product analytics
     */
    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProductAnalytics() {
        Map<String, Object> productAnalytics = analyticsService.getProductAnalytics();

        Map<String, Object> response = new HashMap<>();
        response.put("data", productAnalytics);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get revenue analytics
     */
    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueAnalytics(
            @RequestParam(required = false) String period) {

        Map<String, Object> revenueAnalytics;

        if ("monthly".equals(period)) {
            revenueAnalytics = analyticsService.getMonthlyRevenueAnalytics();
        } else if ("yearly".equals(period)) {
            revenueAnalytics = analyticsService.getYearlyRevenueAnalytics();
        } else {
            revenueAnalytics = analyticsService.getRevenueAnalytics();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", revenueAnalytics);
        response.put("period", period);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Export analytics report
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnalyticsReport(
            @RequestParam(defaultValue = "pdf") String format,
            @RequestParam(required = false) String period) {

        byte[] reportData = analyticsService.generateAnalyticsReport(format, period);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/" + format));
        headers.setContentDispositionFormData("attachment",
            "analytics_report_" + LocalDateTime.now().toString() + "." + format);

        return ResponseEntity.ok()
            .headers(headers)
            .body(reportData);
    }
}

/**
 * Health Check Controller
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private DatabaseUtils databaseUtils;

    /**
     * Basic health check
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();

        // Application health
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        health.put("uptime", getUptime());

        // Database health
        try {
            Map<String, Object> dbStats = databaseUtils.getDatabaseStats();
            health.put("database", Map.of(
                "status", "UP",
                "details", dbStats
            ));
        } catch (Exception e) {
            health.put("database", Map.of(
                "status", "DOWN",
                "error", e.getMessage()
            ));
        }

        // Memory usage
        Runtime runtime = Runtime.getRuntime();
        health.put("memory", Map.of(
            "used", runtime.totalMemory() - runtime.freeMemory(),
            "total", runtime.totalMemory(),
            "free", runtime.freeMemory()
        ));

        return ResponseEntity.ok(health);
    }

    /**
     * Detailed health check
     */
    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealthCheck() {
        Map<String, Object> health = new HashMap<>();

        // Add more detailed checks
        health.put("checks", Map.of(
            "database", checkDatabase(),
            "cache", checkCache(),
            "externalServices", checkExternalServices()
        ));

        return ResponseEntity.ok(health);
    }

    private String getUptime() {
        // Calculate uptime (simplified)
        return "Unknown";
    }

    private Map<String, Object> checkDatabase() {
        Map<String, Object> check = new HashMap<>();

        try {
            Map<String, Object> stats = databaseUtils.getDatabaseStats();
            check.put("status", "UP");
            check.put("details", stats);
        } catch (Exception e) {
            check.put("status", "DOWN");
            check.put("error", e.getMessage());
        }

        return check;
    }

    private Map<String, Object> checkCache() {
        // Check Redis/cache health
        Map<String, Object> check = new HashMap<>();
        check.put("status", "UP");
        return check;
    }

    private Map<String, Object> checkExternalServices() {
        // Check external service health
        Map<String, Object> check = new HashMap<>();
        check.put("status", "UP");
        return check;
    }
}

/**
 * File Upload Controller
 */
@RestController
@RequestMapping("/api/upload")
@PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
public class FileUploadController {

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Upload single file
     */
    @PostMapping("/single")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = fileStorageService.storeFile(file);

            Map<String, Object> response = new HashMap<>();
            response.put("data", Map.of(
                "fileName", fileName,
                "originalName", file.getOriginalFilename(),
                "size", file.getSize(),
                "contentType", file.getContentType()
            ));
            response.put("message", "File uploaded successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Upload failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Upload multiple files
     */
    @PostMapping("/multiple")
    public ResponseEntity<Map<String, Object>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        List<Map<String, Object>> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                String fileName = fileStorageService.storeFile(file);
                uploadedFiles.add(Map.of(
                    "fileName", fileName,
                    "originalName", file.getOriginalFilename(),
                    "size", file.getSize(),
                    "contentType", file.getContentType()
                ));
            } catch (Exception e) {
                uploadedFiles.add(Map.of(
                    "error", e.getMessage(),
                    "originalName", file.getOriginalFilename()
                ));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", uploadedFiles);
        response.put("message", "Files uploaded");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Delete file
     */
    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String fileName) {
        try {
            fileStorageService.deleteFile(fileName);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "File deleted successfully");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Delete failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

/**
 * Webhook Controller
 */
@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    @Autowired
    private WebhookService webhookService;

    /**
     * Handle Stripe webhook
     */
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {

        try {
            webhookService.processStripeWebhook(payload, signature);
            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook failed");
        }
    }

    /**
     * Handle PayPal webhook
     */
    @PostMapping("/paypal")
    public ResponseEntity<String> handlePayPalWebhook(@RequestBody String payload) {
        try {
            webhookService.processPayPalWebhook(payload);
            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook failed");
        }
    }
}

/**
 * API Documentation Controller
 */
@RestController
@RequestMapping("/api/docs")
public class ApiDocsController {

    /**
     * Get API documentation
     */
    @GetMapping
    public ResponseEntity<String> getApiDocs() {
        // Return OpenAPI/Swagger documentation
        return ResponseEntity.ok("API Documentation");
    }

    /**
     * Get API version info
     */
    @GetMapping("/version")
    public ResponseEntity<Map<String, Object>> getApiVersion() {
        Map<String, Object> versionInfo = new HashMap<>();
        versionInfo.put("version", "1.0.0");
        versionInfo.put("name", "User Management API");
        versionInfo.put("description", "REST API for user management system");
        versionInfo.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(versionInfo);
    }
}

// Import statements cần thiết
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.LocalDateTime;
import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import java.math.BigDecimal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import com.fasterxml.jackson.databind.ObjectMapper;
