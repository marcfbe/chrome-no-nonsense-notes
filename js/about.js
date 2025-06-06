// Helper function to display messages with optional auto-clear
function displayMessage(content, className, autoClear = false, clearDelay = 4000) {
    const toast = domId('toast');
    toast.classList.remove('toast-warning');
    toast.classList.remove('toast-success');
    toast.classList.remove('toast-info');
    toast.classList.remove('toast-error');
    toast.classList.add(className);
    toast.classList.add('toast-active');

    domTextId('toast-message',content);

    if (autoClear) {
        setTimeout(() => {
            toast.classList.remove('toast-active');
            toast.classList.remove('toast-warning');
            toast.classList.remove('toast-success');
            toast.classList.remove('toast-info');
            toast.classList.remove('toast-error');
        }, clearDelay);
    }
}

// Helper function to display Chrome extension context warning
function displayChromeApiWarning() {
    if (!isChromeExtensionContext()) {
        console.warn('Chrome APIs not available');
        displayMessage(`
            Chrome APIs not available. Please access this page via:<br>
            • Chrome Extensions → No Nonsense Notes for SAP → Details → Extension options<br>
            • Or right-click the extension icon → Options
        `, 'toast-warning', false);
        return true;
    }
    return false;
}

// Load content from manifest.json
async function loadDynamicContent() {
    if (displayChromeApiWarning()) {
        return;
    }

    try {
        const manifestResponse = await fetch(chrome.runtime.getURL('manifest.json'));
        const manifest = await manifestResponse.json();

        domTextId('about-version', `Version ${manifest.version}`);
    } catch (error) {
        console.error('Error loading manifest.json:', error);
        domTextId('about-version', '');
    }
}

// Settings functionality
async function loadSettings() {
    if (displayChromeApiWarning()) {
        return;
    }

    try {
        const settings = await loadAllSettings();

        domId('cache-duration').value = settings.cacheDuration;
        domId('show-breadcrumbs').checked = settings.showBreadcrumbs;

        await loadCachedNotesCount();
    } catch (error) {
        console.error('Error loading settings:', error);
        displayMessage('Error loading settings', 'toast-error');
    }
}

async function loadCachedNotesCount() {
    if (displayChromeApiWarning()) {
        return;
    }

    try {
        const allData = await chrome.storage.local.get(null);
        const cacheKeys = Object.keys(allData).filter(key => key.startsWith(cachePrefix));

        domTextId('cached-notes-count', cacheKeys.length);
    } catch (error) {
        console.error('Error loading cached notes count:', error);
        displayMessage('Error loading cached notes count', 'toast-error');
    }
}

async function clearCache() {
    if (displayChromeApiWarning()) {
        return;
    }

    try {
        const allData = await chrome.storage.local.get(null);
        const cacheKeys = Object.keys(allData).filter(key => key.startsWith(cachePrefix));
        
        if (cacheKeys.length === 0) {
            displayMessage('Cache is already empty!', 'toast-info', true);
        } else {
            await chrome.storage.local.remove(cacheKeys);
            displayMessage(`Cache cleaned successfully! Removed ${cacheKeys.length} cached notes.`, 'toast-success', true);
        }
        
        // Update the cached notes count
        await loadCachedNotesCount();
    } catch (error) {
        console.error('Error cleaning cache:', error);
        displayMessage('Error cleaning cache', 'toast-error');
    }
}

async function saveSettingsLocal() {
    if (displayChromeApiWarning()) {
        return;
    }

    try {
        const cacheDuration = parseInt(domId('cache-duration').value) || 1;
        const showBreadcrumbs = domId('show-breadcrumbs').checked;

        if (cacheDuration < 0 || cacheDuration > 30) {
            displayMessage('Cache duration must be between 0 and 30 days', 'toast-error');
            return;
        }

        await saveSettings({ cacheDuration, showBreadcrumbs });

        displayMessage('Settings saved successfully!', 'toast-success', true);
    } catch (error) {
        console.error('Error saving settings:', error);
        displayMessage('Error saving settings', 'toast-error');
    }
}

// Load content and settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDynamicContent();
    loadSettings();

    // Auto-save when settings change
    domId('show-breadcrumbs').addEventListener('change', saveSettingsLocal);
    domId('cache-duration').addEventListener('change', saveSettingsLocal);
    domId('cache-duration').addEventListener('input', saveSettingsLocal);
    
    // Cache cleanup
    domId('clear-cache').addEventListener('click', clearCache);

    // Footer buttons
    domId('privacy-button').addEventListener('click', () => {
        window.open('https://github.com/marcfbe/chrome-no-nonsense-notes/blob/main/PRIVACY.md', '_blank');
    });
    
    domId('license-button').addEventListener('click', () => {
        window.open('https://github.com/marcfbe/chrome-no-nonsense-notes/blob/main/LICENSE', '_blank');
    });
    
    domId('repository-button').addEventListener('click', () => {
        window.open('https://github.com/marcfbe/chrome-no-nonsense-notes', '_blank');
    });
    
    domId('donate-button').addEventListener('click', () => {
        window.open('https://github.com/sponsors/mbtools?frequency=one-time&sponsor=mbtools', '_blank');
    });
}); 