// Centralized State Store
export const state = {
  currentChat: null,
  isListening: false,
  personalityState: {},
  lunaMemory: [],
  storageData: [],
  cfg: {}
};

export function setListening(val) { state.isListening = val; }
export function setCurrentChat(val) { state.currentChat = val; }
