package com.codeprefency.usermanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.codeprefency.usermanagement.security.JwtAuthenticationEntryPoint;
import com.codeprefency.usermanagement.security.JwtAuthenticationFilter;
import com.codeprefency.usermanagement.service.CustomUserDetailsService;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration for User Management System
 * JWT authentication, OAuth2, và advanced security features
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            CustomUserDetailsService userDetailsService,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Strength 12 for better security
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for API endpoints
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/**")
                .csrfTokenRepository(org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse())
            )

            // Configure CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Session management - stateless for APIs
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Exception handling
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(403);
                    response.getWriter().write("{\"error\": \"Access denied\", \"message\": \"" + accessDeniedException.getMessage() + "\"}");
                })
            )

            // Authorization rules
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/", "/login", "/register", "/forgot-password", "/reset-password").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Admin only endpoints
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/users/**").hasAnyRole("ADMIN", "MODERATOR")

                // User authenticated endpoints
                .requestMatchers("/api/user/**").authenticated()
                .requestMatchers("/dashboard").authenticated()

                // API documentation
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()

                // Static resources
                .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()

                // All other requests require authentication
                .anyRequest().authenticated()
            )

            // Add JWT filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins in production
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "https://localhost:*",
            "https://*.yourdomain.com"
        ));

        // Allow specific methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
        ));

        // Allow specific headers
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        // Expose specific headers
        configuration.setExposedHeaders(Arrays.asList(
            "X-Total-Count",
            "X-Page-Count",
            "X-Per-Page"
        ));

        // Allow credentials
        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}

/**
 * JWT Configuration
 */
@Configuration
class JwtConfig {

    @Bean
    public JwtUtils jwtUtils(@Value("${jwt.secret:mySecretKey}") String secret,
                           @Value("${jwt.expiration:86400}") long expiration) {
        return new JwtUtils(secret, expiration);
    }
}

/**
 * OAuth2 Configuration
 */
@Configuration
@EnableWebSecurity
class OAuth2Config {

    @Bean
    public SecurityFilterChain oauth2FilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/login?error=true")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oauth2UserService())
                )
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
            );

        return http.build();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        return new CustomOAuth2UserService();
    }
}

/**
 * Rate Limiting Configuration
 */
@Configuration
@EnableCaching
class RateLimitConfig {

    @Bean
    public Map<String, Integer> rateLimitRules() {
        Map<String, Integer> rules = new HashMap<>();

        // API rate limits (requests per minute)
        rules.put("/api/auth/login", 5);
        rules.put("/api/auth/register", 3);
        rules.put("/api/users", 100);
        rules.put("/api/products", 200);
        rules.put("/api/orders", 150);

        return rules;
    }

    @Bean
    public RateLimiter rateLimiter(Map<String, Integer> rateLimitRules) {
        return new RateLimiter(rateLimitRules);
    }
}

/**
 * Security Monitoring Configuration
 */
@Configuration
class SecurityMonitoringConfig {

    @Bean
    public SecurityEventListener securityEventListener() {
        return new SecurityEventListener();
    }

    @Bean
    public FailedLoginListener failedLoginListener() {
        return new FailedLoginListener();
    }
}

/**
 * Advanced Security Features
 */
@Component
class AdvancedSecurity {

    private final PasswordEncoder passwordEncoder;
    private final Logger logger = LoggerFactory.getLogger(AdvancedSecurity.class);

