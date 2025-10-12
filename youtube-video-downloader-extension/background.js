// YouTube Video Downloader Background Script

// API endpoints for video information and download
const API_ENDPOINTS = {
    INFO: 'https://noembed.com/embed',
    DOWNLOAD: 'https://api.y2mate.com/v2/analyze',
    FORMATS: 'https://api.y2mate.com/v2/analyze/ajax'
};

// Rate limiting
let requestQueue = [];
let isProcessing = false;

chrome.runtime.onInstalled.addListener(function() {
    console.log('YouTube Video Downloader extension installed');

    // Set default settings
    chrome.storage.local.set({
        settings: {
            defaultFormat: 'mp4',
            defaultQuality: '720',
            downloadPath: 'youtube-downloads'
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getVideoInfo') {
        getVideoInfo(request.url)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }

    if (request.action === 'downloadVideo') {
        downloadVideo(request.videoData, request.format, request.quality)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

async function getVideoInfo(url) {
    try {
        // Extract video ID from URL
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error('Không thể lấy ID video từ URL');
        }

        // Get basic video info from noembed API
        const response = await fetch(`${API_ENDPOINTS.INFO}?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (!data.title) {
            throw new Error('Không thể lấy thông tin video');
        }

        // Parse video info
        const videoInfo = {
            id: videoId,
            title: data.title,
            channel: data.author_name || 'Unknown',
            thumbnail: data.thumbnail_url || '',
            duration: data.duration || 'PT0M0S',
            views: 0, // noembed doesn't provide view count
            publishedAt: data.upload_date || new Date().toISOString()
        };

        return videoInfo;

    } catch (error) {
        console.error('Error getting video info:', error);
        throw error;
    }
}

async function downloadVideo(videoData, format, quality) {
    try {
        // Get current settings
        const settings = await getStoredSettings();

        const downloadUrl = await getDownloadUrl(videoData.id, format, quality);

        if (!downloadUrl) {
            throw new Error('Không thể tạo URL tải');
        }

        // Create filename based on settings
        let filename = sanitizeFilename(videoData.title) + getFileExtension(format);

        // Add subfolder if enabled
        if (settings.createSubfolders && videoData.channel) {
            const subfolder = sanitizeFilename(videoData.channel);
            filename = `${subfolder}/${filename}`;
        }

        // Set download path if specified
        let downloadOptions = {
            url: downloadUrl,
            filename: filename,
            saveAs: false
        };

        if (settings.downloadPath && settings.downloadPath.trim()) {
            // Note: Chrome extensions can't directly set custom download paths
            // This would require additional permissions or user interaction
            console.log('Custom download path specified:', settings.downloadPath);
        }

        // Start download
        const downloadItem = await chrome.downloads.download(downloadOptions);

        // Handle notifications if enabled
        if (settings.showNotifications) {
            chrome.notifications.create('download-started', {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Bắt đầu tải video',
                message: `Đang tải: ${videoData.title.substring(0, 50)}...`
            });
        }

        console.log('Download started:', downloadItem);
        return downloadItem;

    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}

async function getStoredSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], function(result) {
            resolve(result.settings || {});
        });
    });
}

async function getDownloadUrl(videoId, format, quality) {
    try {
        // For this demo, we'll use a simple approach
        // In a real implementation, you'd integrate with a proper video download API

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demo purposes, return a placeholder URL
        // In production, this would be a real download URL from a service like y2mate, savefrom, etc.
        return `https://example.com/download/${videoId}/${format}/${quality}`;

    } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
    }
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 100); // Limit length
}

function getFileExtension(format) {
    const extensions = {
        'mp4': '.mp4',
        'webm': '.webm',
        'mp3': '.mp3',
        'm4a': '.m4a'
    };
    return extensions[format] || '.mp4';
}

// Handle download progress and completion
chrome.downloads.onChanged.addListener(async function(downloadDelta) {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
        console.log('Download completed:', downloadDelta.id);

        // Get settings to check notification preferences
        const settings = await getStoredSettings();

        if (settings.showNotifications) {
            chrome.notifications.create('download-completed', {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Tải video hoàn tất',
                message: 'Video đã được tải xuống thành công!'
            });

            // Play sound if enabled
            if (settings.playSound) {
                // Play notification sound (you could customize this)
                try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCWM1Ojw7uE='); // Placeholder beep sound
                    audio.volume = 0.3;
                    audio.play().catch(e => console.log('Could not play sound:', e));
                } catch (e) {
                    console.log('Audio playback not supported');
                }
            }
        }
    }

    if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
        console.log('Download interrupted:', downloadDelta.id);

        // Show error notification if enabled
        const settings = await getStoredSettings();
        if (settings.showNotifications) {
            chrome.notifications.create('download-failed', {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Tải video thất bại',
                message: 'Không thể tải video. Vui lòng thử lại.'
            });
        }
    }
});

// Context menu integration
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        title: 'Tải video YouTube',
        contexts: ['link'],
        documentUrlPatterns: ['*://*.youtube.com/*'],
        onclick: function(info, tab) {
            if (info.linkUrl && info.linkUrl.includes('youtube.com/watch')) {
                // Send URL to popup
                chrome.tabs.sendMessage(tab.id, {
                    action: 'setUrl',
                    url: info.linkUrl
                });
            }
        }
    });
});

// Content script communication
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'setUrl' && sender.tab) {
        // Notify popup to set the URL
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'setUrl',
                    url: request.url
                });
            }
        });
    }

    if (request.action === 'settingsUpdated') {
        // Settings have been updated, store them for use in downloads
        console.log('Settings updated:', request.settings);
        // The settings are already saved in chrome.storage.local by settings.js
        // We can use them in future download requests
        sendResponse({ success: true });
        return true;
    }
});
