// Settings page functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const saveSettingsBtn = document.getElementById('saveSettings');
    const resetSettingsBtn = document.getElementById('resetSettings');
    const exportSettingsBtn = document.getElementById('exportSettings');
    const importSettingsBtn = document.getElementById('importSettings');
    const browseFolderBtn = document.getElementById('browseFolder');

    // Form elements
    const defaultFormat = document.getElementById('defaultFormat');
    const defaultQuality = document.getElementById('defaultQuality');
    const autoDownload = document.getElementById('autoDownload');
    const downloadPath = document.getElementById('downloadPath');
    const createSubfolders = document.getElementById('createSubfolders');
    const showNotifications = document.getElementById('showNotifications');
    const playSound = document.getElementById('playSound');
    const downloadSubtitles = document.getElementById('downloadSubtitles');
    const downloadThumbnail = document.getElementById('downloadThumbnail');
    const theme = document.getElementById('theme');
    const compactMode = document.getElementById('compactMode');
    const showPreview = document.getElementById('showPreview');
    const timeout = document.getElementById('timeout');
    const useProxy = document.getElementById('useProxy');
    const retryOnFailure = document.getElementById('retryOnFailure');

    // Default settings
    const defaultSettings = {
        defaultFormat: 'mp4',
        defaultQuality: '720',
        autoDownload: false,
        downloadPath: 'youtube-downloads',
        createSubfolders: false,
        showNotifications: true,
        playSound: false,
        downloadSubtitles: false,
        downloadThumbnail: false,
        theme: 'gradient',
        compactMode: false,
        showPreview: true,
        timeout: 60,
        useProxy: false,
        retryOnFailure: true
    };

    // Initialize settings page
    initializeSettings();

    function initializeSettings() {
        // Load current settings
        loadSettings();

        // Set up event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        saveSettingsBtn.addEventListener('click', saveSettings);
        resetSettingsBtn.addEventListener('click', resetToDefaults);
        exportSettingsBtn.addEventListener('click', exportSettings);
        importSettingsBtn.addEventListener('click', importSettings);
        browseFolderBtn.addEventListener('click', browseForFolder);

        // Live preview for theme changes
        theme.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }

    function loadSettings() {
        chrome.storage.local.get(['settings'], function(result) {
            const settings = result.settings || {};

            // Apply settings to form
            defaultFormat.value = settings.defaultFormat || defaultSettings.defaultFormat;
            defaultQuality.value = settings.defaultQuality || defaultSettings.defaultQuality;
            autoDownload.checked = settings.autoDownload || defaultSettings.autoDownload;
            downloadPath.value = settings.downloadPath || defaultSettings.downloadPath;
            createSubfolders.checked = settings.createSubfolders || defaultSettings.createSubfolders;
            showNotifications.checked = settings.showNotifications !== false; // Default true
            playSound.checked = settings.playSound || defaultSettings.playSound;
            downloadSubtitles.checked = settings.downloadSubtitles || defaultSettings.downloadSubtitles;
            downloadThumbnail.checked = settings.downloadThumbnail || defaultSettings.downloadThumbnail;
            theme.value = settings.theme || defaultSettings.theme;
            compactMode.checked = settings.compactMode || defaultSettings.compactMode;
            showPreview.checked = settings.showPreview !== false; // Default true
            timeout.value = settings.timeout || defaultSettings.timeout;
            useProxy.checked = settings.useProxy || defaultSettings.useProxy;
            retryOnFailure.checked = settings.retryOnFailure !== false; // Default true

            // Apply current theme
            applyTheme(theme.value);
        });
    }

    function saveSettings() {
        const settings = {
            defaultFormat: defaultFormat.value,
            defaultQuality: defaultQuality.value,
            autoDownload: autoDownload.checked,
            downloadPath: downloadPath.value.trim(),
            createSubfolders: createSubfolders.checked,
            showNotifications: showNotifications.checked,
            playSound: playSound.checked,
            downloadSubtitles: downloadSubtitles.checked,
            downloadThumbnail: downloadThumbnail.checked,
            theme: theme.value,
            compactMode: compactMode.checked,
            showPreview: showPreview.checked,
            timeout: parseInt(timeout.value) || defaultSettings.timeout,
            useProxy: useProxy.checked,
            retryOnFailure: retryOnFailure.checked
        };

        // Save to storage
        chrome.storage.local.set({ settings: settings }, function() {
            // Show success message
            showNotification('Đã lưu cài đặt thành công!', 'success');

            // Apply theme immediately
            applyTheme(settings.theme);

            // Notify other parts of the extension about settings change
            chrome.runtime.sendMessage({
                action: 'settingsUpdated',
                settings: settings
            });
        });
    }

    function resetToDefaults() {
        if (confirm('Bạn có chắc chắn muốn khôi phục tất cả cài đặt về mặc định?')) {
            // Reset form to defaults
            defaultFormat.value = defaultSettings.defaultFormat;
            defaultQuality.value = defaultSettings.defaultQuality;
            autoDownload.checked = defaultSettings.autoDownload;
            downloadPath.value = defaultSettings.downloadPath;
            createSubfolders.checked = defaultSettings.createSubfolders;
            showNotifications.checked = defaultSettings.showNotifications;
            playSound.checked = defaultSettings.playSound;
            downloadSubtitles.checked = defaultSettings.downloadSubtitles;
            downloadThumbnail.checked = defaultSettings.downloadThumbnail;
            theme.value = defaultSettings.theme;
            compactMode.checked = defaultSettings.compactMode;
            showPreview.checked = defaultSettings.showPreview;
            timeout.value = defaultSettings.timeout;
            useProxy.checked = defaultSettings.useProxy;
            retryOnFailure.checked = defaultSettings.retryOnFailure;

            // Apply default theme
            applyTheme(defaultSettings.theme);

            // Save defaults
            chrome.storage.local.set({ settings: defaultSettings }, function() {
                showNotification('Đã khôi phục cài đặt mặc định!', 'success');
            });
        }
    }

    function exportSettings() {
        chrome.storage.local.get(['settings'], function(result) {
            const settings = result.settings || defaultSettings;
            const dataStr = JSON.stringify(settings, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = `youtube-downloader-settings-${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            showNotification('Đã xuất cài đặt thành công!', 'success');
        });
    }

    function importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const settings = JSON.parse(e.target.result);

                        // Validate settings structure
                        if (settings && typeof settings === 'object') {
                            // Apply imported settings to form
                            if (settings.defaultFormat) defaultFormat.value = settings.defaultFormat;
                            if (settings.defaultQuality) defaultQuality.value = settings.defaultQuality;
                            if (typeof settings.autoDownload === 'boolean') autoDownload.checked = settings.autoDownload;
                            if (settings.downloadPath) downloadPath.value = settings.downloadPath;
                            if (typeof settings.createSubfolders === 'boolean') createSubfolders.checked = settings.createSubfolders;
                            if (typeof settings.showNotifications === 'boolean') showNotifications.checked = settings.showNotifications;
                            if (typeof settings.playSound === 'boolean') playSound.checked = settings.playSound;
                            if (typeof settings.downloadSubtitles === 'boolean') downloadSubtitles.checked = settings.downloadSubtitles;
                            if (typeof settings.downloadThumbnail === 'boolean') downloadThumbnail.checked = settings.downloadThumbnail;
                            if (settings.theme) theme.value = settings.theme;
                            if (typeof settings.compactMode === 'boolean') compactMode.checked = settings.compactMode;
                            if (typeof settings.showPreview === 'boolean') showPreview.checked = settings.showPreview;
                            if (settings.timeout) timeout.value = settings.timeout;
                            if (typeof settings.useProxy === 'boolean') useProxy.checked = settings.useProxy;
                            if (typeof settings.retryOnFailure === 'boolean') retryOnFailure.checked = settings.retryOnFailure;

                            showNotification('Đã nhập cài đặt thành công! Nhấn "Lưu cài đặt" để áp dụng.', 'success');
                        } else {
                            showNotification('File cài đặt không hợp lệ!', 'error');
                        }
                    } catch (error) {
                        showNotification('Không thể đọc file cài đặt!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    async function browseForFolder() {
        try {
            // Note: Chrome extensions don't have direct folder picker API
            // This is a placeholder for future implementation
            showNotification('Chọn thư mục sẽ được hỗ trợ trong phiên bản tiếp theo', 'info');
        } catch (error) {
            showNotification('Không thể chọn thư mục', 'error');
        }
    }

    function applyTheme(themeValue) {
        const body = document.body;

        // Remove existing theme classes
        body.classList.remove('theme-gradient', 'theme-dark', 'theme-light', 'theme-youtube');

        // Apply new theme
        switch (themeValue) {
            case 'dark':
                body.classList.add('theme-dark');
                break;
            case 'light':
                body.classList.add('theme-light');
                break;
            case 'youtube':
                body.classList.add('theme-youtube');
                break;
            default:
                body.classList.add('theme-gradient');
        }
    }

    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.settings-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${getNotificationColor(type)};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInFromRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Add animation keyframes if not exists
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInFromRight 0.3s ease-out reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    function getNotificationColor(type) {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196F3';
        }
    }

    // Handle settings import/export
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save settings
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
    });

    console.log('YouTube Video Downloader Settings page loaded');
});
