// Interactive JavaScript Game - Snake Game
// Modern implementation with ES6+ features

class SnakeGame {
    constructor(canvasId = 'snakeCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;

        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        this.snake = [
            { x: 10, y: 10 }
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;

        this.init();
    }

    init() {
        this.generateFood();
        this.setupEventListeners();
        this.draw();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.dx === 0) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.dy === 0) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.dx === 0) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.dy === 0) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    if (!this.gameRunning) {
                        this.restart();
                    }
                    break;
            }
        });

        // Mobile controls
        this.setupMobileControls();
    }

    setupMobileControls() {
        const buttons = {
            up: document.getElementById('upBtn'),
            down: document.getElementById('downBtn'),
            left: document.getElementById('leftBtn'),
            right: document.getElementById('rightBtn'),
            pause: document.getElementById('pauseBtn'),
            restart: document.getElementById('restartBtn')
        };

        if (buttons.up) {
            buttons.up.addEventListener('click', () => this.moveUp());
            buttons.down.addEventListener('click', () => this.moveDown());
            buttons.left.addEventListener('click', () => this.moveLeft());
            buttons.right.addEventListener('click', () => this.moveRight());
            buttons.pause.addEventListener('click', () => this.togglePause());
            buttons.restart.addEventListener('click', () => this.restart());
        }
    }

    moveUp() {
        if (this.dy === 0 && this.gameRunning) {
            this.dx = 0;
            this.dy = -1;
        }
    }

    moveDown() {
        if (this.dy === 0 && this.gameRunning) {
            this.dx = 0;
            this.dy = 1;
        }
    }

    moveLeft() {
        if (this.dx === 0 && this.gameRunning) {
            this.dx = -1;
            this.dy = 0;
        }
    }

    moveRight() {
        if (this.dx === 0 && this.gameRunning) {
            this.dx = 1;
            this.dy = 0;
        }
    }

    start() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gameLoop();
        this.showMessage('Game Started!');
    }

    gameLoop() {
        if (!this.gameRunning) return;

        setTimeout(() => {
            this.update();
            this.draw();
            if (this.gameRunning) {
                this.gameLoop();
            }
        }, 200);
    }

    update() {
        if (this.gamePaused) return;

        // Move snake head
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.generateFood();
            document.getElementById('score').textContent = this.score;
        } else {
            this.snake.pop();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = '#4ade80';
        for (let segment of this.snake) {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        }

        // Draw snake head differently
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(
            this.snake[0].x * this.gridSize,
            this.snake[0].y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // Draw food
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // Draw grid lines (optional)
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i <= this.tileCount; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));

        this.food = food;
    }

    gameOver() {
        this.gameRunning = false;
        this.showMessage(`Game Over! Score: ${this.score}`);
        this.saveHighScore();
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;

        if (this.gamePaused) {
            this.showMessage('Game Paused');
        } else {
            this.showMessage('Game Resumed');
        }
    }

    restart() {
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.generateFood();

        document.getElementById('score').textContent = this.score;
        this.draw();
        this.showMessage('Press any arrow key to start!');
    }

    showMessage(message) {
        const messageEl = document.getElementById('gameMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.display = 'block';

            // Hide message after 2 seconds
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 2000);
        }
    }

    saveHighScore() {
        const highScore = localStorage.getItem('snakeHighScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('snakeHighScore', this.score);
            document.getElementById('highScore').textContent = this.score;
        }
    }

    loadHighScore() {
        const highScore = localStorage.getItem('snakeHighScore') || 0;
        document.getElementById('highScore').textContent = highScore;
    }
}

