@echo off
REM Batch script để tổ chức lại cấu trúc thư mục code-prefency

echo Organizing files into structured directories...

REM Tạo các thư mục cần thiết
mkdir frontend\web\html-css-js 2>nul
mkdir frontend\web\react 2>nul
mkdir frontend\web\vanilla-js 2>nul
mkdir backend\php 2>nul
mkdir backend\java-spring 2>nul
mkdir backend\csharp-dotnet 2>nul
mkdir backend\go 2>nul
mkdir backend\python 2>nul
mkdir mobile\kotlin-android 2>nul
mkdir desktop\cpp 2>nul
mkdir database\schemas 2>nul
mkdir database\seeds 2>nul
mkdir infrastructure\docker 2>nul
mkdir infrastructure\terraform 2>nul
mkdir config 2>nul
mkdir security\policies 2>nul
mkdir docs\api 2>nul
mkdir docs\deployment 2>nul
mkdir docs\troubleshooting 2>nul
mkdir docs\contributing 2>nul
mkdir tests 2>nul
mkdir scripts 2>nul
mkdir tools 2>nul

REM Di chuyển files vào đúng vị trí
echo Moving HTML/CSS/JS files...
move /Y index.html frontend\web\html-css-js\ >nul 2>&1
move /Y styles.css frontend\web\html-css-js\ >nul 2>&1
move /Y product.html frontend\web\html-css-js\ >nul 2>&1
move /Y product.css frontend\web\html-css-js\ >nul 2>&1
move /Y blog.html frontend\web\html-css-js\ >nul 2>&1
move /Y blog.css frontend\web\html-css-js\ >nul 2>&1
move /Y contact.html frontend\web\html-css-js\ >nul 2>&1
move /Y contact.css frontend\web\html-css-js\ >nul 2>&1
move /Y dashboard.html frontend\web\html-css-js\ >nul 2>&1
move /Y dashboard.css frontend\web\html-css-js\ >nul 2>&1

echo Moving React files...
move /Y App.jsx frontend\web\react\ >nul 2>&1
move /Y App.tsx frontend\web\react\ >nul 2>&1
move /Y components.jsx frontend\web\react\ >nul 2>&1
move /Y components.tsx frontend\web\react\ >nul 2>&1

echo Moving JavaScript files...
move /Y app.js frontend\web\vanilla-js\ >nul 2>&1
move /Y game.js frontend\web\vanilla-js\ >nul 2>&1
move /Y utils.js frontend\web\vanilla-js\ >nul 2>&1
move /Y server.mjs frontend\web\vanilla-js\ >nul 2>&1

echo Moving PHP backend files...
move /Y config.php backend\php\ >nul 2>&1
move /Y database.php backend\php\ >nul 2>&1
move /Y auth.php backend\php\ >nul 2>&1
move /Y api.php backend\php\ >nul 2>&1
move /Y middleware.php backend\php\ >nul 2>&1

echo Moving Java Spring files...
move /Y DatabaseConfig.java backend\java-spring\ >nul 2>&1
move /Y SecurityConfig.java backend\java-spring\ >nul 2>&1
move /Y ServiceLayer.java backend\java-spring\ >nul 2>&1
move /Y RestController.java backend\java-spring\ >nul 2>&1
move /Y UserManagementApplication.java backend\java-spring\ >nul 2>&1

echo Moving C# .NET files...
move /Y Program.cs backend\csharp-dotnet\ >nul 2>&1
move /Y DatabaseContext.cs backend\csharp-dotnet\ >nul 2>&1
move /Y Controllers.cs backend\csharp-dotnet\ >nul 2>&1
move /Y Middleware.cs backend\csharp-dotnet\ >nul 2>&1
move /Y SecurityConfig.cs backend\csharp-dotnet\ >nul 2>&1

echo Moving Go files...
move /Y main.go backend\go\ >nul 2>&1
move /Y database.go backend\go\ >nul 2>&1

echo Moving Python files...
move /Y main.py backend\python\ >nul 2>&1
move /Y api_client.py backend\python\ >nul 2>&1
move /Y automation.py backend\python\ >nul 2>&1
move /Y data_analysis.py backend\python\ >nul 2>&1
move /Y desktop_app.py backend\python\ >nul 2>&1
move /Y user_manager.py backend\python\ >nul 2>&1
move /Y web_scraper.py backend\python\ >nul 2>&1

echo Moving Kotlin files...
move /Y MainActivity.kt mobile\kotlin-android\ >nul 2>&1
move /Y UserViewModel.kt mobile\kotlin-android\ >nul 2>&1

echo Moving C++ files...
move /Y main.cpp desktop\cpp\ >nul 2>&1
move /Y desktop_app.cpp desktop\cpp\ >nul 2>&1

echo Moving database files...
move /Y schema.sql database\schemas\ >nul 2>&1
move /Y seed_data.sql database\seeds\ >nul 2>&1

echo Moving infrastructure files...
move /Y Dockerfile infrastructure\docker\ >nul 2>&1
move /Y docker-compose.yml infrastructure\docker\ >nul 2>&1
move /Y terraform\main.tf infrastructure\terraform\ >nul 2>&1

echo Moving configuration files...
move /Y appsettings.json config\ >nul 2>&1
move /Y config.php config\ >nul 2>&1
move /Y config.json config\ >nul 2>&1
move /Y config.yaml config\ >nul 2>&1
move /Y .env.example config\ >nul 2>&1

echo Moving security files...
move /Y security_policy.md security\policies\ >nul 2>&1

echo Moving documentation files...
if exist API.md move /Y API.md docs\api\ >nul 2>&1
if exist deployment_guide.md move /Y deployment_guide.md docs\deployment\ >nul 2>&1
if exist troubleshooting.md move /Y troubleshooting.md docs\troubleshooting\ >nul 2>&1
if exist contributing.md move /Y contributing.md docs\contributing\ >nul 2>&1

echo Moving test files...
move /Y UserServiceTests.cs tests\ >nul 2>&1

echo Moving tool files...
move /Y user_management.asm tools\ >nul 2>&1
move /Y user_management.h tools\ >nul 2>&1
move /Y types.ts tools\ >nul 2>&1

echo File organization completed!
echo.
echo New structure:
echo ==============
dir /s /b | findstr /v organize_files.bat
