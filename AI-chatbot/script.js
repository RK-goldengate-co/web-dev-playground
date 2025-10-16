// Hugging Face API configuration
// API key sẽ được nhập bởi người dùng khi cần thiết
const MODEL_ID = 'microsoft/DialoGPT-medium'; // Model miễn phí của Microsoft

class ChatBot {
    constructor() {
        this.messages = [];
        this.loadChatHistory(); // Tải lịch sử chat từ localStorage
        this.initializeElements();
        this.setupEventListeners();
        this.checkApiKey();
        this.displayChatHistory(); // Hiển thị lịch sử nếu có
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearHistoryButton = document.getElementById('clearHistoryButton');
        this.clearHistoryButton.addEventListener('click', () => this.clearChatHistory());
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Focus on input when page loads
        this.userInput.focus();
    }

    loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            this.messages = JSON.parse(saved);
        }
    }

    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(this.messages));
    }

    displayChatHistory() {
        this.messages.forEach(msg => {
            this.addMessage(msg.text, msg.type, false);
        });
    }

    clearChatHistory() {
        this.messages = [];
        this.chatMessages.innerHTML = '';
        localStorage.removeItem('chatHistory');
    }

    async sendMessage() {
        const userMessage = this.userInput.value.trim();
        const apiKey = this.getApiKey();

        if (!userMessage || !apiKey) {
            if (!apiKey) {
                await this.promptForApiKey();
                return;
            }
            return;
        }

        // Add user message to chat
        this.addMessage(userMessage, 'user');
        this.userInput.value = '';
        this.sendButton.disabled = true;

        try {
            // Call Hugging Face API
            const botResponse = await this.getBotResponse(userMessage, apiKey);
            this.addMessage(botResponse, 'bot');
        } catch (error) {
            console.error('Error:', error);
            this.showError('Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.');
        } finally {
            this.sendButton.disabled = false;
            this.userInput.focus();
        }
    }

    async getBotResponse(userMessage, apiKey) {
        const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: userMessage,
                parameters: {
                    max_length: 100,
                    temperature: 0.7,
                    do_sample: true,
                },
                options: {
                    wait_for_model: true
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Extract the generated text
        let generatedText = '';
        if (Array.isArray(data) && data.length > 0) {
            generatedText = data[0].generated_text;
        } else if (data.generated_text) {
            generatedText = data.generated_text;
        }

        // Remove the original input from the response if present
        if (generatedText.startsWith(userMessage)) {
            generatedText = generatedText.substring(userMessage.length).trim();
        }

        return generatedText || 'Xin lỗi, tôi không thể tạo phản hồi ngay bây giờ.';
    }

    addMessage(text, sender, save = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = text;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = sender === 'user' ? 'Bạn' : 'AI';
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // Lưu lịch sử nếu cần
        if (save) {
            this.messages.push({ text, type: sender });
            this.saveChatHistory();
        }
    }

    showError(message) {
        this.addMessage(message, 'bot');
    }

    showSetupInstructions() {
        const instructions = `
Để sử dụng chatbot này, bạn cần:

1. Đăng ký tài khoản tại https://huggingface.co/
2. Tạo API key tại: https://huggingface.co/settings/tokens
3. Khi được yêu cầu, nhập API key của bạn vào ô nhập liệu

Hugging Face cung cấp gói miễn phí với giới hạn sử dụng hàng tháng.
        `;
        alert(instructions);
    }

    getApiKey() {
        // Try to get API key from session storage first
        return sessionStorage.getItem('hf_api_key');
    }

    setApiKey(apiKey) {
        // Store API key in session storage
        sessionStorage.setItem('hf_api_key', apiKey);
    }

    checkApiKey() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            // Show setup instructions after a short delay
            setTimeout(() => {
                this.showSetupInstructions();
            }, 1000);
        }
    }

    async promptForApiKey() {
        const apiKey = prompt('Vui lòng nhập Hugging Face API key của bạn:');
        if (apiKey && apiKey.trim()) {
            this.setApiKey(apiKey.trim());
            // Try sending the message again with the new API key
            this.sendMessage();
        } else {
            this.showError('API key là bắt buộc để sử dụng chatbot. Vui lòng nhập API key hợp lệ.');
        }
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    const bot = new ChatBot();
    // API key check is now handled in the constructor
});
