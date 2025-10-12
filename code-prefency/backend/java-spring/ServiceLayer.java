package com.codeprefency.usermanagement.service;

import com.codeprefency.usermanagement.entity.User;
import com.codeprefency.usermanagement.entity.Product;
import com.codeprefency.usermanagement.entity.Order;
import com.codeprefency.usermanagement.repository.UserRepository;
import com.codeprefency.usermanagement.repository.ProductRepository;
import com.codeprefency.usermanagement.repository.OrderRepository;
import com.codeprefency.usermanagement.dto.UserDto;
import com.codeprefency.usermanagement.dto.ProductDto;
import com.codeprefency.usermanagement.dto.OrderDto;
import com.codeprefency.usermanagement.exception.ResourceNotFoundException;
import com.codeprefency.usermanagement.exception.BusinessLogicException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

/**
 * User Service Layer
 * Business logic cho user management với caching và security
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditService auditService;

    /**
     * Create new user với validation và security
     */
    public UserDto createUser(UserDto userDto) {
        // Validate input
        validateUserInput(userDto);

        // Check if email already exists
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new BusinessLogicException("Email already exists");
        }

        // Create user entity
        User user = new User();
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setRole(userDto.getRole());
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Save user
        user = userRepository.save(user);

        // Send welcome email
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
        } catch (Exception e) {
            // Log error but don't fail user creation
            logger.warn("Failed to send welcome email to: " + user.getEmail(), e);
        }

        // Audit log
        auditService.logUserAction("USER_CREATED", user.getId(), "User created successfully");

        return mapToDto(user);
    }

    /**
     * Get user by ID với caching
     */
    @Cacheable(value = "users", key = "#id")
    public Optional<UserDto> getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(this::mapToDto);
    }

    /**
     * Update user với validation
     */
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "userProfiles", allEntries = true)
    })
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Validate update
        validateUserUpdate(userDto, user);

        // Update fields
        if (userDto.getFirstName() != null) {
            user.setFirstName(userDto.getFirstName());
        }
        if (userDto.getLastName() != null) {
            user.setLastName(userDto.getLastName());
        }
        if (userDto.getRole() != null) {
            user.setRole(userDto.getRole());
        }
        if (userDto.getIsActive() != null) {
            user.setIsActive(userDto.getIsActive());
        }

        user.setUpdatedAt(LocalDateTime.now());

        user = userRepository.save(user);

        // Audit log
        auditService.logUserAction("USER_UPDATED", user.getId(), "User updated successfully");

        return mapToDto(user);
    }

    /**
     * Delete user với soft delete
     */
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "userProfiles", allEntries = true)
    })
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Soft delete
        user.setIsActive(false);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);

        // Audit log
        auditService.logUserAction("USER_DELETED", user.getId(), "User soft deleted");
    }

    /**
     * Get users với pagination và filtering
     */
    @Cacheable(value = "userLists", key = "#pageable.pageNumber + '_' + #pageable.pageSize + '_' + #filters")
    public Page<UserDto> getUsers(Pageable pageable, Map<String, Object> filters) {
        // Build specification based on filters
        Specification<User> spec = Specification.where(null);

        if (filters.containsKey("role")) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("role"), filters.get("role")));
        }

        if (filters.containsKey("active")) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("isActive"), filters.get("active")));
        }

        if (filters.containsKey("search")) {
            String search = (String) filters.get("search");
            spec = spec.and((root, query, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("firstName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("lastName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("email")), "%" + search.toLowerCase() + "%")
                ));
        }

        Page<User> users = userRepository.findAll(spec, pageable);
        return users.map(this::mapToDto);
    }

    /**
     * Change user password
     */
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessLogicException("Current password is incorrect");
        }

        // Validate new password
        validatePasswordStrength(newPassword);

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Audit log
        auditService.logUserAction("PASSWORD_CHANGED", user.getId(), "Password changed successfully");
    }

    /**
     * Reset user password
     */
    public String resetPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Generate temporary password
        String tempPassword = generateTemporaryPassword();

        // Update user password
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Send email with temporary password
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), tempPassword);
        } catch (Exception e) {
            logger.error("Failed to send password reset email", e);
            throw new BusinessLogicException("Failed to send reset email");
        }

        // Audit log
        auditService.logUserAction("PASSWORD_RESET", user.getId(), "Password reset via email");

        return tempPassword; // In production, don't return the password
    }

    /**
     * Get user statistics
     */
    public Map<String, Object> getUserStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long inactiveUsers = totalUsers - activeUsers;

        // Users by role
        Map<String, Long> usersByRole = userRepository.findAll().stream()
            .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));

        // Recent registrations (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentRegistrations = userRepository.countByCreatedAtAfter(thirtyDaysAgo);

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("usersByRole", usersByRole);
        stats.put("recentRegistrations", recentRegistrations);

        return stats;
    }

    private void validateUserInput(UserDto userDto) {
        if (userDto.getEmail() == null || userDto.getEmail().trim().isEmpty()) {
            throw new BusinessLogicException("Email is required");
        }

        if (userDto.getFirstName() == null || userDto.getFirstName().trim().isEmpty()) {
            throw new BusinessLogicException("First name is required");
        }

        if (userDto.getLastName() == null || userDto.getLastName().trim().isEmpty()) {
            throw new BusinessLogicException("Last name is required");
        }

        if (userDto.getPassword() == null || userDto.getPassword().length() < 8) {
            throw new BusinessLogicException("Password must be at least 8 characters long");
        }

        validatePasswordStrength(userDto.getPassword());
    }

    private void validateUserUpdate(UserDto userDto, User existingUser) {
        // Check if email is being changed and already exists
        if (userDto.getEmail() != null &&
            !userDto.getEmail().equals(existingUser.getEmail()) &&
            userRepository.existsByEmail(userDto.getEmail())) {
            throw new BusinessLogicException("Email already exists");
        }
    }

    private void validatePasswordStrength(String password) {
        List<String> errors = new ArrayList<>();

        if (password.length() < 8) {
            errors.add("Password must be at least 8 characters long");
        }

        if (!password.matches(".*[a-z].*")) {
            errors.add("Password must contain at least one lowercase letter");
        }

        if (!password.matches(".*[A-Z].*")) {
            errors.add("Password must contain at least one uppercase letter");
        }

        if (!password.matches(".*\\d.*")) {
            errors.add("Password must contain at least one digit");
        }

        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            errors.add("Password must contain at least one special character");
        }

        if (!errors.isEmpty()) {
            throw new BusinessLogicException("Password validation failed: " + String.join(", ", errors));
        }
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 12; i++) {
            password.append(chars.charAt((int) (Math.random() * chars.length())));
        }

        return password.toString();
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLoginAt(user.getLastLoginAt());

        return dto;
    }
}