    public AdvancedSecurity(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Comprehensive password validation
     */
    public List<String> validatePassword(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.length() < 8) {
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

        // Check for common passwords
        if (isCommonPassword(password)) {
            errors.add("Password is too common. Please choose a stronger password");
        }

        // Check for sequential characters
        if (hasSequentialChars(password)) {
            errors.add("Password should not contain sequential characters");
        }

        return errors;
    }

    private boolean isCommonPassword(String password) {
        // In production, this should check against a database of common passwords
        String[] commonPasswords = {
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "123456789", "password1"
        };

        return Arrays.asList(commonPasswords).contains(password.toLowerCase());
    }

    private boolean hasSequentialChars(String password) {
        String lower = password.toLowerCase();

        // Check for sequential letters (abc, bcd, etc.)
        for (int i = 0; i < lower.length() - 2; i++) {
            char a = lower.charAt(i);
            char b = lower.charAt(i + 1);
            char c = lower.charAt(i + 2);

            if (b == a + 1 && c == b + 1) {
                return true;
            }
        }

        // Check for sequential numbers (123, 234, etc.)
        for (int i = 0; i < lower.length() - 2; i++) {
            char a = lower.charAt(i);
            char b = lower.charAt(i + 1);
            char c = lower.charAt(i + 2);

            if (Character.isDigit(a) && Character.isDigit(b) && Character.isDigit(c)) {
                if (b == a + 1 && c == b + 1) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate secure password hash
     */
    public String hashPassword(String password) {
        return passwordEncoder.encode(password);
    }

    /**
     * Verify password với timing attack protection
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        // Use constant time comparison to prevent timing attacks
        return passwordEncoder.matches(plainPassword, hashedPassword);
    }

    /**
     * Generate cryptographically secure token
     */
    public String generateSecureToken(int length = 32) {
        return RandomStringUtils.randomAlphanumeric(length);
    }

    /**
     * Encrypt sensitive data
     */
    public String encryptData(String data, String key) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKey secretKey = new SecretKeySpec(key.getBytes(), "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(128, generateIV());

            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] encryptedBytes = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            logger.error("Encryption failed", e);
            throw new SecurityException("Failed to encrypt data");
        }
    }

    /**
     * Decrypt sensitive data
     */
    public String decryptData(String encryptedData, String key) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKey secretKey = new SecretKeySpec(key.getBytes(), "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(128, generateIV());

            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
            return new String(decryptedBytes);
        } catch (Exception e) {
            logger.error("Decryption failed", e);
            throw new SecurityException("Failed to decrypt data");
        }
    }

    private byte[] generateIV() {
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    /**
     * Validate API key format và strength
     */
    public boolean validateApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 32) {
            return false;
        }

        // Check for required character types
        boolean hasUpper = apiKey.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = apiKey.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = apiKey.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = apiKey.chars().anyMatch(ch -> "!@#$%^&*()_+-=[]{}|;:,.<>?".indexOf(ch) >= 0);

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /**
     * Generate secure API key
     */
    public String generateApiKey() {
        String upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerCase = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        String allChars = upperCase + lowerCase + digits + special;
        SecureRandom random = new SecureRandom();

        StringBuilder apiKey = new StringBuilder();

        // Ensure at least one of each character type
        apiKey.append(upperCase.charAt(random.nextInt(upperCase.length())));
        apiKey.append(lowerCase.charAt(random.nextInt(lowerCase.length())));
        apiKey.append(digits.charAt(random.nextInt(digits.length())));
        apiKey.append(special.charAt(random.nextInt(special.length())));

        // Fill remaining length
        for (int i = 4; i < 64; i++) {
            apiKey.append(allChars.charAt(random.nextInt(allChars.length())));
        }

        // Shuffle the result
        List<Character> chars = apiKey.chars()
            .mapToObj(c -> (char) c)
            .collect(Collectors.toList());

        Collections.shuffle(chars, random);

        return chars.stream()
            .map(String::valueOf)
            .collect(Collectors.joining());
    }
}

/**
 * Security Audit và Monitoring
 */
@Service
class SecurityAuditService {

    private final Logger logger = LoggerFactory.getLogger(SecurityAuditService.class);

    @Autowired
    private SecurityEventRepository securityEventRepository;

    /**
     * Log security event
     */
    public void logSecurityEvent(SecurityEventType eventType, String description,
                               String ipAddress, String userAgent, Long userId) {
        SecurityEvent event = new SecurityEvent();
        event.setEventType(eventType);
        event.setDescription(description);
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        event.setUserId(userId);
        event.setTimestamp(LocalDateTime.now());

        securityEventRepository.save(event);

        logger.info("Security event logged: {} - {} from IP: {}",
                   eventType, description, ipAddress);
    }

    /**
     * Get security events for analysis
     */
    public List<SecurityEvent> getSecurityEvents(LocalDateTime startDate, LocalDateTime endDate) {
        return securityEventRepository.findByTimestampBetween(startDate, endDate);
    }

    /**
     * Detect suspicious activities
     */
    public List<SuspiciousActivity> detectSuspiciousActivities() {
        List<SuspiciousActivity> suspiciousActivities = new ArrayList<>();

        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        // Multiple failed login attempts
        List<SecurityEvent> failedLogins = securityEventRepository
            .findByEventTypeAndTimestampAfter(SecurityEventType.FAILED_LOGIN, oneHourAgo);

        Map<String, Long> failedLoginCounts = failedLogins.stream()
            .collect(Collectors.groupingBy(SecurityEvent::getIpAddress, Collectors.counting()));

        failedLoginCounts.forEach((ip, count) -> {
            if (count >= 5) {
                suspiciousActivities.add(new SuspiciousActivity(
                    "Multiple failed login attempts",
                    "IP: " + ip + " has " + count + " failed attempts in the last hour",
                    ip,
                    LocalDateTime.now()
                ));
            }
        });

        // Unusual access patterns
        List<SecurityEvent> accessEvents = securityEventRepository
            .findByEventTypeAndTimestampAfter(SecurityEventType.API_ACCESS, oneHourAgo);

        // Analyze for unusual patterns...

        return suspiciousActivities;
    }
}

/**
 * Two-Factor Authentication Service
 */
@Service
class TwoFactorAuthService {

