// Settings utility functions for No Nonsense Notes

// Check if chrome APIs are available
function isChromeExtensionContext() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id && 
           chrome.storage;
}

// Helper function to display Chrome extension context warning
function displayChromeApiWarning() {
    if (!isChromeExtensionContext()) {
        console.warn('Chrome APIs not available');
        return true;
    }
    return false;
}

// Load breadcrumbs setting
async function loadBreadcrumbsSetting() {
    if (!isChromeExtensionContext()) {
        return false; // Default to false if Chrome APIs not available
    }

    try {
        const result = await chrome.storage.sync.get(['showBreadcrumbs']);
        return result.showBreadcrumbs || false;
    } catch (error) {
        console.error('Error loading breadcrumbs setting:', error);
        return false;
    }
}

// Load cache duration setting
async function getCacheDuration() {
    if (!isChromeExtensionContext()) {
        return 24 * 60 * 60 * 1000; // Default to 1 day in milliseconds
    }

    try {
        const result = await chrome.storage.sync.get(['cacheDuration']);
        return (result.cacheDuration || 1) * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    } catch (error) {
        console.error('Error getting cache duration:', error);
        return 24 * 60 * 60 * 1000; // Default to 1 day in milliseconds
    }
}

// Load all settings at once
async function loadAllSettings() {
    if (!isChromeExtensionContext()) {
        return {
            cacheDuration: 1,
            showBreadcrumbs: false
        };
    }

    try {
        const result = await chrome.storage.sync.get(['cacheDuration', 'showBreadcrumbs']);
        return {
            cacheDuration: result.cacheDuration || 1,
            showBreadcrumbs: result.showBreadcrumbs || false
        };
    } catch (error) {
        console.error('Error loading settings:', error);
        return {
            cacheDuration: 1,
            showBreadcrumbs: false
        };
    }
}

// Save settings
async function saveSettings(settings) {
    if (!isChromeExtensionContext()) {
        throw new Error('Chrome APIs not available');
    }

    try {
        await chrome.storage.sync.set(settings);
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
} 