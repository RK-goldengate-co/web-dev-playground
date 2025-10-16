@echo off
cd /d "c:\Users\ASUS\OneDrive\Máy tính\web-dev-playground\web-dev-playground"
git add .
git commit -m "Auto-sync: %date% %time%"
git push origin clipboard-history-demo
echo Dong bo hoan thanh!
