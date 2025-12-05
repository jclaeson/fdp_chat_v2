// Background Service Worker
// Handles context menu context or API proxying if needed

chrome.runtime.onInstalled.addListener(() => {
  console.log("FedEx Assistant Extension Installed");
});

// Example: Context menu to "Explain this API parameter"
chrome.contextMenus.create({
  id: "explain-selection",
  title: "Ask FedEx Assistant about '%s'",
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-selection") {
    // Send message to content script to open chat with selection
    chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_CHAT_WITH_QUERY",
      query: info.selectionText
    });
  }
});