/**
 * Product Service Layer
 * Business logic cho product management với inventory tracking
 */
@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private AuditService auditService;

    /**
     * Create new product
     */
    public ProductDto createProduct(ProductDto productDto) {
        // Validate input
        validateProductInput(productDto);

        // Create product entity
        Product product = new Product();
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setPrice(productDto.getPrice());
        product.setCategoryId(productDto.getCategoryId());
        product.setSku(productDto.getSku());
        product.setStock(productDto.getStock());
        product.setMinStock(productDto.getMinStock());
        product.setIsActive(true);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        // Save product
        product = productRepository.save(product);

        // Initialize inventory
        inventoryService.initializeInventory(product.getId(), productDto.getStock());

        // Audit log
        auditService.logProductAction("PRODUCT_CREATED", product.getId(), "Product created successfully");

        return mapToDto(product);
    }

    /**
     * Update product stock
     */
    public ProductDto updateStock(Long productId, int newStock, String reason) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        int oldStock = product.getStock();
        product.setStock(newStock);
        product.setUpdatedAt(LocalDateTime.now());

        product = productRepository.save(product);

        // Update inventory record
        inventoryService.recordStockChange(productId, oldStock, newStock, reason);

        // Audit log
        auditService.logProductAction("STOCK_UPDATED", productId,
            String.format("Stock changed from %d to %d. Reason: %s", oldStock, newStock, reason));

        return mapToDto(product);
    }

    /**
     * Get products với filtering và sorting
     */
    @Cacheable(value = "products", key = "#pageable.pageNumber + '_' + #pageable.pageSize + '_' + #filters")
    public Page<ProductDto> getProducts(Pageable pageable, Map<String, Object> filters) {
        // Build specification based on filters
        Specification<Product> spec = Specification.where(null);

        if (filters.containsKey("category")) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("categoryId"), filters.get("category")));
        }

        if (filters.containsKey("active")) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("isActive"), filters.get("active")));
        }

        if (filters.containsKey("priceMin")) {
            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("price"), (BigDecimal) filters.get("priceMin")));
        }

        if (filters.containsKey("priceMax")) {
            spec = spec.and((root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("price"), (BigDecimal) filters.get("priceMax")));
        }

        if (filters.containsKey("search")) {
            String search = (String) filters.get("search");
            spec = spec.and((root, query, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("description")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("sku")), "%" + search.toLowerCase() + "%")
                ));
        }

        Page<Product> products = productRepository.findAll(spec, pageable);
        return products.map(this::mapToDto);
    }

    /**
     * Get low stock products
     */
    public List<ProductDto> getLowStockProducts() {
        List<Product> products = productRepository.findByStockLessThanMinStock();
        return products.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Get product statistics
     */
    public Map<String, Object> getProductStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByIsActive(true);
        long outOfStockProducts = productRepository.countByStock(0);

        // Total inventory value
        BigDecimal totalValue = productRepository.getTotalInventoryValue();

        // Products by category
        Map<String, Long> productsByCategory = productRepository.findAll().stream()
            .collect(Collectors.groupingBy(Product::getCategoryId, Collectors.counting()));

        stats.put("totalProducts", totalProducts);
        stats.put("activeProducts", activeProducts);
        stats.put("outOfStockProducts", outOfStockProducts);
        stats.put("totalInventoryValue", totalValue);
        stats.put("productsByCategory", productsByCategory);

        return stats;
    }

    private void validateProductInput(ProductDto productDto) {
        if (productDto.getName() == null || productDto.getName().trim().isEmpty()) {
            throw new BusinessLogicException("Product name is required");
        }

        if (productDto.getPrice() == null || productDto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessLogicException("Product price must be greater than zero");
        }

        if (productDto.getCategoryId() == null) {
            throw new BusinessLogicException("Product category is required");
        }

        // Validate category exists
        if (!categoryService.categoryExists(productDto.getCategoryId())) {
            throw new BusinessLogicException("Invalid category");
        }

        // Check if SKU already exists
        if (productDto.getSku() != null && productRepository.existsBySku(productDto.getSku())) {
            throw new BusinessLogicException("SKU already exists");
        }
    }

    private ProductDto mapToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setCategoryId(product.getCategoryId());
        dto.setSku(product.getSku());
        dto.setStock(product.getStock());
        dto.setMinStock(product.getMinStock());
        dto.setIsActive(product.getIsActive());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        return dto;
    }
}