    private final String issuer = "UserManagementApp";

    /**
     * Generate 2FA secret
     */
    public String generateSecret() {
        return Base32.random();
    }

    /**
     * Generate QR code URL cho 2FA setup
     */
    public String generateQRCodeUrl(String accountName, String secret) {
        try {
            String otpAuthUrl = String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s",
                URLEncoder.encode(issuer, "UTF-8"),
                URLEncoder.encode(accountName, "UTF-8"),
                secret,
                URLEncoder.encode(issuer, "UTF-8")
            );

            return otpAuthUrl;
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to generate QR code URL", e);
        }
    }

    /**
     * Verify 2FA code
     */
    public boolean verifyCode(String secret, String code) {
        return verifyCode(secret, code, System.currentTimeMillis() / 1000L);
    }

    public boolean verifyCode(String secret, String code, long time) {
        byte[] key = Base32.decode(secret);

        for (int i = -2; i <= 2; i++) {
            long timeWindow = time / 30 + i;
            String expectedCode = generateTOTP(key, timeWindow);

            if (expectedCode.equals(code)) {
                return true;
            }
        }

        return false;
    }

    private String generateTOTP(byte[] key, long time) {
        byte[] timeBytes = ByteBuffer.allocate(8).putLong(time).array();

        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));

            byte[] hash = mac.doFinal(timeBytes);

            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24) |
                        ((hash[offset + 1] & 0xff) << 16) |
                        ((hash[offset + 2] & 0xff) << 8) |
                        (hash[offset + 3] & 0xff);

            int otp = binary % 1000000;

            return String.format("%06d", otp);

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate TOTP", e);
        }
    }
}

/**
 * Security Headers Configuration
 */
@Configuration
class SecurityHeadersConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SecurityHeadersInterceptor());
    }

    private static class SecurityHeadersInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                               Object handler) throws Exception {

            // Prevent MIME type sniffing
            response.setHeader("X-Content-Type-Options", "nosniff");

            // Enable XSS protection
            response.setHeader("X-XSS-Protection", "1; mode=block");

            // Prevent clickjacking
            response.setHeader("X-Frame-Options", "DENY");

            // Force HTTPS
            response.setHeader("Strict-Transport-Security",
                             "max-age=31536000; includeSubDomains");

            // Content Security Policy
            response.setHeader("Content-Security-Policy",
                             "default-src 'self'; " +
                             "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                             "style-src 'self' 'unsafe-inline'; " +
                             "img-src 'self' data: https:; " +
                             "font-src 'self' https://fonts.gstatic.com; " +
                             "connect-src 'self'");

            // Referrer Policy
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

            // Permissions Policy
            response.setHeader("Permissions-Policy",
                             "camera=(), microphone=(), geolocation=()");

            return true;
        }
    }
}

/**
 * API Key Management Service
 */
@Service
class ApiKeyService {

    @Autowired
    private ApiKeyRepository apiKeyRepository;

    @Autowired
    private AdvancedSecurity advancedSecurity;

    /**
     * Generate new API key
     */
    public ApiKey generateApiKey(String userId, String name, List<String> permissions) {
        String key = advancedSecurity.generateApiKey();

        ApiKey apiKey = new ApiKey();
        apiKey.setUserId(userId);
        apiKey.setName(name);
        apiKey.setKeyHash(hashApiKey(key));
        apiKey.setPermissions(permissions);
        apiKey.setExpiresAt(LocalDateTime.now().plusYears(1));
        apiKey.setLastUsedAt(LocalDateTime.now());
        apiKey.setIsActive(true);

        return apiKeyRepository.save(apiKey);
    }

