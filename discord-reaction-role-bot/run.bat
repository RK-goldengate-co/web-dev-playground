@echo off
echo 🚀 Starting Discord Reaction Role Bot...
echo.

REM Check if virtual environment exists
if not exist venv (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist .env (
    echo ⚠️  Warning: .env file not found!
    echo 📝 Please copy .env.example to .env and configure your bot settings
    echo.
    echo Press any key to continue...
    pause >nul
)

REM Run the bot
echo 🎮 Starting bot...
python bot.py

REM Deactivate virtual environment when done
call venv\Scripts\deactivate.bat

echo 👋 Bot stopped
pause