/**
 * Order Service Layer
 * Complex business logic cho order management và inventory tracking
 */
@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditService auditService;

    /**
     * Create new order với inventory validation
     */
    public OrderDto createOrder(OrderDto orderDto) {
        // Validate order
        validateOrderInput(orderDto);

        // Check product availability and reserve inventory
        Map<Long, Integer> reservedItems = new HashMap<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemDto itemDto : orderDto.getItems()) {
            ProductDto product = productService.getProductById(itemDto.getProductId())
                .orElseThrow(() -> new BusinessLogicException("Product not found: " + itemDto.getProductId()));

            // Check stock availability
            if (product.getStock() < itemDto.getQuantity()) {
                throw new BusinessLogicException("Insufficient stock for product: " + product.getName());
            }

            // Reserve inventory
            inventoryService.reserveInventory(itemDto.getProductId(), itemDto.getQuantity());
            reservedItems.put(itemDto.getProductId(), itemDto.getQuantity());

            totalAmount = totalAmount.add(product.getPrice().multiply(new BigDecimal(itemDto.getQuantity())));
        }

        try {
            // Create order
            Order order = new Order();
            order.setUserId(orderDto.getUserId());
            order.setTotalAmount(totalAmount);
            order.setStatus(OrderStatus.PENDING);
            order.setShippingAddress(orderDto.getShippingAddress());
            order.setBillingAddress(orderDto.getBillingAddress());
            order.setPaymentMethod(orderDto.getPaymentMethod());
            order.setCreatedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());

            order = orderRepository.save(order);

            // Create order items
            for (OrderItemDto itemDto : orderDto.getItems()) {
                OrderItem item = new OrderItem();
                item.setOrderId(order.getId());
                item.setProductId(itemDto.getProductId());
                item.setQuantity(itemDto.getQuantity());
                item.setPrice(productService.getProductById(itemDto.getProductId()).get().getPrice());

                orderRepository.saveOrderItem(item);
            }

            // Process payment
            PaymentResult paymentResult = paymentService.processPayment(order);

            if (paymentResult.isSuccess()) {
                order.setStatus(OrderStatus.PAID);
                order.setPaymentId(paymentResult.getPaymentId());

                // Confirm inventory reservation
                for (Map.Entry<Long, Integer> entry : reservedItems.entrySet()) {
                    inventoryService.confirmReservation(entry.getKey(), entry.getValue());
                }

                // Send confirmation email
                emailService.sendOrderConfirmation(orderDto.getUserId(), order.getId());

                // Audit log
                auditService.logOrderAction("ORDER_CREATED", order.getId(), "Order created and paid successfully");
            } else {
                // Cancel order and release inventory
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancellationReason("Payment failed");

                for (Map.Entry<Long, Integer> entry : reservedItems.entrySet()) {
                    inventoryService.releaseReservation(entry.getKey(), entry.getValue());
                }

                throw new BusinessLogicException("Payment failed: " + paymentResult.getErrorMessage());
            }

            order.setUpdatedAt(LocalDateTime.now());
            order = orderRepository.save(order);

            return mapToDto(order);

        } catch (Exception e) {
            // Release all reserved inventory on failure
            for (Map.Entry<Long, Integer> entry : reservedItems.entrySet()) {
                inventoryService.releaseReservation(entry.getKey(), entry.getValue());
            }
            throw e;
        }
    }

    /**
     * Update order status
     */
    @Caching(evict = {
        @CacheEvict(value = "orders", key = "#orderId"),
        @CacheEvict(value = "userOrders", allEntries = true)
    })
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus, String reason) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        // Set additional fields based on status
        if (newStatus == OrderStatus.SHIPPED) {
            order.setShippedAt(LocalDateTime.now());
        } else if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        } else if (newStatus == OrderStatus.CANCELLED) {
            order.setCancellationReason(reason);
            order.setCancelledAt(LocalDateTime.now());

            // Release inventory for cancelled orders
            List<OrderItem> items = orderRepository.findOrderItemsByOrderId(orderId);
            for (OrderItem item : items) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
        }

        order = orderRepository.save(order);

        // Audit log
        auditService.logOrderAction("ORDER_STATUS_CHANGED", order.getId(),
            String.format("Status changed from %s to %s", oldStatus, newStatus));

        return mapToDto(order);
    }

    /**
     * Get orders với filtering
     */
    @Cacheable(value = "orders", key = "#pageable.pageNumber + '_' + #pageable.pageSize + '_' + #filters")
    public Page<OrderDto> getOrders(Pageable pageable, Map<String, Object> filters) {
        Specification<Order> spec = Specification.where(null);

        if (filters.containsKey("status")) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("status"), filters.get("status")));
        }

        if (filters.containsKey("userId")) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("userId"), filters.get("userId")));
        }

        if (filters.containsKey("dateFrom")) {
            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("createdAt"), (LocalDateTime) filters.get("dateFrom")));
        }

        if (filters.containsKey("dateTo")) {
            spec = spec.and((root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("createdAt"), (LocalDateTime) filters.get("dateTo")));
        }

        Page<Order> orders = orderRepository.findAll(spec, pageable);
        return orders.map(this::mapToDto);
    }

    /**
     * Get order statistics
     */
    public Map<String, Object> getOrderStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long completedOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);

        // Revenue statistics
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();
        BigDecimal monthlyRevenue = orderRepository.getMonthlyRevenue(LocalDateTime.now().getMonthValue(), LocalDateTime.now().getYear());

        // Orders by status
        Map<OrderStatus, Long> ordersByStatus = Arrays.stream(OrderStatus.values())
            .collect(Collectors.toMap(
                status -> status,
                status -> orderRepository.countByStatus(status)
            ));

        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("ordersByStatus", ordersByStatus);

        return stats;
    }

    private void validateOrderInput(OrderDto orderDto) {
        if (orderDto.getUserId() == null) {
            throw new BusinessLogicException("User ID is required");
        }

        if (orderDto.getItems() == null || orderDto.getItems().isEmpty()) {
            throw new BusinessLogicException("Order must contain at least one item");
        }

        if (orderDto.getShippingAddress() == null) {
            throw new BusinessLogicException("Shipping address is required");
        }

        if (orderDto.getPaymentMethod() == null) {
            throw new BusinessLogicException("Payment method is required");
        }
    }

    private OrderDto mapToDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setUserId(order.getUserId());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setBillingAddress(order.getBillingAddress());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setShippedAt(order.getShippedAt());
        dto.setDeliveredAt(order.getDeliveredAt());

        // Map order items
        List<OrderItem> items = orderRepository.findOrderItemsByOrderId(order.getId());
        List<OrderItemDto> itemDtos = items.stream().map(this::mapItemToDto).collect(Collectors.toList());
        dto.setItems(itemDtos);

        return dto;
    }

    private OrderItemDto mapItemToDto(OrderItem item) {
        OrderItemDto dto = new OrderItemDto();
        dto.setProductId(item.getProductId());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        return dto;
    }
}

