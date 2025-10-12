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

        // Validate download URL before proceeding
        const isValidUrl = await validateDownloadUrl(downloadUrl);
        if (!isValidUrl) {
            throw new Error('URL tải không hợp lệ hoặc không thể truy cập');
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

        // Show error notification if enabled
        const settings = await getStoredSettings();
        if (settings.showNotifications) {
            chrome.notifications.create('download-error', {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Lỗi tải video',
                message: error.message || 'Không thể tải video. Vui lòng thử lại.'
            });
        }

        throw error;
    }
}

async function validateDownloadUrl(url) {
    try {
        // Try to fetch the URL headers to validate it
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors' // Allow cross-origin requests
        });

        // If we get here, the URL is accessible (even if no-cors blocks the response)
        return true;

    } catch (error) {
        console.warn('URL validation failed:', error.message);

        // For some APIs, we can't validate with HEAD request due to CORS
        // So we'll assume the URL is valid if it has a proper format
        const validPatterns = [
            /\.(mp4|webm|mp3|m4a)(\?.*)?$/i,
            /\/download\//i,
            /\/get\//i,
            /y2mate\.com/i,
            /savefrom\.net/i,
            /cobalt\.tools/i,
            /y2mate\.nu/i,
            /9convert\.com/i,
            /cdn\d*\.y2mate\.nu/i
        ];

        return validPatterns.some(pattern => pattern.test(url));
    }
}

async function getStoredSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], function(result) {
            resolve(result.settings || {});
        });
    });
}

// API endpoints for video download
const DOWNLOAD_APIS = {
    Y2MATE: 'https://api.y2mate.com/v2/analyze',
    SAVEFROM: 'https://api.savefrom.net/info',
    COBALT: 'https://cobalt.tools/api/json',
    Y2MATE_ALT: 'https://www.y2mate.nu/wp-json/aio-dl/video-data/',
    CONVERTER: 'https://9convert.com/api/ajaxSearch'
};

async function getDownloadUrl(videoId, format, quality) {
    try {
        console.log(`Getting download URL for video ${videoId} in ${format} format at ${quality} quality`);

        // Try multiple APIs for better reliability
        const downloadUrl = await tryMultipleAPIs(videoId, format, quality);

        if (downloadUrl) {
            console.log('Successfully got download URL:', downloadUrl);
            return downloadUrl;
        } else {
            throw new Error('Không thể lấy URL tải từ bất kỳ API nào');
        }

    } catch (error) {
        console.error('Error getting download URL:', error);
        throw error;
    }
}

async function tryMultipleAPIs(videoId, format, quality) {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Try APIs in order of preference
    const apis = [
        { name: 'Y2Mate Alternative', fn: getY2MateAlternativeUrl },
        { name: '9Convert', fn: get9ConvertUrl },
        { name: 'Y2Mate', fn: getY2MateUrl },
        { name: 'SaveFrom', fn: getSaveFromUrl },
        { name: 'Cobalt', fn: getCobaltUrl }
    ];

    for (const api of apis) {
        try {
            console.log(`Trying ${api.name} API...`);
            const url = await api.fn(youtubeUrl, format, quality);
            if (url) {
                console.log(`✅ ${api.name} API successful`);
                return url;
            }
        } catch (error) {
            console.log(`❌ ${api.name} API failed:`, error.message);
            continue;
        }
    }

    return null;
}

