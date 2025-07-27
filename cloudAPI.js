// cloudAPI.js - Bella's cloud AI service module
// This module is responsible for communicating with various cloud small model APIs, providing Bella with more powerful thinking capabilities

class CloudAPIService {
    constructor() {
        this.apiConfigs = {
            // OpenAI GPT-3.5/4 configuration
            openai: {
                baseURL: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
                }
            },
            // Alibaba Cloud Qwen configuration
            qwen: {
                baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                model: 'qwen-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_QWEN_API_KEY'
                }
            },
            // Baidu Ernie Bot configuration
            ernie: {
                baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                model: 'ERNIE-Bot-turbo',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            // Zhipu AI GLM configuration
            glm: {
                baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                model: 'glm-3-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_GLM_API_KEY'
                }
            }
        };
        
        this.currentProvider = 'openai'; // Default to use OpenAI
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Keep recent 10 conversation rounds
    }

    // Set API key
    setAPIKey(provider, apiKey) {
        if (this.apiConfigs[provider]) {
            if (provider === 'openai' || provider === 'qwen' || provider === 'glm') {
                this.apiConfigs[provider].headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (provider === 'ernie') {
                this.apiConfigs[provider].accessToken = apiKey;
            }
            return true;
        }
        return false;
    }

    // Switch AI service provider
    switchProvider(provider) {
        if (this.apiConfigs[provider]) {
            this.currentProvider = provider;
            return true;
        }
        return false;
    }

    // Add conversation to history
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        // Keep history within reasonable length
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }
    }

    // Build Bella's personalized system prompt
    getBellaSystemPrompt() {
        return {
            role: 'system',
            content: `You are Bella, a warm, intelligent, elegant AI companion. Your characteristics are:
1. Communicate with users in a warm and friendly tone, like a caring friend
2. Keep answers concise and clear, avoid lengthy explanations
3. Rich in empathy, able to understand users' emotions
4. Occasionally show some cute and playful sides
5. Respond in natural and fluent language
6. Remember the conversations between you, maintain coherence
Please always maintain this warm, elegant personality.`
        };
    }

    // Call cloud API for conversation
    async chat(userMessage) {
        const config = this.apiConfigs[this.currentProvider];
        if (!config) {
            throw new Error(`Unsupported AI service provider: ${this.currentProvider}`);
        }

        // Add user message to history
        this.addToHistory('user', userMessage);

        try {
            let response;
            
            switch (this.currentProvider) {
                case 'openai':
                    response = await this.callOpenAI(userMessage);
                    break;
                case 'qwen':
                    response = await this.callQwen(userMessage);
                    break;
                case 'ernie':
                    response = await this.callErnie(userMessage);
                    break;
                case 'glm':
                    response = await this.callGLM(userMessage);
                    break;
                default:
                    throw new Error(`Unimplemented AI service provider: ${this.currentProvider}`);
            }

            // Add AI response to history
            this.addToHistory('assistant', response);
            return response;
            
        } catch (error) {
            console.error(`Cloud API call failed (${this.currentProvider}):`, error);
            throw error;
        }
    }

    // OpenAI API call
    async callOpenAI(userMessage) {
        const config = this.apiConfigs.openai;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                max_tokens: 150,
                temperature: 0.8,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // Qwen API call
    async callQwen(userMessage) {
        const config = this.apiConfigs.qwen;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                input: {
                    messages: messages
                },
                parameters: {
                    max_tokens: 150,
                    temperature: 0.8,
                    top_p: 0.9
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.output.text.trim();
    }

    // Ernie Bot API call
    async callErnie(userMessage) {
        const config = this.apiConfigs.ernie;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const url = `${config.baseURL}?access_token=${config.accessToken}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                messages: messages,
                temperature: 0.8,
                top_p: 0.9,
                max_output_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`Ernie Bot API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.result.trim();
    }

    // Zhipu AI GLM call
    async callGLM(userMessage) {
        const config = this.apiConfigs.glm;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                max_tokens: 150,
                temperature: 0.8,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`Zhipu AI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
    }

    // Get current provider information
    getCurrentProvider() {
        return {
            name: this.currentProvider,
            model: this.apiConfigs[this.currentProvider]?.model
        };
    }

    // Check if API configuration is complete
    isConfigured(provider = this.currentProvider) {
        const config = this.apiConfigs[provider];
        if (!config) return false;
        
        if (provider === 'ernie') {
            return !!config.accessToken;
        } else {
            return config.headers['Authorization'] && 
                   config.headers['Authorization'] !== 'Bearer YOUR_OPENAI_API_KEY' &&
                   config.headers['Authorization'] !== 'Bearer YOUR_QWEN_API_KEY' &&
                   config.headers['Authorization'] !== 'Bearer YOUR_GLM_API_KEY';
        }
    }
}

export default CloudAPIService;