// Chart.js Alternative - Lightweight Chart Library
class SimpleChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            width: 400,
            height: 200,
            padding: 20,
            colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
            ...options
        };

        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
    }

    drawLineChart(data, labels = []) {
        const { ctx, options } = this;
        const { width, height, padding } = options;

        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        if (data.length === 0) return;

        // Draw data lines
        data.forEach((dataset, datasetIndex) => {
            if (dataset.length === 0) return;

            const color = options.colors[datasetIndex % options.colors.length];
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            ctx.beginPath();

            const stepX = plotWidth / (dataset.length - 1);
            const maxValue = Math.max(...dataset);

            dataset.forEach((value, index) => {
                const x = padding + (index * stepX);
                const y = height - padding - ((value / maxValue) * plotHeight);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Draw points
            ctx.fillStyle = color;
            dataset.forEach((value, index) => {
                const x = padding + (index * stepX);
                const y = height - padding - ((value / maxValue) * plotHeight);

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        });

        // Draw labels
        if (labels.length > 0) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';

            labels.forEach((label, index) => {
                const x = padding + (index * (plotWidth / (labels.length - 1)));
                ctx.fillText(label, x, height - padding + 15);
            });
        }
    }

    drawBarChart(data, labels = []) {
        const { ctx, options } = this;
        const { width, height, padding } = options;

        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;

        ctx.clearRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        if (data.length === 0) return;

        const barWidth = plotWidth / data.length * 0.8;
        const maxValue = Math.max(...data);

        data.forEach((value, index) => {
            const x = padding + (index * plotWidth / data.length) + (plotWidth / data.length - barWidth) / 2;
            const barHeight = (value / maxValue) * plotHeight;
            const y = height - padding - barHeight;

            const color = options.colors[index % options.colors.length];

            // Draw bar
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Draw value on top
            ctx.fillStyle = '#1f2937';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 5);
        });

        // Draw labels
        if (labels.length > 0) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';

            labels.forEach((label, index) => {
                const x = padding + (index * plotWidth / labels.length) + (plotWidth / labels.length) / 2;
                ctx.fillText(label, x, height - padding + 15);
            });
        }
    }
}

// Advanced Form Validation
class FormValidator {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        this.rules = new Map();
        this.errors = new Map();

        if (this.form) {
            this.setupEventListeners();
        }
    }

    addRule(fieldName, validator, message) {
        if (!this.rules.has(fieldName)) {
            this.rules.set(fieldName, []);
        }
        this.rules.get(fieldName).push({ validator, message });
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validate()) {
                e.preventDefault();
                this.showErrors();
            }
        });

        // Real-time validation
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field.name);
                this.showFieldError(field.name);
            });

            field.addEventListener('input', () => {
                this.clearFieldError(field.name);
            });
        });
    }

    validate() {
        this.errors.clear();
        let isValid = true;

        for (const [fieldName, rules] of this.rules) {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        }

        return isValid;
    }

    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return true;

        const value = field.value.trim();
        const rules = this.rules.get(fieldName) || [];

        for (const rule of rules) {
            if (!rule.validator(value, field)) {
                this.errors.set(fieldName, rule.message);
                return false;
            }
        }

        this.errors.delete(fieldName);
        return true;
    }

    showErrors() {
        for (const [fieldName, message] of this.errors) {
            this.showFieldError(fieldName, message);
        }
    }

    showFieldError(fieldName, message) {
        this.clearFieldError(fieldName);

        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message || this.errors.get(fieldName);

        field.parentNode.appendChild(errorDiv);
        field.classList.add('error');
    }

    clearFieldError(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }

        field.classList.remove('error');
    }

    // Built-in validators
    static validators = {
        required: (value) => value.length > 0,
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (min) => (value) => value.length >= min,
        maxLength: (max) => (value) => value.length <= max,
        numeric: (value) => !isNaN(value),
        phone: (value) => /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/.test(value.replace(/\s/g, '')),
        url: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        match: (fieldName) => (value, field) => {
            const otherField = field.form.querySelector(`[name="${fieldName}"]`);
            return otherField && value === otherField.value;
        }
    };
}

// Drag and Drop File Upload
class FileUploader {
    constructor(dropZoneId, options = {}) {
        this.dropZone = document.getElementById(dropZoneId);
        this.options = {
            maxFiles: 5,
            maxSize: 5 * 1024 * 1024, // 5MB
            acceptedTypes: ['image/*', 'application/pdf'],
            onFileSelect: () => {},
            onFileUpload: () => {},
            ...options
        };

        this.files = [];
        this.init();
    }

