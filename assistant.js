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

const voiceAiAssistantToggle = root.shadowRoot.querySelector("#voice-ai-assistant-toggle");

const chatMessagesContainer = root.shadowRoot.querySelector("#chat-messages-container");
const chatMessages = root.shadowRoot.querySelector("#chat-messages");
const chatYourMessageForm = root.shadowRoot.querySelector("#chat-your-message-form");

const settingsButton = root.shadowRoot.querySelector("#settings-button");
const settingsModal = root.shadowRoot.querySelector("#settings-modal");

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
/* modal handling */

function voiceAiAssistantToggleHandled() {
    // chatMessagesContainer.hidden = !voiceAiAssistantToggle.checked;
    // chatYourMessageForm.hidden = !voiceAiAssistantToggle.checked;
    if (voiceAiAssistantToggle.checked) {
        root.classList.remove("disabled");
    } else {
        root.classList.add("disabled");
    }
}

voiceAiAssistantToggle.addEventListener("change", () => voiceAiAssistantToggleHandled());
voiceAiAssistantToggleHandled();

speechSynthesis.getVoices(); // load voices
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
    // utterance.pitch = 1;
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
    chatMessagesContainer.scrollTop = chatMessages.scrollHeight;
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
        <div class="col-12 mb-2">
            <div class="d-flex">
                <div class="p-2 bg-light text-dark rounded"
                    style="max-width: 80%; align-self: flex-start;">
                    <strong>Trợ lý:</strong>
                    <div pid="output"></div>
                </div>
            </div>
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
        <div class="col-12 mb-2">
            <div class="d-flex justify-content-end">
                <div class="p-2 bg-primary text-white rounded"
                    style="max-width: 80%; align-self: flex-end;">
                    <strong>Bạn:</strong> ${msg}
                </div>
            </div>
        </div>
    `);
}

msg$sys("Xin chào! Tôi có thể giúp gì cho bạn?");

// msg$usr("Tôi muốn biết thời tiết hôm nay.");
// msg$sys("Thời tiết hôm nay nắng đẹp, nhiệt độ khoảng 30°C.");
// msg$usr("Cảm ơn bạn!");
// msg$sys("Không có gì, rất vui được giúp bạn!");
// msg$usr("Tôi muốn biết thời tiết hôm nay.");
// msg$sys("Thời tiết hôm nay nắng đẹp, nhiệt độ khoảng 30°C.");
// msg$usr("Cảm ơn bạn!");
// msg$sys("Không có gì, rất vui được giúp bạn!");

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

        var ai = new GoogleGenAI({ apiKey: store.apiKey });

        let resp = await ai.models.generateContent({
            model: store.model,
            config: geminiConfig,
            contents: google_gemini_conversation,
        });

        console.log(resp);
        msg$sys(resp.text, resp);
    }
    thinking = false;
});