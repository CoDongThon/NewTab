import html from "./html.js";
import { gemini } from "./google.js";
import {Modal} from "bootstrap";

console.log(gemini);

const store = {
    get model () {
        return "gemini-2.0-flash";
    },
    set model (value) {},

    get apiKey () {
        return localStorage.getItem("voice-ai-assistant--api-key") || "";
    },
    set apiKey (value) {
        localStorage.setItem("voice-ai-assistant--api-key", value);
    },
};

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
settingsModal.querySelector(`[data-bs-dismiss="modal"]`).addEventListener("click", ({target}) => {
    target.blur();
    settingsModal.classList.remove("show");
    settingsModal.style.display = "none";
    settingsModal.setAttribute("aria-hidden", "true");
});
settingsModal.querySelector(`#settings-save-button`).addEventListener("click", ({target}) => {
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
    if(voiceAiAssistantToggle.checked) {
        root.classList.remove("disabled");
    } else {
        root.classList.add("disabled");
    }
}

voiceAiAssistantToggle.addEventListener("change", () => voiceAiAssistantToggleHandled());
voiceAiAssistantToggleHandled();

function msg$(element) {
    chatMessages.appendChild(element);
    chatMessagesContainer.scrollTop = chatMessages.scrollHeight;
}

function msg$sys(msg) {
    msg$(html`
       <div class="col-12 mb-2">
            <div class="d-flex">
                <div class="p-2 bg-light text-dark rounded"
                    style="max-width: 80%; align-self: flex-start;">
                    <strong>System:</strong> ${msg}
                </div>
            </div>
        </div> 
    `);
}

function msg$usr(msg) {
    msg$(html`
        <div class="col-12 mb-2">
            <div class="d-flex justify-content-end">
                <div class="p-2 bg-primary text-white rounded"
                    style="max-width: 80%; align-self: flex-end;">
                    <strong>User:</strong> ${msg}
                </div>
            </div>
        </div>
    `);
}

msg$sys("Xin chào! Tôi có thể giúp gì cho bạn?");

msg$usr("Tôi muốn biết thời tiết hôm nay.");
msg$sys("Thời tiết hôm nay nắng đẹp, nhiệt độ khoảng 30°C.");
msg$usr("Cảm ơn bạn!");
msg$sys("Không có gì, rất vui được giúp bạn!");
msg$usr("Tôi muốn biết thời tiết hôm nay.");
msg$sys("Thời tiết hôm nay nắng đẹp, nhiệt độ khoảng 30°C.");
msg$usr("Cảm ơn bạn!");
msg$sys("Không có gì, rất vui được giúp bạn!");

chatYourMessageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!store.model || !store.apiKey) {
        if(confirm(`Vui lòng nhập API Key trong phần cài đặt!`)) {
            settingsButton.click();
        }
        return;
    }
    const data = Object.fromEntries(new FormData(event.target, event.submitter));
    const {message} = data;
    if (message) {
        msg$usr(message);
        event.target.querySelector(`[name="message"]`).value = "";
        const response = await gemini(store.model, store.apiKey, {
            contents: [
                {
                    role: "user",
                    parts: {text: `${message}`.trim()},
                },
            ]
        });
        console.log(response);
        msg$sys(response.candidates[0].content.parts[0].text);
    }
});