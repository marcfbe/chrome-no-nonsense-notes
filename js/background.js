// Set the default suggestion
chrome.omnibox.setDefaultSuggestion({
  description: 'View SAP Note: %s'
});

// Handle user input in the omnibox
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  // Clean up the input - remove any non-digits
  const noteId = text.replace(/\D/g, '');
  if (noteId) {
    // Open the viewer in a new tab
    const viewerUrl = chrome.runtime.getURL(`viewer.html?id=${noteId}`);
    // Force chrome-extension:// protocol to prevent search
    if (!viewerUrl.startsWith('chrome-extension://')) {
      return;
    }
    switch (disposition) {
      case 'currentTab':
        chrome.tabs.update({ url: viewerUrl });
        break;
      case 'newForegroundTab':
        chrome.tabs.create({ url: viewerUrl });
        break;
      case 'newBackgroundTab':
        chrome.tabs.create({ url: viewerUrl, active: false });
        break;
    }
  }
}); 