async function getY2MateAlternativeUrl(youtubeUrl, format, quality) {
    try {
        const videoId = extractVideoId(youtubeUrl);
        const response = await fetch(`${DOWNLOAD_APIS.Y2MATE_ALT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'url': youtubeUrl,
                'video_id': videoId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data && data.medias && data.medias.length > 0) {
            // Find appropriate format and quality
            const formatMap = {
                'mp4': ['mp4', 'video'],
                'webm': ['webm', 'video'],
                'mp3': ['mp3', 'audio'],
                'm4a': ['m4a', 'audio']
            };

            const qualityMap = {
                '720': ['720p', 'hd'],
                '480': ['480p', 'sd'],
                '360': ['360p'],
                '240': ['240p'],
                '144': ['144p'],
                '128': ['128kbps', 'audio']
            };

            for (const media of data.medias) {
                const formatMatch = formatMap[format] && formatMap[format].some(f => media.extension?.includes(f) || media.type?.includes(f));
                const qualityMatch = qualityMap[quality] && qualityMap[quality].some(q => media.quality?.includes(q));

                if (formatMatch && qualityMatch && media.url) {
                    return media.url;
                }
            }

            // Fallback to first available media
            const firstMedia = data.medias[0];
            if (firstMedia && firstMedia.url) {
                return firstMedia.url;
            }
        }

        throw new Error('Không tìm thấy media phù hợp');

    } catch (error) {
        throw new Error(`Y2Mate Alternative API error: ${error.message}`);
    }
}

async function get9ConvertUrl(youtubeUrl, format, quality) {
    try {
        const response = await fetch(DOWNLOAD_APIS.CONVERTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'vid': youtubeUrl,
                'k_query': youtubeUrl,
                'k_page': 'home',
                'hl': 'en',
                'list': 'search'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data && data.result && data.result.length > 0) {
            // Find appropriate format
            const formatMap = {
                'mp4': /mp4/i,
                'webm': /webm/i,
                'mp3': /mp3/i,
                'm4a': /m4a/i
            };

            for (const result of data.result) {
                if (result && result.dlink && formatMap[format] && formatMap[format].test(result.title || '')) {
                    return result.dlink;
                }
            }

            // Fallback to first result
            const firstResult = data.result[0];
            if (firstResult && firstResult.dlink) {
                return firstResult.dlink;
            }
        }

        throw new Error('Không tìm thấy kết quả tải');

    } catch (error) {
        throw new Error(`9Convert API error: ${error.message}`);
    }
}

async function getY2MateUrl(youtubeUrl, format, quality) {
    try {
        // Step 1: Analyze video
        const analyzeResponse = await fetch(DOWNLOAD_APIS.Y2MATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'url': youtubeUrl,
                'q_auto': '0',
                'ajax': '1'
            })
        });

        if (!analyzeResponse.ok) {
            throw new Error(`HTTP ${analyzeResponse.status}`);
        }

        const analyzeData = await analyzeResponse.json();

        if (!analyzeData || !analyzeData.success) {
            throw new Error('Không thể phân tích video');
        }

        // Step 2: Get download link
        const formatMap = {
            'mp4': 'mp4',
            'webm': 'webm',
            'mp3': 'mp3',
            'm4a': 'm4a'
        };

        const qualityMap = {
            '720': '720',
            '480': '480',
            '360': '360',
            '240': '240',
            '144': '144',
            '128': '128'
        };

        const formatCode = formatMap[format] || 'mp4';
        const qualityCode = qualityMap[quality] || '480';

        // Find appropriate video format
        let selectedLink = null;
        if (analyzeData.links && analyzeData.links[formatCode]) {
            const formats = analyzeData.links[formatCode];
            // Try to find exact quality, fallback to available quality
            selectedLink = formats[qualityCode] || formats[Object.keys(formats)[0]];
        }

        if (selectedLink && selectedLink.url) {
            return selectedLink.url;
        }

        throw new Error('Không tìm thấy định dạng phù hợp');

    } catch (error) {
        throw new Error(`Y2Mate API error: ${error.message}`);
    }
}

async function getSaveFromUrl(youtubeUrl, format, quality) {
    try {
        const response = await fetch(`${DOWNLOAD_APIS.SAVEFROM}?${new URLSearchParams({
            url: youtubeUrl
        })}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.url || !Array.isArray(data.url)) {
            throw new Error('Không thể lấy thông tin tải');
        }

        // Find appropriate format
        const formatMap = {
            'mp4': /mp4/i,
            'webm': /webm/i,
            'mp3': /mp3/i,
            'm4a': /m4a/i
        };

        const qualityMap = {
            '720': /720p?/i,
            '480': /480p?/i,
            '360': /360p?/i,
            '240': /240p?/i,
            '144': /144p?/i,
            '128': /audio/i
        };

        for (const downloadInfo of data.url) {
            if (downloadInfo && downloadInfo.url) {
                const formatMatch = formatMap[format] && downloadInfo.type && formatMap[format].test(downloadInfo.type);
                const qualityMatch = qualityMap[quality] && downloadInfo.quality && qualityMap[quality].test(downloadInfo.quality);

                if (formatMatch && qualityMatch) {
                    return downloadInfo.url;
                }
            }
        }

        throw new Error('Không tìm thấy định dạng phù hợp');

    } catch (error) {
        throw new Error(`SaveFrom API error: ${error.message}`);
    }
}

async function getCobaltUrl(youtubeUrl, format, quality) {
    try {
        const response = await fetch(DOWNLOAD_APIS.ALTERNATIVE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: youtubeUrl,
                aFormat: format,
                vQuality: quality
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.url) {
            return data.url;
        }

        throw new Error('Không thể lấy URL tải');

    } catch (error) {
        throw new Error(`Cobalt API error: ${error.message}`);
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
