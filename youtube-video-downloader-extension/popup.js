document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const getVideoBtn = document.getElementById('getVideoBtn');
    const pasteFromTabBtn = document.getElementById('pasteFromTabBtn');
    const loadingDiv = document.getElementById('loading');
    const videoInfoDiv = document.getElementById('videoInfo');
    const downloadOptionsDiv = document.getElementById('downloadOptions');
    const downloadProgressDiv = document.getElementById('downloadProgress');
    const errorMessageDiv = document.getElementById('errorMessage');
    const cancelDownloadBtn = document.getElementById('cancelDownload');

    // Video info elements
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const channelName = document.getElementById('channelName');
    const viewCount = document.getElementById('viewCount');
    const publishDate = document.getElementById('publishDate');
    const videoDuration = document.getElementById('videoDuration');

    // Format buttons
    const formatButtons = document.querySelectorAll('.format-btn');

    // State
    let currentVideoData = null;
    let currentDownloadId = null;

    // Initialize
    initializeEventListeners();
    loadFromStorage();

    function initializeEventListeners() {
        // Get video button
        getVideoBtn.addEventListener('click', handleGetVideo);

        // Paste from current tab button
        pasteFromTabBtn.addEventListener('click', pasteFromCurrentTab);

        // Format buttons
        formatButtons.forEach(button => {
            button.addEventListener('click', handleDownload);
        });

        // Cancel download button
        cancelDownloadBtn.addEventListener('click', cancelDownload);

        // Enter key in URL input
        youtubeUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGetVideo();
            }
        });

        // Open settings
        document.getElementById('openSettings').addEventListener('click', function() {
            // Open settings page in a new tab
            chrome.tabs.create({
                url: chrome.runtime.getURL('settings.html')
            });
        });
    }

    function handleGetVideo() {
        const url = youtubeUrlInput.value.trim();

        if (!url) {
            showError('Vui lòng nhập URL video YouTube');
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            showError('URL YouTube không hợp lệ');
            return;
        }

        getVideoInfo(url);
    }

    async function pasteFromCurrentTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];

            if (currentTab.url && isValidYouTubeUrl(currentTab.url)) {
                youtubeUrlInput.value = currentTab.url;
                getVideoInfo(currentTab.url);
            } else {
                showError('Tab hiện tại không phải trang YouTube');
            }
        } catch (error) {
            showError('Không thể lấy URL từ tab hiện tại');
        }
    }

    async function getVideoInfo(url) {
        showLoading();

        try {
            // Send message to background script to get video info
            const response = await sendMessageToBackground({
                action: 'getVideoInfo',
                url: url
            });

            if (response.success) {
                displayVideoInfo(response.data);
                currentVideoData = response.data;
            } else {
                showError(response.error || 'Không thể lấy thông tin video');
            }
        } catch (error) {
            showError('Lỗi kết nối với dịch vụ tải video');
        }
    }

    function displayVideoInfo(videoData) {
        hideLoading();
        hideError();

        // Update video info
        videoThumbnail.src = videoData.thumbnail;
        videoTitle.textContent = videoData.title;
        channelName.textContent = videoData.channel;
        viewCount.textContent = formatNumber(videoData.views);
        publishDate.textContent = formatDate(videoData.publishedAt);
        videoDuration.textContent = formatDuration(videoData.duration);

        // Show video info and download options
        videoInfoDiv.classList.remove('hidden');
        downloadOptionsDiv.classList.remove('hidden');
    }

    async function handleDownload(event) {
        const format = event.target.closest('.format-btn').dataset.format;
        const quality = event.target.closest('.format-btn').dataset.quality;

        if (!currentVideoData) {
            showError('Vui lòng lấy thông tin video trước');
            return;
        }

        try {
            showDownloadProgress();

            const response = await sendMessageToBackground({
                action: 'downloadVideo',
                videoData: currentVideoData,
                format: format,
                quality: quality
            });

            if (response.success) {
                hideDownloadProgress();
                showSuccess('Video đã bắt đầu tải!');
            } else {
                hideDownloadProgress();
                showError(response.error || 'Không thể tải video');
            }
        } catch (error) {
            hideDownloadProgress();
            showError('Lỗi khi tải video');
        }
    }

    function cancelDownload() {
        if (currentDownloadId) {
            chrome.downloads.cancel(currentDownloadId);
            hideDownloadProgress();
            showSuccess('Đã hủy tải video');
        }
    }

    function sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }

    function showLoading() {
        hideError();
        hideDownloadProgress();
        videoInfoDiv.classList.add('hidden');
        downloadOptionsDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
    }

    function hideLoading() {
        loadingDiv.classList.add('hidden');
    }

    function showError(message) {
        hideLoading();
        hideDownloadProgress();
        errorMessageDiv.classList.remove('hidden');
        document.getElementById('errorText').textContent = message;

        // Auto hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    function hideError() {
        errorMessageDiv.classList.add('hidden');
    }

    function showDownloadProgress() {
        hideError();
        downloadProgressDiv.classList.remove('hidden');
    }

    function hideDownloadProgress() {
        downloadProgressDiv.classList.add('hidden');
    }

    function showSuccess(message) {
        // Simple success notification - you could enhance this
        console.log('Success:', message);
    }

    function isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11}).*$/;
        return youtubeRegex.test(url);
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    function formatDuration(duration) {
        // Convert ISO 8601 duration to readable format
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '0:00';

        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    function loadFromStorage() {
        // Load saved settings or history if needed
        chrome.storage.local.get(['settings'], function(result) {
            if (result.settings) {
                // Apply saved settings
                console.log('Loaded settings:', result.settings);
            }
        });
    }

    // Listen for download progress updates
    chrome.downloads.onChanged.addListener(function(downloadDelta) {
        if (downloadDelta.state && downloadDelta.state.current === 'complete') {
            if (currentDownloadId === downloadDelta.id) {
                hideDownloadProgress();
                showSuccess('Video đã tải xong!');
                currentDownloadId = null;
            }
        }
    });
});
