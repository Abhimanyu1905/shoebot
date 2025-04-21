// Chat functionality
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const suggestionBtns = document.querySelectorAll(".suggestion-btn");

// Get current time for message timestamps
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Add a new message to the chat box
function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  
  messageDiv.innerHTML = `
    ${text}
    <div class="message-time">${getCurrentTime()}</div>
  `;
  
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Show typing indicator while waiting for response
function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.id = "typing-indicator";
  typingDiv.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Hide typing indicator once response is received
function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Get response from the backend API
async function getBotResponse(input) {
  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: input })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.response || `Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data && data.response) {
      return data.response;
    } else {
      throw new Error("Invalid response format from server");
    }
  } catch (err) {
    console.error("API Error:", err);
    return "I'm having trouble connecting to my shoe database right now. Please try again in a moment.";
  }
}

// Handle user message submission
async function handleMessage() {
  const input = userInput.value.trim();
  if (!input) return;
  
  // Add user message to chat
  addMessage(input, "user");
  userInput.value = "";
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    // Get response from bot
    const reply = await getBotResponse(input);
    hideTypingIndicator();
    addMessage(reply, "bot");
  } catch (error) {
    hideTypingIndicator();
    addMessage("Sorry, there was an error processing your request.", "bot");
    console.error("Error in handleMessage:", error);
  }
}

// Event listeners
sendBtn.addEventListener("click", handleMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") handleMessage();
});

suggestionBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    userInput.value = btn.getAttribute("data-question");
    userInput.focus();
  });
});

// Initial greeting messages
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    addMessage("Try asking me about shoes for different occasions, weather conditions, or activities!", "bot");
  }, 1500);
});
