import html from "./html.js";
import { GoogleGenAI } from '@google/genai';
// import { Modal } from "bootstrap";


import { geminiConfig } from "./assistant.system.js";
// import { gemini } from "./google.js";

const store = {
    get model() {
        return "gemini-2.5-flash-preview-04-17";
    },
    set model(value) { },

    get apiKey() {
        return localStorage.getItem("voice-ai-assistant--api-key") || "";
    },
    set apiKey(value) {
        localStorage.setItem("voice-ai-assistant--api-key", value);
    },
};

const google_gemini_conversation = [];

/* defined */
const root = document.querySelector("dk189-assistant");

let voiceAiAssistantToggle = null;
try {
    voiceAiAssistantToggle = root.shadowRoot.querySelector("#voice-ai-assistant-toggle");
} catch (e) {
    console.warn("voice-ai-assistant-toggle element not found");
}

const chatMessagesContainer = root.shadowRoot.querySelector("#chat-messages-container");
const chatMessages = root.shadowRoot.querySelector("#chat-messages");
const chatYourMessageForm = root.shadowRoot.querySelector("#chat-your-message-form");

const settingsButton = root.shadowRoot.querySelector("#settings-button");
const settingsModal = root.shadowRoot.querySelector("#settings-modal");

let voiceToggle = null; 
try {
    voiceToggle = root.shadowRoot.querySelector("#voice-toggle");
} catch (e) {
    console.warn("voice-toggle element not found");
}


/* modal handling */
settingsButton.addEventListener("click", () => {
    settingsModal.querySelector("#settings-input-api-key").value = store.apiKey || "";

    settingsModal.classList.add("show");
    settingsModal.style.display = "block";
    settingsModal.setAttribute("aria-hidden", "false");
});
settingsModal.querySelector(`[data-bs-dismiss="modal"]`).addEventListener("click", ({ target }) => {
    target.blur();
    settingsModal.classList.remove("show");
    settingsModal.style.display = "none";
    settingsModal.setAttribute("aria-hidden", "true");
});
settingsModal.querySelector(`#settings-save-button`).addEventListener("click", ({ target }) => {
    target.blur();
    settingsModal.classList.remove("show");
    settingsModal.style.display = "none";
    settingsModal.setAttribute("aria-hidden", "true");

    store.apiKey = settingsModal.querySelector("#settings-input-api-key").value;
});

function voiceAiAssistantToggleHandled() {
    if (voiceAiAssistantToggle && voiceAiAssistantToggle.checked) {
        root.classList.remove("disabled");
    } else {
        root.classList.add("disabled");
    }
}

// Only add event listener if element exists
if (voiceAiAssistantToggle) {
    voiceAiAssistantToggle.addEventListener("change", () => voiceAiAssistantToggleHandled());
    voiceAiAssistantToggleHandled();
}

// Speech recognition
let recognition = null;
let isListening = false;

if ('webkitSpeechRecognition' in window && voiceToggle) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';
    
    voiceToggle.disabled = false;
    voiceToggle.title = "Nhấn để sử dụng giọng nói";
    
    recognition.onstart = function() {
        console.log('Speech recognition started');
        if (voiceToggle) {
            isListening = true;
            voiceToggle.classList.add('listening');
            voiceToggle.title = "Đang nghe...";
        }
    };
    
    recognition.onend = function() {
        console.log('Speech recognition ended');
        if (voiceToggle) {
            isListening = false;
            voiceToggle.classList.remove('listening');
            voiceToggle.title = "Nhấn để sử dụng giọng nói";
        }
    };
    
    recognition.onresult = function(event) {
        let interim_transcript = '';
        let final_transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        
        if (final_transcript !== '') {
            const chatInput = root.shadowRoot.querySelector("#chat-input");
            chatInput.value = final_transcript;
            console.log('Final transcript:', final_transcript);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error', event.error);
        if (voiceToggle) {
            isListening = false;
            voiceToggle.classList.remove('listening');
            voiceToggle.title = "Nhấn để sử dụng giọng nói";
        }
    };
} else {
    console.warn('Speech recognition not supported in this browser or voice toggle not found');
    if (voiceToggle) {
        voiceToggle.disabled = true;
        voiceToggle.title = "Tính năng không được hỗ trợ trên trình duyệt này";
    }
}

// Voice toggle event handler
if (voiceToggle) {
    voiceToggle.addEventListener("click", function() {
        if (!isListening) {
            if (recognition) {
                recognition.start();
            }
        } else {
            if (recognition) {
                recognition.stop();
            }
        }
    });
}

