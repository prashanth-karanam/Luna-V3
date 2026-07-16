// Chat UI Components

export function scrollToBottom() {
  const messages = document.getElementById('messages');
  if (messages) {
    messages.scrollTop = messages.scrollHeight;
  }
}