/**
 * Notification Service
 * Asynchronous notification handling
 */
@Service
@EnableAsync
public class NotificationService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    @Autowired
    private PushNotificationService pushService;

    /**
     * Send order notification
     */
    @Async
    public CompletableFuture<Void> sendOrderNotification(OrderDto order) {
        try {
            // Send email notification
            emailService.sendOrderNotification(order.getUserId(), order.getId());

            // Send SMS for high-value orders
            if (order.getTotalAmount().compareTo(new BigDecimal("1000")) > 0) {
                smsService.sendOrderConfirmation(order.getUserId(), order.getId());
            }

            // Send push notification
            pushService.sendOrderUpdate(order.getUserId(), "Order #" + order.getId() + " has been placed");

            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            logger.error("Failed to send order notification", e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send inventory alert
     */
    @Async
    public CompletableFuture<Void> sendInventoryAlert(ProductDto product) {
        try {
            // Send email to admin
            emailService.sendInventoryAlert(product.getId(), product.getStock());

            // Send push notification to managers
            pushService.sendInventoryAlert("Product " + product.getName() + " is running low");

            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            logger.error("Failed to send inventory alert", e);
            return CompletableFuture.failedFuture(e);
        }
    }
}

/**
 * Analytics Service
 * Business intelligence và reporting
 */
@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Get comprehensive dashboard data
     */
    public Map<String, Object> getDashboardData() {
        Map<String, Object> dashboard = new HashMap<>();

        // User metrics
        dashboard.put("userMetrics", getUserMetrics());

        // Product metrics
        dashboard.put("productMetrics", getProductMetrics());

        // Order metrics
        dashboard.put("orderMetrics", getOrderMetrics());

        // Revenue metrics
        dashboard.put("revenueMetrics", getRevenueMetrics());

        // Recent activities
        dashboard.put("recentActivities", getRecentActivities());

        return dashboard;
    }

    private Map<String, Object> getUserMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastMonth = now.minusMonths(1);

        long totalUsers = userRepository.count();
        long newUsersThisMonth = userRepository.countByCreatedAtAfter(lastMonth);
        long activeUsers = userRepository.countByLastLoginAtAfter(lastMonth);

        metrics.put("totalUsers", totalUsers);
        metrics.put("newUsersThisMonth", newUsersThisMonth);
        metrics.put("activeUsers", activeUsers);
        metrics.put("userGrowthRate", calculateGrowthRate(totalUsers, newUsersThisMonth));

        return metrics;
    }

    private Map<String, Object> getProductMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long totalProducts = productRepository.count();
        long outOfStockProducts = productRepository.countByStock(0);
        long lowStockProducts = productRepository.countByStockLessThanMinStock();

        BigDecimal averagePrice = productRepository.getAveragePrice();

        metrics.put("totalProducts", totalProducts);
        metrics.put("outOfStockProducts", outOfStockProducts);
        metrics.put("lowStockProducts", lowStockProducts);
        metrics.put("averagePrice", averagePrice);

        return metrics;
    }

    private Map<String, Object> getOrderMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long completedOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);

        BigDecimal averageOrderValue = orderRepository.getAverageOrderValue();

        metrics.put("totalOrders", totalOrders);
        metrics.put("pendingOrders", pendingOrders);
        metrics.put("completedOrders", completedOrders);
        metrics.put("averageOrderValue", averageOrderValue);

        return metrics;
    }

    private Map<String, Object> getRevenueMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        BigDecimal totalRevenue = orderRepository.getTotalRevenue();
        BigDecimal monthlyRevenue = orderRepository.getMonthlyRevenue(
            LocalDateTime.now().getMonthValue(),
            LocalDateTime.now().getYear()
        );

        LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
        BigDecimal lastMonthRevenue = orderRepository.getMonthlyRevenue(
            lastMonth.getMonthValue(),
            lastMonth.getYear()
        );

        BigDecimal revenueGrowth = BigDecimal.ZERO;
        if (lastMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenueGrowth = monthlyRevenue.subtract(lastMonthRevenue)
                .divide(lastMonthRevenue, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
        }

        metrics.put("totalRevenue", totalRevenue);
        metrics.put("monthlyRevenue", monthlyRevenue);
        metrics.put("revenueGrowth", revenueGrowth);

        return metrics;
    }

    private List<Map<String, Object>> getRecentActivities() {
        // Get recent orders, user registrations, product updates
        List<Map<String, Object>> activities = new ArrayList<>();

        // Recent orders
        List<Order> recentOrders = orderRepository.findTop10ByOrderByCreatedAtDesc();
        for (Order order : recentOrders) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "order");
            activity.put("message", "New order #" + order.getId());
            activity.put("timestamp", order.getCreatedAt());
            activities.add(activity);
        }

        // Recent user registrations
        List<User> recentUsers = userRepository.findTop10ByOrderByCreatedAtDesc();
        for (User user : recentUsers) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "user");
            activity.put("message", "New user registered: " + user.getFirstName() + " " + user.getLastName());
            activity.put("timestamp", user.getCreatedAt());
            activities.add(activity);
        }

        // Sort by timestamp and limit to 20
        return activities.stream()
            .sorted((a, b) -> ((LocalDateTime) b.get("timestamp")).compareTo((LocalDateTime) a.get("timestamp")))
            .limit(20)
            .collect(Collectors.toList());
    }

    private BigDecimal calculateGrowthRate(long total, long newThisPeriod) {
        if (total == 0) return BigDecimal.ZERO;

        long previousPeriod = total - newThisPeriod;
        if (previousPeriod <= 0) return new BigDecimal("100");

        return new BigDecimal(newThisPeriod)
            .divide(new BigDecimal(previousPeriod), 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }
}