    init() {
        if (!this.dropZone) return;

        this.setupEventListeners();
        this.updateDropZone();
    }

    setupEventListeners() {
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        this.dropZone.addEventListener('dragenter', () => this.highlight());
        this.dropZone.addEventListener('dragover', () => this.highlight());
        this.dropZone.addEventListener('dragleave', () => this.unhighlight());
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Click to select
        this.dropZone.addEventListener('click', () => this.openFileDialog());

        // File input
        const fileInput = this.dropZone.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight() {
        this.dropZone.classList.add('drag-over');
    }

    unhighlight() {
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
        this.unhighlight();
    }

    handleFiles(files) {
        if (files.length === 0) return;

        for (const file of files) {
            if (this.validateFile(file)) {
                this.files.push(file);
            }
        }

        this.updateFileList();
        this.options.onFileSelect(this.files);
    }

    validateFile(file) {
        // Check file count
        if (this.files.length >= this.options.maxFiles) {
            this.showError(`Maximum ${this.options.maxFiles} files allowed`);
            return false;
        }

        // Check file size
        if (file.size > this.options.maxSize) {
            this.showError(`File size must be less than ${this.formatFileSize(this.options.maxSize)}`);
            return false;
        }

        // Check file type
        const isValidType = this.options.acceptedTypes.some(type => {
            if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            }
            return file.type === type;
        });

        if (!isValidType) {
            this.showError(`File type not supported. Allowed types: ${this.options.acceptedTypes.join(', ')}`);
            return false;
        }

        return true;
    }

