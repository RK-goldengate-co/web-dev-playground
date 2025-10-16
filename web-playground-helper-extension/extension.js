const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Web Playground Helper đang hoạt động!');

    let disposable1 = vscode.commands.registerCommand('web-playground-helper.createHtmlTemplate', async (uri) => {
        const folderPath = uri ? uri.fsPath : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!folderPath) {
            vscode.window.showErrorMessage('Không tìm thấy thư mục để tạo file!');
            return;
        }

        const fileName = await vscode.window.showInputBox({
            prompt: 'Nhập tên file HTML (không cần .html)',
            placeHolder: 'ví dụ: index'
        });

        if (!fileName) return;

        const filePath = `${folderPath}/${fileName}.html`;
        const templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trang Web Mẫu</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Chào mừng đến với Web Playground Helper!</h1>
    <p>Đây là template HTML cơ bản để bạn thử nghiệm.</p>
    <script>
        console.log('JavaScript đang chạy!');
    </script>
</body>
</html>`;

        try {
            const fs = require('fs');
            fs.writeFileSync(filePath, templateContent);
            vscode.window.showInformationMessage(`Đã tạo file: ${fileName}.html`);
            vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc));
        } catch (error) {
            vscode.window.showErrorMessage(`Lỗi khi tạo file: ${error.message}`);
        }
    });

    let disposable2 = vscode.commands.registerCommand('web-playground-helper.createCssTemplate', async (uri) => {
        const folderPath = uri ? uri.fsPath : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!folderPath) {
            vscode.window.showErrorMessage('Không tìm thấy thư mục để tạo file!');
            return;
        }

        const fileName = await vscode.window.showInputBox({
            prompt: 'Nhập tên file CSS (không cần .css)',
            placeHolder: 'ví dụ: styles'
        });

        if (!fileName) return;

        const filePath = `${folderPath}/${fileName}.css`;
        const templateContent = `/* CSS Cơ Bản */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f0f0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.button:hover {
    background-color: #0056b3;
}

/* Thêm các style tùy chỉnh của bạn ở đây */`;

        try {
            const fs = require('fs');
            fs.writeFileSync(filePath, templateContent);
            vscode.window.showInformationMessage(`Đã tạo file: ${fileName}.css`);
            vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc));
        } catch (error) {
            vscode.window.showErrorMessage(`Lỗi khi tạo file: ${error.message}`);
        }
    });

    let disposable3 = vscode.commands.registerCommand('web-playground-helper.createJsTemplate', async (uri) => {
        const folderPath = uri ? uri.fsPath : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!folderPath) {
            vscode.window.showErrorMessage('Không tìm thấy thư mục để tạo file!');
            return;
        }

        const fileName = await vscode.window.showInputBox({
            prompt: 'Nhập tên file JS (không cần .js)',
            placeHolder: 'ví dụ: script'
        });

        if (!fileName) return;

        const filePath = `${folderPath}/${fileName}.js`;
        const templateContent = `// JavaScript Cơ Bản
console.log('Script đang chạy!');

// Ví dụ: Thay đổi nội dung phần tử HTML
function changeText() {
    const element = document.getElementById('demo');
    if (element) {
        element.innerHTML = 'Nội dung đã được thay đổi!';
    }
}

// Ví dụ: Sự kiện click
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('.button');
    if (button) {
        button.addEventListener('click', function() {
            alert('Nút đã được nhấn!');
        });
    }
});

// Thêm logic tùy chỉnh của bạn ở đây`;

        try {
            const fs = require('fs');
            fs.writeFileSync(filePath, templateContent);
            vscode.window.showInformationMessage(`Đã tạo file: ${fileName}.js`);
            vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc));
        } catch (error) {
            vscode.window.showErrorMessage(`Lỗi khi tạo file: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable1, disposable2, disposable3);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