/**
 * Email Service với templates
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    /**
     * Send welcome email
     */
    public void sendWelcomeEmail(String email, String name) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("loginUrl", "https://yourapp.com/login");

        String htmlContent = templateEngine.process("email/welcome", context);

        sendEmail(email, "Welcome to Our Platform", htmlContent);
    }

    /**
     * Send order confirmation email
     */
    public void sendOrderConfirmation(Long userId, Long orderId) {
        // Get user and order details
        User user = userRepository.findById(userId).orElse(null);
        Order order = orderRepository.findById(orderId).orElse(null);

        if (user == null || order == null) return;

        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("order", order);
        context.setVariable("orderItems", orderRepository.findOrderItemsByOrderId(orderId));

        String htmlContent = templateEngine.process("email/order-confirmation", context);

        sendEmail(user.getEmail(), "Order Confirmation #" + orderId, htmlContent);
    }

    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String email, String tempPassword) {
        Context context = new Context();
        context.setVariable("tempPassword", tempPassword);
        context.setVariable("resetUrl", "https://yourapp.com/reset-password");

        String htmlContent = templateEngine.process("email/password-reset", context);

        sendEmail(email, "Password Reset", htmlContent);
    }

    /**
     * Send inventory alert email
     */
    public void sendInventoryAlert(Long productId, int currentStock) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        Context context = new Context();
        context.setVariable("product", product);
        context.setVariable("currentStock", currentStock);

        String htmlContent = templateEngine.process("email/inventory-alert", context);

        // Send to admin email
        sendEmail("admin@yourcompany.com", "Low Inventory Alert", htmlContent);
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom("noreply@yourcompany.com");

            mailSender.send(message);

        } catch (Exception e) {
            logger.error("Failed to send email to: " + to, e);
            throw new RuntimeException("Email sending failed", e);
        }
    }
}