    openFileDialog() {
        const fileInput = this.dropZone.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.click();
        }
    }

    updateFileList() {
        let fileList = this.dropZone.querySelector('.file-list');
        if (!fileList) {
            fileList = document.createElement('div');
            fileList.className = 'file-list';
            this.dropZone.appendChild(fileList);
        }

        fileList.innerHTML = '';

        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const fileIcon = this.getFileIcon(file.type);
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            `;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => this.removeFile(index);

            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);

            fileList.appendChild(fileItem);
        });

        this.updateDropZone();
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
    }

    getFileIcon(mimeType) {
        const icon = document.createElement('div');
        icon.className = 'file-icon';

        if (mimeType.startsWith('image/')) {
            icon.innerHTML = '🖼️';
        } else if (mimeType === 'application/pdf') {
            icon.innerHTML = '📄';
        } else if (mimeType.startsWith('text/')) {
            icon.innerHTML = '📝';
        } else {
            icon.innerHTML = '📁';
        }

        return icon;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateDropZone() {
        const isEmpty = this.files.length === 0;
        this.dropZone.classList.toggle('empty', isEmpty);

        if (isEmpty) {
            this.dropZone.innerHTML = `
                <div class="drop-zone-content">
                    <div class="drop-icon">📁</div>
                    <div class="drop-text">Drop files here or click to select</div>
                    <div class="drop-hint">Max ${this.options.maxFiles} files, ${this.formatFileSize(this.options.maxSize)} each</div>
                    <input type="file" multiple style="display: none;">
                </div>
            `;
        }
    }

    showError(message) {
        // You can customize this to show errors in your UI
        console.error(message);
        alert(message);
    }

    async uploadFiles(url, additionalData = {}) {
        if (this.files.length === 0) {
            throw new Error('No files to upload');
        }

        const formData = new FormData();

        this.files.forEach((file, index) => {
            formData.append(`file_${index}`, file);
        });

        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            this.options.onFileUpload(result);
            return result;
        } catch (error) {
            throw new Error(`Upload error: ${error.message}`);
        }
    }
}

// Virtual Keyboard for Mobile
class VirtualKeyboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.input = null;
        this.isVisible = false;
        this.layout = 'qwerty';

        this.createKeyboard();
    }

    createKeyboard() {
        const keyboardHTML = `
            <div class="virtual-keyboard" id="virtualKeyboard">
                <div class="keyboard-row">
                    <button class="key" data-key="1">1</button>
                    <button class="key" data-key="2">2</button>
                    <button class="key" data-key="3">3</button>
                    <button class="key" data-key="4">4</button>
                    <button class="key" data-key="5">5</button>
                    <button class="key" data-key="6">6</button>
                    <button class="key" data-key="7">7</button>
                    <button class="key" data-key="8">8</button>
                    <button class="key" data-key="9">9</button>
                    <button class="key" data-key="0">0</button>
                    <button class="key backspace">⌫</button>
                </div>
                <div class="keyboard-row">
                    <button class="key" data-key="q">q</button>
                    <button class="key" data-key="w">w</button>
                    <button class="key" data-key="e">e</button>
                    <button class="key" data-key="r">r</button>
                    <button class="key" data-key="t">t</button>
                    <button class="key" data-key="y">y</button>
                    <button class="key" data-key="u">u</button>
                    <button class="key" data-key="i">i</button>
                    <button class="key" data-key="o">o</button>
                    <button class="key" data-key="p">p</button>
                </div>
                <div class="keyboard-row">
                    <button class="key" data-key="a">a</button>
                    <button class="key" data-key="s">s</button>
                    <button class="key" data-key="d">d</button>
                    <button class="key" data-key="f">f</button>
                    <button class="key" data-key="g">g</button>
                    <button class="key" data-key="h">h</button>
                    <button class="key" data-key="j">j</button>
                    <button class="key" data-key="k">k</button>
                    <button class="key" data-key="l">l</button>
                    <button class="key enter">⏎</button>
                </div>
                <div class="keyboard-row">
                    <button class="key shift">⇧</button>
                    <button class="key" data-key="z">z</button>
                    <button class="key" data-key="x">x</button>
                    <button class="key" data-key="c">c</button>
                    <button class="key" data-key="v">v</button>
                    <button class="key" data-key="b">b</button>
                    <button class="key" data-key="n">n</button>
                    <button class="key" data-key="m">m</button>
                    <button class="key" data-key=",">,</button>
                    <button class="key" data-key=".">.</button>
                    <button class="key shift">⇧</button>
                </div>
                <div class="keyboard-row">
                    <button class="key space" data-key=" " style="flex: 1;">Space</button>
                </div>
            </div>
        `;

        this.container.innerHTML = keyboardHTML;
        this.setupKeyboardEvents();
    }

    setupKeyboardEvents() {
        const keys = this.container.querySelectorAll('.key');

        keys.forEach(key => {
            key.addEventListener('click', (e) => {
                e.preventDefault();
                const keyValue = key.dataset.key || key.textContent;

                if (this.input) {
                    switch (keyValue) {
                        case '⌫':
                            this.input.value = this.input.value.slice(0, -1);
                            break;
                        case '⏎':
                            this.input.form?.dispatchEvent(new Event('submit'));
                            break;
                        case 'Space':
                            this.input.value += ' ';
                            break;
                        default:
                            this.input.value += keyValue;
                            break;
                    }

                    this.input.dispatchEvent(new Event('input'));
                    this.input.focus();
                }
            });
        });
    }

    show(input) {
        this.input = input;
        this.container.style.display = 'block';
        this.isVisible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
        this.input = null;
    }

    toggle(input) {
        if (this.isVisible && this.input === input) {
            this.hide();
        } else {
            this.show(input);
        }
    }
}

// Export classes for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SnakeGame,
        SimpleChart,
        FormValidator,
        FileUploader,
        VirtualKeyboard
    };
} else if (typeof window !== 'undefined') {
    window.SnakeGame = SnakeGame;
    window.SimpleChart = SimpleChart;
    window.FormValidator = FormValidator;
    window.FileUploader = FileUploader;
    window.VirtualKeyboard = VirtualKeyboard;
}
