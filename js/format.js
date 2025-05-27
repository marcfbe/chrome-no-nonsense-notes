/**
 * Normalizes date strings to yyyy-mm-dd format
 * @param {string} dateString - Date in format dd.mm.yyyy or mm/dd/yyyy
 * @returns {string} Date in yyyy-mm-dd format
 */
function normalizeDateFormat(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return dateString;
    }

    // Remove any extra whitespace
    const cleanDate = dateString.trim();
    
    // Check for dd.mm.yyyy format (European)
    const europeanMatch = cleanDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (europeanMatch) {
        const [, day, month, year] = europeanMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Check for mm/dd/yyyy format (American)
    const americanMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (americanMatch) {
        const [, month, day, year] = americanMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Check for yyyy.mm.dd format
    const dotMatch = cleanDate.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (dotMatch) {
        const [, year, month, day] = dotMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Add "time ago" information to the normalized date
    const normalizedDate = cleanDate.match(/^\d{4}-\d{2}-\d{2}$/) ? cleanDate : cleanDate;
    if (normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(normalizedDate);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return `${normalizedDate} (<span style="color: red">today</span>)`;
        if (diffDays === 1) return `${normalizedDate} (<span style="color: red">yesterday</span>)`;
        if (diffDays < 7) return `${normalizedDate} (<span style="color: orange">${diffDays} days ago</span>)`;
        if (diffDays < 30) return `${normalizedDate} (<span style="color: #ffa07a">${Math.floor(diffDays/7)} weeks ago</span>)`;
        if (diffDays < 365) return `${normalizedDate} (${Math.floor(diffDays/30)} months ago)`;
        return `${normalizedDate} (${Math.floor(diffDays/365)} years ago)`;
    }

    // If already in yyyy-mm-dd format or unrecognized format, return as is
    return cleanDate;
}

/**
 * Formats long text content by converting URLs and note references to proper links
 * @param {string} longText - The HTML content to format
 * @returns {string} Formatted HTML content with proper links
 */
function formatLongText(longText) {
    if (!longText || typeof longText !== 'string') {
        return longText;
    }

    let formattedText = longText;

    // 1. Convert relative /notes/ URLs to viewer.html links
    formattedText = formattedText.replace(
        /href=["']\/notes\/(\d+)[^"']*["']/gi,
        'href="viewer.html?id=$1"'
    );

    // 2. Convert plain HTTP/HTTPS URLs to links (but not if they're already in <a> tags)
    formattedText = formattedText.replace(
        /(?<!<a[^>]*>.*?)(?<!href=["'])https?:\/\/[^\s<>"]+(?![^<]*<\/a>)/gi,
        (match) => {
            // Check if this URL should be converted to viewer.html
            if (match.includes('me.sap.com/notes/') || match.includes('launchpad.support.sap.com/#/notes/')) {
                const noteId = extractNoteId(match);
                if (noteId) {
                    return `<a href="viewer.html?id=${noteId}">${noteId}</a>`;
                }
            }
            // Open other links in new tab
            return `<a href="${match}" target="_blank">${match}</a>`;
        }
    );

    // 3. Convert me.sap.com/notes/ links to viewer.html (if not already processed above)
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*me\.sap\.com\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, text) => {
            const noteId = extractNoteId(url);
            if (noteId) {
                return `<a href="viewer.html?id=${noteId}">${noteId}</a>`;
            }
            return match;
        }
    );

    // 4. Convert launchpad.support.sap.com/#/notes/ links to viewer.html
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*launchpad\.support\.sap\.com\/#\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, text) => {
            const noteId = extractNoteId(url);
            if (noteId) {
                return `<a href="viewer.html?id=${noteId}">${noteId}</a>`;
            }
            return match;
        }
    );

    // 5. Add target="_blank" to external links that don't already have it
    formattedText = formattedText.replace(
        /<a([^>]*href=["'][^"']*(?!viewer\.html)[^"']*["'][^>]*)(?!.*target=)([^>]*)>/gi,
        '<a$1 target="_blank"$2>'
    );

    // 6. Convert plain "Note \d+" references to viewer.html links
    formattedText = formattedText.replace(
        /(?<!<a[^>]*>.*?)Note\s+(\d+)(?![^<]*<\/a>)/gi,
        'Note <a href="viewer.html?id=$1">$1</a>'
    );

    return formattedText;
}

/**
 * Extracts note ID from various SAP note URL formats
 * @param {string} url - The URL to extract note ID from
 * @returns {string|null} The note ID or null if not found
 */
function extractNoteId(url) {
    // Match me.sap.com/notes/XXXXXX
    const meMatch = url.match(/me\.sap\.com\/notes\/(\d+)/i);
    if (meMatch) {
        return meMatch[1];
    }

    // Match launchpad.support.sap.com/#/notes/XXXXXX
    const launchpadMatch = url.match(/launchpad\.support\.sap\.com\/#\/notes\/(\d+)/i);
    if (launchpadMatch) {
        return launchpadMatch[1];
    }

    return null;
} 