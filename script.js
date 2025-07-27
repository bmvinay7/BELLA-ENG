// Import BellaAI core modules
import { BellaAI } from './core.js';
import { ChatInterface } from './chatInterface.js';

document.addEventListener('DOMContentLoaded', async function() {
    // --- Get all necessary DOM elements first ---
    const transcriptDiv = document.getElementById('transcript');
    const loadingScreen = document.getElementById('loading-screen');
    const video1 = document.getElementById('video1');
    const video2 = document.getElementById('video2');
    const micButton = document.getElementById('mic-button');


    // --- AI Core Initialization ---
    let bellaAI;
    let chatInterface;
    
    // First initialize chat interface (doesn't depend on AI)
    try {
        chatInterface = new ChatInterface();
        console.log('Chat interface initialized successfully');
        console.log('ChatInterface instance created:', chatInterface);
        console.log('Chat container element:', chatInterface.chatContainer);
        console.log('Is chat container in DOM:', document.body.contains(chatInterface.chatContainer));
        
        // Auto-show chat interface (for debugging)
        setTimeout(() => {
            console.log('Trying to auto-show chat interface...');
            chatInterface.show();
            console.log('Chat interface auto-displayed');
            console.log('Chat interface visibility:', chatInterface.getVisibility());
            console.log('Chat container class name:', chatInterface.chatContainer.className);
        }, 2000);
    } catch (error) {
        console.error('Chat interface initialization failed:', error);
    }
    
    // Then try to initialize AI core
    micButton.disabled = true;
    transcriptDiv.textContent = 'Awakening Bella\'s core...';
    try {
        bellaAI = await BellaAI.getInstance();
        console.log('Bella AI initialization successful');
        
        // Set up chat interface AI callback functions
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                try {
                    chatInterface.showTypingIndicator();
                    const response = await bellaAI.think(message);
                    chatInterface.hideTypingIndicator();
                    chatInterface.addMessage('assistant', response);
                } catch (error) {
                    console.error('AI processing error:', error);
                    chatInterface.hideTypingIndicator();
                    chatInterface.addMessage('assistant', 'Sorry, I\'m a bit confused right now, please try again later...');
                }
            };
            
            // Set up AI service provider switching callback
            chatInterface.onProviderChange = (provider) => {
                const success = bellaAI.switchProvider(provider);
                if (success) {
                    console.log(`Switched to ${provider} service provider`);
                    chatInterface.showNotification(`Switched to ${provider}`, 'success');
                } else {
                    console.error(`Failed to switch to ${provider}`);
                    chatInterface.showNotification(`Switch failed`, 'error');
                }
            };
            
            // Set up API key save callback
            chatInterface.onAPIKeySave = (provider, apiKey) => {
                const success = bellaAI.setAPIKey(provider, apiKey);
                if (success) {
                    console.log(`${provider} API key saved`);
                    return true;
                } else {
                    console.error(`${provider} API key save failed`);
                    chatInterface.showNotification(`API key save failed`, 'error');
                    return false;
                }
            };
            
            // Set up clear history callback
            chatInterface.onClearHistory = () => {
                bellaAI.clearHistory();
                console.log('Chat history cleared');
            };
        }
        
        micButton.disabled = false;
        transcriptDiv.textContent = 'Bella is ready, please click the microphone to start conversation.';
    } catch (error) {
        console.error('Failed to initialize Bella AI:', error);
        transcriptDiv.textContent = 'AI model loading failed, but chat interface is still available.';
        
        // Even if AI fails, provide basic chat functionality
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                chatInterface.showTypingIndicator();
                setTimeout(() => {
                    chatInterface.hideTypingIndicator();
                    const fallbackResponses = [
                        'My AI core is still loading, please try again later...',
                        'Sorry, I can\'t think properly right now, but I\'ll keep learning!',
                        'My brain is still starting up, please give me some time...',
                        'System is updating, temporarily unable to provide intelligent responses.'
                    ];
                    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
                    chatInterface.addMessage('assistant', randomResponse);
                }, 1000);
            };
        }
        
        // Disable voice functionality, but keep interface available
        micButton.disabled = true;
    }

    // --- Loading screen handling ---
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        // Hide it after the animation to prevent it from blocking interactions
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Show chat control panel
            const chatControlPanel = document.querySelector('.chat-control-panel');
            if (chatControlPanel) {
                chatControlPanel.classList.add('visible');
            }
        }, 500); // This time should match the transition time in CSS
    }, 1500); // Start fading out after 1.5 seconds

    let activeVideo = video1;
    let inactiveVideo = video2;

    // Video list
    const videoList = [
        'video_resources/3d_modeling_image_creation.mp4',
        'video_resources/jimeng-2025-07-16-1043-elegant_side_to_side_swaying_then_chin_resting_with_smile.mp4',
        'video_resources/jimeng-2025-07-16-4437-peace_sign_then_elegant_swaying_with_smile.mp4',
        'video_resources/generated_cheering_video.mp4',
        'video_resources/generated_dancing_video.mp4',
        'video_resources/negative/jimeng-2025-07-16-9418-hands_on_hips_pouting_slightly_angry_expression.mp4'
    ];

    // --- Video cross-fade playback functionality ---
    function switchVideo() {
        // 1. Select next video
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        let nextVideoSrc = currentVideoSrc;
        while (nextVideoSrc === currentVideoSrc) {
            const randomIndex = Math.floor(Math.random() * videoList.length);
            nextVideoSrc = videoList[randomIndex];
        }

        // 2. Set inactive video element source
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        // 3. When inactive video can play, execute switch
        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            // Ensure event only triggers once
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);

            // 4. Play new video
            inactiveVideo.play().catch(error => {
                console.error("Video play failed:", error);
            });

            // 5. Switch active class to trigger CSS transition
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');

            // 6. Update roles
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];

            // Bind ended event for new activeVideo
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true }); // Use { once: true } to ensure event is only handled once
    }

    // Initial startup
    activeVideo.addEventListener('ended', switchVideo, { once: true });
    
    // Chat control button events
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatTestBtn = document.getElementById('chat-test-btn');
    
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            if (chatInterface) {
                console.log('Chat button clicked');
                console.log('Chat interface state before click:', chatInterface.getVisibility());
                console.log('Chat container class name before click:', chatInterface.chatContainer.className);
                
                chatInterface.toggle();
                
                console.log('Chat interface state after click:', chatInterface.getVisibility());
                console.log('Chat container class name after click:', chatInterface.chatContainer.className);
                console.log('Chat interface toggled, current state:', chatInterface.getVisibility());
                
                // Update button state
                const isVisible = chatInterface.getVisibility();
                chatToggleBtn.innerHTML = isVisible ? 
                    '<i class="fas fa-times"></i><span>Close</span>' : 
                    '<i class="fas fa-comments"></i><span>Chat</span>';
                console.log('Button text updated to:', chatToggleBtn.innerHTML);
            }
        });
    }
    
    if (chatTestBtn) {
        chatTestBtn.addEventListener('click', () => {
            if (chatInterface) {
                const testMessages = [
                    'Hello! I\'m Bella, nice to meet you!',
                    'Chat interface is working normally, all functions are ready.',
                    'This is a test message to verify interface functionality.'
                ];
                const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
                chatInterface.addMessage('assistant', randomMessage);
                
                // If chat interface is not shown, auto-show it
                if (!chatInterface.getVisibility()) {
                    chatInterface.show();
                    chatToggleBtn.innerHTML = '<i class="fas fa-times"></i><span>Close</span>';
                }
                
                console.log('Test message added:', randomMessage);
            }
        });
    }


    // --- Speech recognition core ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    // Check if browser supports speech recognition
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Continuous recognition
        recognition.lang = 'en-US'; // Set language to English
        recognition.interimResults = true; // Get interim results

        recognition.onresult = async (event) => {
            const transcriptContainer = document.getElementById('transcript');
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            // Update interim results
            transcriptContainer.textContent = `You: ${final_transcript || interim_transcript}`;

            // Once we have a final result, process it with the AI
            if (final_transcript && bellaAI) {
                const userText = final_transcript.trim();
                transcriptContainer.textContent = `You: ${userText}`;

                // If chat interface is open, also display in chat window
                if (chatInterface && chatInterface.getVisibility()) {
                    chatInterface.addMessage('user', userText);
                }

                try {
                    // Let Bella think
                    const thinkingText = document.createElement('p');
                    thinkingText.textContent = 'Bella is thinking...';
                    thinkingText.style.color = '#888';
                    thinkingText.style.fontStyle = 'italic';
                    transcriptContainer.appendChild(thinkingText);
                    
                    const response = await bellaAI.think(userText);
                    
                    transcriptContainer.removeChild(thinkingText);
                    const bellaText = document.createElement('p');
                    bellaText.textContent = `Bella: ${response}`;
                    bellaText.style.color = '#ff6b9d';
                    bellaText.style.fontWeight = 'bold';
                    bellaText.style.marginTop = '10px';
                    transcriptContainer.appendChild(bellaText);

                    // If chat interface is open, also display in chat window
                    if (chatInterface && chatInterface.getVisibility()) {
                        chatInterface.addMessage('assistant', response);
                    }

                    // Try using TTS functionality (text-to-speech)
                    try {
                        if (bellaAI.tts) {
                            const audioData = await bellaAI.speak(response);
                            const blob = new Blob([audioData], { type: 'audio/wav' });
                            const audioUrl = URL.createObjectURL(blob);
                            const audio = new Audio(audioUrl);
                            audio.play();
                            console.log('Text-to-speech playback successful');
                        }
                    } catch (ttsError) {
                        console.warn('TTS playback failed:', ttsError);
                        // TTS failure doesn't affect normal chat functionality
                    }

                } catch (error) {
                    console.error('Bella AI processing error:', error);
                    const errorText = document.createElement('p');
                    const errorMsg = 'Bella encountered a problem while processing, but she\'s still learning...';
                    errorText.textContent = errorMsg;
                    errorText.style.color = '#ff9999';
                    transcriptContainer.appendChild(errorText);
                    
                    if (chatInterface && chatInterface.getVisibility()) {
                        chatInterface.addMessage('assistant', errorMsg);
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

    } else {
        console.log('Your browser does not support speech recognition functionality.');
        // Can provide user prompt on interface
    }

    // --- Microphone button interaction ---
    let isListening = false;

    micButton.addEventListener('click', function() {
        if (!SpeechRecognition) return; // If not supported, don't execute any operations

        isListening = !isListening;
        micButton.classList.toggle('is-listening', isListening);
        const transcriptContainer = document.querySelector('.transcript-container');
        const transcriptText = document.getElementById('transcript');

        if (isListening) {
            transcriptText.textContent = 'Listening...'; // Show prompt immediately
            transcriptContainer.classList.add('visible');
            recognition.start();
        } else {
            recognition.stop();
            transcriptContainer.classList.remove('visible');
            transcriptText.textContent = ''; // Clear text
        }
    });




});
