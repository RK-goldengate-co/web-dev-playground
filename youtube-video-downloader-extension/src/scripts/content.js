// Content Script for YouTube Video Downloader

let currentVideoUrl = null;

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getCurrentVideoUrl') {
        sendResponse({ url: currentVideoUrl });
        return true;
    }

    if (request.action === 'setUrl') {
        // This would be handled by popup script
        sendResponse({ success: true });
        return true;
    }
});

// Monitor page for YouTube video URLs
function checkForYouTubeVideo() {
    if (window.location.hostname === 'www.youtube.com' || window.location.hostname === 'youtube.com') {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');

        if (videoId) {
            currentVideoUrl = window.location.href;

            // Add download button to YouTube interface if not exists
            addDownloadButton();
        }
    }
}

// Add download button to YouTube video page
function addDownloadButton() {
    // Check if button already exists
    if (document.querySelector('.youtube-downloader-btn')) {
        return;
    }

    // Find the video actions area
    const videoActions = document.querySelector('#top-row #actions');
    if (!videoActions) {
        return;
    }

    // Create download button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'youtube-downloader-btn';
    downloadButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 9H15V5C19 5 21 7 21 11V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V11C3 7 5 5 9 5V9H5V19H19V9Z" fill="currentColor"/>
            <path d="M12 13L8 17H16L12 13Z" fill="currentColor"/>
        </svg>
        <span>Tải xuống</span>
    `;

    // Style the button to match YouTube's design
    downloadButton.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #ff0000;
        color: white;
        border: none;
        border-radius: 18px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        margin-left: 8px;
        transition: background-color 0.2s;
    `;

    // Add hover effect
    downloadButton.addEventListener('mouseenter', () => {
        downloadButton.style.background = '#cc0000';
    });

    downloadButton.addEventListener('mouseleave', () => {
        downloadButton.style.background = '#ff0000';
    });

    // Handle click
    downloadButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Send current video URL to background script
        chrome.runtime.sendMessage({
            action: 'downloadFromYouTubePage',
            url: currentVideoUrl
        }, function(response) {
            if (response && response.success) {
                // Show success feedback
                showNotification('Đã bắt đầu tải video!', 'success');
            } else {
                showNotification('Không thể tải video. Vui lòng thử lại.', 'error');
            }
        });
    });

    // Insert button after like/dislike buttons
    const likeButton = videoActions.querySelector('#top-row #actions #top-row #actions ytd-video-owner-renderer');
    if (likeButton) {
        videoActions.insertBefore(downloadButton, likeButton.nextSibling);
    } else {
        videoActions.appendChild(downloadButton);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.youtube-downloader-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `youtube-downloader-notification ${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#d32f2f' : '#1976d2'};
        color: white;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
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

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForYouTubeVideo);
} else {
    checkForYouTubeVideo();
}

// Monitor URL changes (for SPA navigation)
let lastUrl = window.location.href;
new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(checkForYouTubeVideo, 1000); // Wait for page to load
    }
}).observe(document, { subtree: true, childList: true });

// Monitor for video player changes
new MutationObserver(() => {
    if (currentVideoUrl && window.location.href.includes('youtube.com/watch')) {
        addDownloadButton();
    }
}).observe(document.body, { subtree: true, childList: true });