speechSynthesis.getVoices();
async function tts(text) {
    var voices = speechSynthesis.getVoices().filter(({ lang }) => lang == "vi-VN");
    if (voices.length == 0) {
        console.warn("No voice found for 'vi-VN'");
        return;
    }
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.voice = voices[0];
    utterance.rate = 1.1;
    utterance.volume = 1;
    utterance.onend = function (event) {
        console.log("SpeechSynthesisUtterance.onend");
    };
    utterance.onerror = function (event) {
        console.error("SpeechSynthesisUtterance.onerror");
    };
    utterance.onstart = function (event) {
        console.log("SpeechSynthesisUtterance.onstart");
    };
    utterance.onboundary = function (event) {
        console.log("SpeechSynthesisUtterance.onboundary");
    };
    utterance.onpause = function (event) {
        console.log("SpeechSynthesisUtterance.onpause");
    };
    utterance.onresume = function (event) {
        console.log("SpeechSynthesisUtterance.onresume");
    };
    utterance.onmark = function (event) {
        console.log("SpeechSynthesisUtterance.onmark");
    };
    utterance.onvoiceschanged = function (event) {
        console.log("SpeechSynthesisUtterance.onvoiceschanged");
    };
    speechSynthesis.speak(utterance);
    console.log("SpeechSynthesisUtterance.speak");
    console.log(utterance);
}

window.tts = tts;

function msg$(element) {
    chatMessages.appendChild(element);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function msg$sys(msg, resp) {
    google_gemini_conversation.push({
        role: "model",
        parts: [{ text: msg }],
    });
    let output = msg;
    let audioTxt;
    try {
        var json;
        try {
            json = JSON.parse(msg);
        }
        catch (e) {
            try {
                json = JSON.parse(msg.substr(7, msg.length - 7 - 3));
            } catch { }
        }
        if (json) {
            if (json.html) {
                output = json.html;
            }
            if (json.text) {
                audioTxt = json.text;
                tts(audioTxt);
            }
        }
    }
    catch (e) {
    }
    var element = html`
        <div class="chat-message chat-message-bot">
            <div class="chat-message-content" pid="output"></div>
            ${audioTxt ? `<audio autoplay control="false"/>` : `<!-- no-audio -->`}
        </div>
    `;
    element.querySelector(`[pid="output"]`).attachShadow({ mode: "open" }).innerHTML = output;
    if (audioTxt) {
        let audio = element.querySelector("audio");

    }
    msg$(element);
}

function msg$usr(msg) {
    google_gemini_conversation.push({
        role: "user",
        parts: [{ text: msg }],
    });
    msg$(html`
        <div class="chat-message chat-message-user">
            ${msg}
        </div>
    `);
}


function showGreeting() {
    if (chatMessages) {
        if (chatMessages.children.length === 0) {
            msg$sys("Xin chào! Tôi có thể giúp gì cho bạn?");
        }
    }
}

window.showAIChatGreeting = showGreeting;

var thinking = false;

chatYourMessageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (thinking) {
        return;
    }
    if (!store.model || !store.apiKey) {
        if (confirm(`Vui lòng nhập API Key trong phần cài đặt!`)) {
            settingsButton.click();
        }
        return;
    }
    thinking = true;
    const data = Object.fromEntries(new FormData(event.target, event.submitter));
    const { message } = data;

    event.target.querySelector(`[name="message"]`).value = "";

    if (message) {
        msg$usr(`${message}`.trim());
        
        // Add typing indicator
        const typingIndicator = html`
            <div class="chat-message chat-message-bot" id="typing-indicator">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        msg$(typingIndicator);

        try {
            var ai = new GoogleGenAI({ apiKey: store.apiKey });

            let resp = await ai.models.generateContent({
                model: store.model,
                config: geminiConfig,
                contents: google_gemini_conversation,
            });

            console.log(resp);
            // Remove typing indicator
            const indicator = root.shadowRoot.querySelector("#typing-indicator");
            if (indicator) indicator.remove();
            
            msg$sys(resp.text, resp);
        } catch (error) {
            console.error("AI error:", error);
            // Remove typing indicator
            const indicator = root.shadowRoot.querySelector("#typing-indicator");
            if (indicator) indicator.remove();
            
            msg$sys(JSON.stringify({
                html: `<div class="alert alert-danger">Lỗi: ${error.message || "Không thể kết nối tới AI"}</div>`,
                text: `Rất tiếc, đã xảy ra lỗi: ${error.message || "Không thể kết nối tới AI"}`
            }));
        }
    }
    thinking = false;
});