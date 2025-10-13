document.addEventListener('DOMContentLoaded', function() {
    const timerDisplay = document.getElementById('timerDisplay');
    const timeInput = document.getElementById('timeInput');
    const increaseBtn = document.getElementById('increaseSize');
    const decreaseBtn = document.getElementById('decreaseSize');

    let countdownInterval;
    let totalSeconds = 120; // Mặc định 2 phút

    // Logic resize popup
    const step = 20; // Bước tăng/giảm kích thước (px)
    increaseBtn.addEventListener('click', function() {
        const body = document.body;
        const currentWidth = parseInt(getComputedStyle(body).width);
        const currentHeight = parseInt(getComputedStyle(body).height);
        body.style.width = (currentWidth + step) + 'px';
        body.style.height = (currentHeight + step) + 'px';
    });

    decreaseBtn.addEventListener('click', function() {
        const body = document.body;
        const currentWidth = parseInt(getComputedStyle(body).width);
        const currentHeight = parseInt(getComputedStyle(body).height);
        const newWidth = Math.max(150, currentWidth - step); // Giới hạn min 150px
        const newHeight = Math.max(150, currentHeight - step); // Giới hạn min 150px (giảm từ 200px)
        body.style.width = newWidth + 'px';
        body.style.height = newHeight + 'px';
    });

    function parseTime(input) {
        const regex = /(\d+)\s*(s|sec|second|m|min|minute|h|hr|hour|d|day)?/gi;
        let seconds = 0;
        let match;

        while ((match = regex.exec(input)) !== null) {
            const value = parseInt(match[1]);
            const unit = match[2];

            switch (unit) {
                case 's':
                case 'sec':
                case 'second':
                    seconds += value;
                    break;
                case 'm':
                case 'min':
                case 'minute':
                    seconds += value * 60;
                    break;
                case 'h':
                case 'hr':
                case 'hour':
                    seconds += value * 3600;
                    break;
                case 'd':
                case 'day':
                    seconds += value * 86400;
                    break;
                default:
                    seconds += value; // Giả sử là giây nếu không có unit
            }
        }

        return seconds > 0 ? seconds : 120; // Mặc định 2 phút nếu không parse được
    }

    function updateDisplay() {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    function startCountdown() {
        const input = timeInput.value.trim();
        totalSeconds = parseTime(input);

        if (countdownInterval) clearInterval(countdownInterval);

        updateDisplay();

        countdownInterval = setInterval(function() {
            if (totalSeconds <= 0) {
                clearInterval(countdownInterval);
                timerDisplay.textContent = '00:00';
                // Có thể thêm âm thanh hoặc thông báo ở đây
            } else {
                totalSeconds--;
                updateDisplay();
            }
        }, 1000);
    }

    // Bắt đầu với giá trị mặc định
    updateDisplay();

    // Sự kiện nhấn Enter để bắt đầu
    timeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startCountdown();
        }
    });

    // Tự động bắt đầu nếu người dùng thay đổi input (tùy chọn)
    timeInput.addEventListener('change', startCountdown);
});
