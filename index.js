document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.querySelector(".message-input");
    const chatForm = document.querySelector(".chat-form");
    const chatBody = document.querySelector(".chat-body");
    const chatbotToggler = document.querySelector("#chatbot-toggler");
    const closeChatbot = document.querySelector("#close-chatbot");
    if (chatbotToggler) {
        chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
    }

    if (closeChatbot) {
        closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
    }

    //API setup
    const ENCRYPTED_API_KEY = '';  // This should be replaced by the encrypted key injected by the workflow
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${decryptApiKey(ENCRYPTED_API_KEY)}`;

    function decryptApiKey(encryptedKey) {
        const decryptedKey = CryptoJS.AES.decrypt(encryptedKey, 'yourpassword').toString(CryptoJS.enc.Utf8);
        return decryptedKey;
    }

    const userData = {
        message: null
    }
    const chatHistory = [];
    const initialInputHeight = messageInput.scrollHeight;

    // gumagawa ng message element na may classes
    const createMessageElement = (content, ...classes) => {
        const div = document.createElement("div");
        div.classList.add("message", ...classes); // yung '...classes' is iaadd lahat ng classes
        div.innerHTML = content;
        return div;
    }

    // paggenerate ng bot response
    const generateBotResponse = async (incomingMessageDiv) => {
        const messageElement = incomingMessageDiv.querySelector(".message-text");
        chatHistory.push({
            role: "user",
            parts: [{text: userData.message}]
        })
        // API response from gemini server
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: chatHistory
            })
        }

        try{
            // fetching ng bot response gamit API
            const response = await fetch(API_URL, requestOptions)
            const data = await response.json();
            if(!response.ok) throw new Error(data.error.message);
            // Extracting ng gemini response as bot response text sa GUI
            const apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, " ").trim();
            messageElement.innerText = apiResponse;
            chatHistory.push({
                role: "model",
                parts: [{text: userData.message}]
            })
            console.log(data);
        }catch(error){
            console.log(error);
            messageElement.innerText = error.message;
            messageElement.style.color = "crimson";
        }finally{
            incomingMessageDiv.classList.remove("thinking");
            chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
        }
    }

    // handling ng user messages
    const handleOutgoingMessage = (e) => {
        e.preventDefault();
        userData.message = messageInput.value.trim();
        // display user message
        const messageContent = `<div class="message-text"></div>`;
        const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
        outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
        chatBody.appendChild(outgoingMessageDiv);
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});

        // bot response na thinking set with timeout
        setTimeout(() => {
            const messageContent = `<img src="./asset/202302553.jpg" class="bot-avatar" width="50" height="50" alt="chatbot-picture">
                        <div class="message-text">
                            <div class="thinking-indicator">
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                            </div>
                        </div>`;

            const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
            chatBody.appendChild(incomingMessageDiv);
            chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
            // para malagay sa gui yung api response ng gemini from user prompt
            generateBotResponse(incomingMessageDiv);
        }, 600);
    }

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        console.log("Event triggered");
        if (userMessage) {
            handleOutgoingMessage(e);
            messageInput.value = '';
        }
    });
    //automatically change ng height ng input field
    messageInput.addEventListener("input", (e) => {
        messageInput.style.height = `${initialInputHeight}px`;
        messageInput.style.height = `${messageInput.scrollHeight}px`;
        document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight >
        initialInputHeight ? "15px" : "32px";
        // change ng border radius depende sa height ng input field
    });
});