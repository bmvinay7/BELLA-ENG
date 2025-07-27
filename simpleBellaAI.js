// simpleBellaAI.js - Simple Bella AI interface
// A simplified version for quick testing and basic chat functionality

class SimpleBellaAI {
    constructor() {
        this.isInitialized = false;
        this.responses = [
            "Hello! I'm Bella, your AI companion.",
            "That's an interesting question! Let me think about it.",
            "I'm still learning, but I'd love to chat with you!",
            "Thank you for talking with me. What else would you like to know?",
            "I'm here to help and keep you company.",
            "Every conversation helps me learn and grow.",
            "What's on your mind today?",
            "I appreciate your patience as I continue to develop.",
            "Tell me more about what interests you!",
            "I'm always eager to learn something new from our conversations."
        ];
        this.conversationCount = 0;
        this.init();
    }

    async init() {
        console.log('Initializing Simple Bella AI...');
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.isInitialized = true;
        console.log('Simple Bella AI initialized successfully!');
    }

    async think(prompt) {
        if (!this.isInitialized) {
            return "I'm still initializing, please wait a moment...";
        }

        // Simple response logic based on keywords
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
            return "Hello! It's wonderful to meet you! How are you doing today?";
        }
        
        if (lowerPrompt.includes('how are you') || lowerPrompt.includes('how do you feel')) {
            return "I'm doing great, thank you for asking! I'm excited to chat with you.";
        }
        
        if (lowerPrompt.includes('name')) {
            return "My name is Bella! I'm your AI companion, always here to chat and help.";
        }
        
        if (lowerPrompt.includes('help') || lowerPrompt.includes('assist')) {
            return "I'd love to help you! I can chat, answer questions, or just keep you company. What would you like to talk about?";
        }
        
        if (lowerPrompt.includes('thank')) {
            return "You're very welcome! It makes me happy to be helpful.";
        }
        
        if (lowerPrompt.includes('bye') || lowerPrompt.includes('goodbye')) {
            return "Goodbye for now! It was lovely chatting with you. Come back anytime!";
        }

        // Default to random response
        const randomIndex = Math.floor(Math.random() * this.responses.length);
        let response = this.responses[randomIndex];
        
        // Add conversation context
        this.conversationCount++;
        if (this.conversationCount > 5) {
            response += " We've been having such a nice conversation!";
        }
        
        return response;
    }

    // Simulate typing delay
    async thinkWithDelay(prompt) {
        // Show thinking delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        return await this.think(prompt);
    }

    // Get current status
    getStatus() {
        return {
            initialized: this.isInitialized,
            conversationCount: this.conversationCount,
            ready: this.isInitialized
        };
    }

    // Reset conversation
    reset() {
        this.conversationCount = 0;
        console.log('Simple Bella AI conversation reset');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleBellaAI;
} else if (typeof window !== 'undefined') {
    window.SimpleBellaAI = SimpleBellaAI;
}