    /**
     * Validate API key
     */
    public boolean validateApiKey(String apiKey) {
        if (!advancedSecurity.validateApiKey(apiKey)) {
            return false;
        }

        String keyHash = hashApiKey(apiKey);
        Optional<ApiKey> storedKey = apiKeyRepository.findByKeyHashAndIsActive(keyHash, true);

        if (storedKey.isEmpty()) {
            return false;
        }

        ApiKey key = storedKey.get();

        // Check expiration
        if (key.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Update last used
        key.setLastUsedAt(LocalDateTime.now());
        apiKeyRepository.save(key);

        return true;
    }

    /**
     * Get API key permissions
     */
    public List<String> getApiKeyPermissions(String apiKey) {
        String keyHash = hashApiKey(apiKey);
        Optional<ApiKey> storedKey = apiKeyRepository.findByKeyHashAndIsActive(keyHash, true);

        return storedKey.map(ApiKey::getPermissions).orElse(new ArrayList<>());
    }

    private String hashApiKey(String apiKey) {
        return Hashing.sha256().hashString(apiKey, StandardCharsets.UTF_8).toString();
    }
}

/**
 * Brute Force Protection
 */
@Component
class BruteForceProtection {

    private final Map<String, LoginAttempt> attempts = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    /**
     * Record failed login attempt
     */
    public void recordFailedAttempt(String identifier) {
        LoginAttempt attempt = attempts.computeIfAbsent(identifier, k -> new LoginAttempt());
        attempt.increment();

        if (attempt.getCount() >= 5) {
            attempt.setBlocked(true);
            attempt.setBlockedUntil(LocalDateTime.now().plusMinutes(15));

            // Schedule cleanup after block period
            scheduler.schedule(() -> {
                attempts.remove(identifier);
            }, 15, TimeUnit.MINUTES);
        }
    }

    /**
     * Check if identifier is blocked
     */
    public boolean isBlocked(String identifier) {
        LoginAttempt attempt = attempts.get(identifier);
        if (attempt == null) {
            return false;
        }

        if (attempt.isBlocked() && attempt.getBlockedUntil().isAfter(LocalDateTime.now())) {
            return true;
        }

        // Reset if block period expired
        if (attempt.isBlocked() && attempt.getBlockedUntil().isBefore(LocalDateTime.now())) {
            attempts.remove(identifier);
            return false;
        }

        return false;
    }

    /**
     * Record successful login
     */
    public void recordSuccessfulLogin(String identifier) {
        attempts.remove(identifier);
    }

    private static class LoginAttempt {
        private int count = 0;
        private boolean blocked = false;
        private LocalDateTime blockedUntil;

        public void increment() {
            this.count++;
        }

        public int getCount() {
            return count;
        }

        public boolean isBlocked() {
            return blocked;
        }

        public void setBlocked(boolean blocked) {
            this.blocked = blocked;
        }

        public LocalDateTime getBlockedUntil() {
            return blockedUntil;
        }

        public void setBlockedUntil(LocalDateTime blockedUntil) {
            this.blockedUntil = blockedUntil;
        }
    }
}

/**
 * Security Event Types
 */
enum SecurityEventType {
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    LOGOUT,
    PASSWORD_CHANGE,
    API_ACCESS,
    SUSPICIOUS_ACTIVITY,
    BRUTE_FORCE_ATTEMPT,
    UNAUTHORIZED_ACCESS
}

/**
 * Security Event Entity
 */
@Entity
@Table(name = "security_events")
class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SecurityEventType eventType;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column
    private Long userId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Constructors, getters, setters
    public SecurityEvent() {}

    public SecurityEvent(SecurityEventType eventType, String description, String ipAddress) {
        this.eventType = eventType;
        this.description = description;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and setters...
}

/**
 * Suspicious Activity DTO
 */
class SuspiciousActivity {
    private String type;
    private String description;
    private String ipAddress;
    private LocalDateTime detectedAt;

    public SuspiciousActivity(String type, String description, String ipAddress, LocalDateTime detectedAt) {
        this.type = type;
        this.description = description;
        this.ipAddress = ipAddress;
        this.detectedAt = detectedAt;
    }

    // Getters and setters...
}

// Import statements cần thiết
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.cache.annotation.EnableCaching;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.Collections;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.GCMParameterSpec;
import java.util.Base64;
import java.security.NoSuchAlgorithmException;
import java.security.InvalidKeyException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.BadPaddingException;
import java.time.LocalDateTime;
import java.util.Date;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import java.net.URLEncoder;
import java.io.UnsupportedEncodingException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import java.time.Duration;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Id;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Enumerated;
import javax.persistence.EnumType;
import javax.persistence.Column;
import javax.persistence.ManyToOne;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.CascadeType;
import javax.persistence.FetchType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