/**
 * Inventory Management Service
 */
@Service
@Transactional
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Initialize inventory cho sản phẩm mới
     */
    public void initializeInventory(Long productId, int initialStock) {
        Inventory inventory = new Inventory();
        inventory.setProductId(productId);
        inventory.setAvailableStock(initialStock);
        inventory.setReservedStock(0);
        inventory.setReorderLevel(10);
        inventory.setCreatedAt(LocalDateTime.now());
        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);
    }

    /**
     * Reserve inventory cho đơn hàng
     */
    public boolean reserveInventory(Long productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));

        if (inventory.getAvailableStock() < quantity) {
            return false;
        }

        inventory.setAvailableStock(inventory.getAvailableStock() - quantity);
        inventory.setReservedStock(inventory.getReservedStock() + quantity);
        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);
        return true;
    }

    /**
     * Confirm inventory reservation (after payment)
     */
    public void confirmReservation(Long productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        if (inventory != null) {
            inventory.setReservedStock(inventory.getReservedStock() - quantity);
            inventory.setUpdatedAt(LocalDateTime.now());
            inventoryRepository.save(inventory);
        }
    }

    /**
     * Release inventory reservation (cancelled order)
     */
    public void releaseReservation(Long productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        if (inventory != null) {
            inventory.setAvailableStock(inventory.getAvailableStock() + quantity);
            inventory.setReservedStock(inventory.getReservedStock() - quantity);
            inventory.setUpdatedAt(LocalDateTime.now());
            inventoryRepository.save(inventory);
        }
    }

    /**
     * Record stock change
     */
    public void recordStockChange(Long productId, int oldStock, int newStock, String reason) {
        StockChange change = new StockChange();
        change.setProductId(productId);
        change.setOldStock(oldStock);
        change.setNewStock(newStock);
        change.setChangeAmount(newStock - oldStock);
        change.setReason(reason);
        change.setChangedAt(LocalDateTime.now());

        // Save stock change record
        // stockChangeRepository.save(change);
    }

    /**
     * Check if product needs reorder
     */
    public boolean needsReorder(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
        return inventory != null && inventory.getAvailableStock() <= inventory.getReorderLevel();
    }

    /**
     * Get inventory summary
     */
    public Map<String, Object> getInventorySummary() {
        Map<String, Object> summary = new HashMap<>();

        long totalProducts = inventoryRepository.count();
        long lowStockProducts = inventoryRepository.countByAvailableStockLessThanEqual(10);
        long outOfStockProducts = inventoryRepository.countByAvailableStock(0);

        BigDecimal totalInventoryValue = inventoryRepository.getTotalInventoryValue();

        summary.put("totalProducts", totalProducts);
        summary.put("lowStockProducts", lowStockProducts);
        summary.put("outOfStockProducts", outOfStockProducts);
        summary.put("totalInventoryValue", totalInventoryValue);

        return summary;
    }
}

