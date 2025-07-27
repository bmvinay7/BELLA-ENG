// core.js - Bella's Brain (v3)
// Bella's core AI logic, supporting hybrid architecture of local models and cloud APIs

import { pipeline, env, AutoTokenizer, AutoModelForSpeechSeq2Seq } from './vendor/transformers.js';
import CloudAPIService from './cloudAPI.js';

// Local model configuration
env.allowLocalModels = true;
env.useBrowserCache = false;
env.allowRemoteModels = false;
env.backends.onnx.logLevel = 'verbose';
env.localModelPath = './models/';


class BellaAI {
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            this.instance = new BellaAI();
            await this.instance.init();
        }
        return this.instance;
    }

    constructor() {
        this.cloudAPI = new CloudAPIService();
        this.useCloudAPI = false; // Default to use local models
        this.currentMode = 'casual'; // Chat modes: casual, assistant, creative
    }

    async init() {
        console.log('Initializing Bella\'s core AI...');
        
        // Priority loading LLM model (chat functionality)
        try {
            console.log('Loading LLM model...');
            this.llm = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
            console.log('LLM model loaded successfully.');
        } catch (error) {
            console.error('Failed to load LLM model:', error);
            // LLM loading failed, but doesn't prevent initialization
        }
        
        // Try loading ASR model (speech recognition functionality)
        try {
            console.log('Loading ASR model...');
            const modelPath = 'Xenova/whisper-asr';
            const tokenizer = await AutoTokenizer.from_pretrained(modelPath);
            const model = await AutoModelForSpeechSeq2Seq.from_pretrained(modelPath);
            this.asr = await pipeline('automatic-speech-recognition', model, { tokenizer });
            console.log('ASR model loaded successfully.');
        } catch (error) {
            console.warn('ASR model failed to load, voice recognition will be disabled:', error);
            // ASR loading failed, but doesn't affect chat functionality
            this.asr = null;
        }

        // Try loading TTS model (text-to-speech functionality)
        try {
            console.log('Loading TTS model...');
            this.tts = await pipeline('text-to-speech', 'Xenova/speecht5_tts', { quantized: false });
            console.log('TTS model loaded successfully.');
        } catch (error) {
            console.warn('TTS model failed to load, voice synthesis will be disabled:', error);
            this.tts = null;
        }

        console.log('Bella\'s core AI initialized successfully.');
    }

    async think(prompt) {
        try {
            // If cloud API is enabled and configured correctly, prioritize cloud service
            if (this.useCloudAPI && this.cloudAPI.isConfigured()) {
                return await this.thinkWithCloudAPI(prompt);
            }
            
            // Otherwise use local model
            return await this.thinkWithLocalModel(prompt);
            
        } catch (error) {
            console.error('Error occurred during thinking process:', error);
            
            // If cloud API fails, try degrading to local model
            if (this.useCloudAPI) {
                console.log('Cloud API failed, degrading to local model...');
                try {
                    return await this.thinkWithLocalModel(prompt);
                } catch (localError) {
                    console.error('Local model also failed:', localError);
                }
            }
            
            return this.getErrorResponse();
        }
    }

    // Use cloud API for thinking
    async thinkWithCloudAPI(prompt) {
        const enhancedPrompt = this.enhancePromptForMode(prompt);
        return await this.cloudAPI.chat(enhancedPrompt);
    }

    // Use local model for thinking
    async thinkWithLocalModel(prompt) {
        if (!this.llm) {
            return "I'm still learning how to think, please wait a moment...";
        }
        
        const bellaPrompt = this.enhancePromptForMode(prompt, true);
        
        const result = await this.llm(bellaPrompt, {
            max_new_tokens: 50,
            temperature: 0.8,
            top_k: 40,
            do_sample: true,
        });
        
        // Clean generated text
        let response = result[0].generated_text;
        if (response.includes(bellaPrompt)) {
            response = response.replace(bellaPrompt, '').trim();
        }
        
        return response || "I need to think more...";
    }

    // Enhance prompts based on mode
    enhancePromptForMode(prompt, isLocal = false) {
        const modePrompts = {
            casual: isLocal ? 
                `As a warm and lovely AI companion Bella, respond with a relaxed and friendly tone: ${prompt}` :
                `Please respond with a warm and relaxed tone, like a caring friend. Keep it concise and interesting: ${prompt}`,
            assistant: isLocal ?
                `As intelligent assistant Bella, provide useful and accurate help: ${prompt}` :
                `As a professional but warm AI assistant, provide accurate and useful information and advice: ${prompt}`,
            creative: isLocal ?
                `As creative AI companion Bella, use imagination to respond: ${prompt}` :
                `Use creativity and imagination to provide interesting and unique responses and ideas: ${prompt}`
        };
        
        return modePrompts[this.currentMode] || modePrompts.casual;
    }

    // Get error responses
    getErrorResponse() {
        const errorResponses = [
            "Sorry, I'm a bit confused right now, let me reorganize my thoughts...",
            "Hmm... I need to think more, please wait a moment.",
            "My thoughts are a bit messy, give me some time to organize.",
            "Let me reorganize my language, please wait a moment."
        ];
        
        return errorResponses[Math.floor(Math.random() * errorResponses.length)];
    }

    // Set chat mode
    setChatMode(mode) {
        if (['casual', 'assistant', 'creative'].includes(mode)) {
            this.currentMode = mode;
            return true;
        }
        return false;
    }

    // Switch AI service provider
    switchProvider(provider) {
        if (provider === 'local') {
            this.useCloudAPI = false;
            return true;
        } else {
            const success = this.cloudAPI.switchProvider(provider);
            if (success) {
                this.useCloudAPI = true;
            }
            return success;
        }
    }

    // Set API key
    setAPIKey(provider, apiKey) {
        return this.cloudAPI.setAPIKey(provider, apiKey);
    }

    // Clear conversation history
    clearHistory() {
        this.cloudAPI.clearHistory();
    }

    // Get current configuration info
    getCurrentConfig() {
        return {
            useCloudAPI: this.useCloudAPI,
            provider: this.useCloudAPI ? this.cloudAPI.getCurrentProvider() : { name: 'local', model: 'LaMini-Flan-T5-77M' },
            mode: this.currentMode,
            isConfigured: this.useCloudAPI ? this.cloudAPI.isConfigured() : true
        };
    }

    async listen(audioData) {
        if (!this.asr) {
            throw new Error('Speech recognition model not initialized');
        }
        const result = await this.asr(audioData);
        return result.text;
    }

    async speak(text) {
        if (!this.tts) {
            throw new Error('Text-to-speech model not initialized');
        }
        // We need speaker embeddings for SpeechT5
        const speaker_embeddings = 'models/Xenova/speecht5_tts/speaker_embeddings.bin';
        const result = await this.tts(text, {
            speaker_embeddings,
        });
        return result.audio;
    }

    // Get cloud API service instance (for external access)
    getCloudAPIService() {
        return this.cloudAPI;
    }
}

// ES6 module export
export { BellaAI };
