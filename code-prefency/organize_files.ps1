# PowerShell script để tổ chức lại cấu trúc thư mục code-prefency

# Tạo tất cả thư mục cần thiết
$folders = @(
    "frontend/web/html-css-js",
    "frontend/web/react",
    "frontend/web/vanilla-js",
    "backend/php",
    "backend/java-spring",
    "backend/csharp-dotnet",
    "backend/go",
    "backend/python",
    "mobile/kotlin-android",
    "desktop/cpp",
    "database/schemas",
    "database/seeds",
    "infrastructure/docker",
    "infrastructure/terraform",
    "infrastructure/kubernetes",
    "infrastructure/jenkins",
    "config",
    "security/policies",
    "security/compliance",
    "security/checklists",
    "docs/api",
    "docs/deployment",
    "docs/troubleshooting",
    "docs/contributing",
    "tests",
    "scripts",
    "tools"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency" $folder
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created folder: $folder"
    }
}

Write-Host "All folders created successfully!"

# Di chuyển files vào đúng vị trí
Write-Host "Moving files to organized structure..."

# Frontend files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\index.html" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\styles.css" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\product.html" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\product.css" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\blog.html" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\blog.css" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\contact.html" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\contact.css" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\dashboard.html" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\dashboard.css" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\html-css-js\" -ErrorAction SilentlyContinue

# React files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\App.jsx" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\react\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\App.tsx" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\react\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\components.jsx" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\react\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\components.tsx" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\react\" -ErrorAction SilentlyContinue

# Vanilla JavaScript files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\app.js" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\vanilla-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\game.js" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\vanilla-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\utils.js" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\vanilla-js\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\server.mjs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\frontend\web\vanilla-js\" -ErrorAction SilentlyContinue

# Backend PHP files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config.php" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\php\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\database.php" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\php\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\auth.php" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\php\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\api.php" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\php\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\middleware.php" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\php\" -ErrorAction SilentlyContinue

# Backend Java files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\DatabaseConfig.java" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\java-spring\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\SecurityConfig.java" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\java-spring\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\ServiceLayer.java" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\java-spring\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\RestController.java" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\java-spring\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\UserManagementApplication.java" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\java-spring\" -ErrorAction SilentlyContinue

# Backend C# files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\Program.cs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\csharp-dotnet\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\DatabaseContext.cs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\csharp-dotnet\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\Controllers.cs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\csharp-dotnet\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\Middleware.cs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\csharp-dotnet\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\SecurityConfig.cs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\csharp-dotnet\" -ErrorAction SilentlyContinue

# Backend Go files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\main.go" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\go\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\database.go" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\go\" -ErrorAction SilentlyContinue

# Backend Python files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\main.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\api_client.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\automation.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\data_analysis.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\desktop_app.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\user_manager.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\web_scraper.py" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backend\python\" -ErrorAction SilentlyContinue

# Mobile Kotlin files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\MainActivity.kt" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\mobile\kotlin-android\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\UserViewModel.kt" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\mobile\kotlin-android\" -ErrorAction SilentlyContinue

# Desktop C++ files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\main.cpp" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\desktop\cpp\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\desktop_app.cpp" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\desktop\cpp\" -ErrorAction SilentlyContinue

# Database files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\schema.sql" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\database\schemas\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\seed_data.sql" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\database\seeds\" -ErrorAction SilentlyContinue

# Infrastructure files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\Dockerfile" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\infrastructure\docker\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\docker-compose.yml" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\infrastructure\docker\" -ErrorAction SilentlyContinue

# Terraform files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\terraform\main.tf" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\infrastructure\terraform\" -ErrorAction SilentlyContinue

# Configuration files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\appsettings.json" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config.php" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config.json" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config.yaml" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\config\" -ErrorAction SilentlyContinue

# Security files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\security_policy.md" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\security\policies\" -ErrorAction SilentlyContinue

# Documentation files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\API.md" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\docs\api\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\deployment_guide.md" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\docs\deployment\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\troubleshooting.md" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\docs\troubleshooting\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\contributing.md" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\docs\contributing\" -ErrorAction SilentlyContinue

# Testing files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\UserServiceTests.cs" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\tests\" -ErrorAction SilentlyContinue

# Tools files
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\user_management.asm" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\tools\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\user_management.h" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\tools\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\types.ts" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\tools\" -ErrorAction SilentlyContinue

# Script files (nếu có)
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\deploy.sh" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\scripts\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\backup.sh" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\scripts\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\health_check.sh" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\scripts\" -ErrorAction SilentlyContinue
Move-Item "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\migration.sh" "C:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground\code-prefency\scripts\" -ErrorAction SilentlyContinue

Write-Host "File organization completed successfully!"