/**
 * Payment Processing Service
 */
@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Process payment
     */
    public PaymentResult processPayment(OrderDto order) {
        try {
            // Validate payment method
            if (!isValidPaymentMethod(order.getPaymentMethod())) {
                return new PaymentResult(false, null, "Invalid payment method");
            }

            // Process payment based on method
            String paymentId = null;
            boolean success = false;

            switch (order.getPaymentMethod()) {
                case CREDIT_CARD:
                    paymentId = processCreditCardPayment(order);
                    success = paymentId != null;
                    break;
                case PAYPAL:
                    paymentId = processPayPalPayment(order);
                    success = paymentId != null;
                    break;
                case BANK_TRANSFER:
                    paymentId = processBankTransfer(order);
                    success = paymentId != null;
                    break;
            }

            // Save payment record
            Payment payment = new Payment();
            payment.setOrderId(order.getId());
            payment.setAmount(order.getTotalAmount());
            payment.setPaymentMethod(order.getPaymentMethod());
            payment.setPaymentId(paymentId);
            payment.setStatus(success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED);
            payment.setProcessedAt(LocalDateTime.now());

            paymentRepository.save(payment);

            return new PaymentResult(success, paymentId, success ? "Payment successful" : "Payment failed");

        } catch (Exception e) {
            logger.error("Payment processing failed", e);
            return new PaymentResult(false, null, "Payment processing error: " + e.getMessage());
        }
    }

    private String processCreditCardPayment(OrderDto order) {
        // Integration with payment gateway (Stripe, PayPal, etc.)
        // This is a simplified example

        // Simulate payment processing
        if (Math.random() > 0.05) { // 95% success rate
            return "cc_" + System.currentTimeMillis();
        }

        return null;
    }

    private String processPayPalPayment(OrderDto order) {
        // PayPal integration
        return "pp_" + System.currentTimeMillis();
    }

    private String processBankTransfer(OrderDto order) {
        // Bank transfer processing
        return "bt_" + System.currentTimeMillis();
    }

    private boolean isValidPaymentMethod(PaymentMethod method) {
        return Arrays.asList(PaymentMethod.CREDIT_CARD, PaymentMethod.PAYPAL, PaymentMethod.BANK_TRANSFER)
            .contains(method);
    }
}

// Import statements cần thiết
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.logging.Logger;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import java.util.concurrent.CompletableFuture;
import javax.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
