/**
 * Normalizes date strings to yyyy-mm-dd format
 * @param {string} dateString - Various date formats
 * @returns {string} Date in yyyy-mm-dd format
 */
function normalizeDateFormat(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return dateString;
    }

    // Remove any extra whitespace
    let cleanDate = dateString.trim();

    // Check for dd.mm.yyyy format (European)
    const europeanMatch = cleanDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (europeanMatch) {
        const [, day, month, year] = europeanMatch;
        cleanDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
        // Check for mm/dd/yyyy format (American)
        const americanMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (americanMatch) {
            const [, month, day, year] = americanMatch;
            cleanDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
            // Check for yyyy.mm.dd format
            const dotMatch = cleanDate.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
            if (dotMatch) {
                const [, year, month, day] = dotMatch;
                cleanDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
    }

    // Add "time ago" information to the normalized date
    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const timeAgo = getTimeAgoString(cleanDate);


        cleanDate = `${cleanDate}, ${timeAgo}`;
    }

    return cleanDate;
}

/**
 * Formats date strings to include "time ago" information
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string with time ago information
 */
function getTimeAgoString(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));

    // TODO: i18n
    if (diffDays === 0) {
        return '<span style="color: red">today</span>';
    } else if (diffDays === 1) {
        return '<span style="color: red">yesterday</span>';
    } else if (diffDays < 7) {
        return `<span style="color: orange">${diffDays} days ago</span>`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `<span style="color: #ffa07a">${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago</span>`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `<span style="color: #ffa07a">${months} ${months === 1 ? 'month' : 'months'} ago</span>`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `<span style="color: #ffa07a">${years} ${years === 1 ? 'year' : 'years'} ago</span>`;
    }
}

/**
 * Formats manual activities 
 * @param {string} manualActivities - The manual activities to format
 * @returns {string} Formatted manual activities
 */
function normalizeManualActivities(manualActivities) {
    const html = manualActivities
        .replace(' <code>   <P><br/><br/>', '<code><p>')
        .replace('<br/></P> <br/>  </code> ', '</p></code>');
    return html;
}

/**
 * Formats long text content by converting URLs and note references to proper links
 * @param {string} longText - The HTML content to format
 * @returns {string} Formatted HTML content with proper links
 */
function formatLongText(longText, language) {
    if (!longText || typeof longText !== 'string') {
        return longText;
    }

    let formattedText = longText;

    // Fix some messy data preventing pattern recognition below
    formattedText = formattedText
      .replace(/&nbsp;\<\/(strong|b|i)\>/gi, '</$1> ')
      .replace(/(?:&nbsp;)+(\d{5,7})/gi, ' $1')

    // Convert relative /notes/ URLs to NNN links
    formattedText = formattedText.replace(
        /href=["']\/notes\/(\d+)[^"']*["']/gi,
        `href="${nnnPage}?id=$1&t=${language}"`
    );

    // Convert plain HTTP/HTTPS URLs to links (but not if they're already in <a> tags)
    formattedText = formattedText.replace(
        /(?<!<a[^>]*>.*?)(?<!href=["'])https?:\/\/[^\s<>"]+(?![^<]*<\/a>)/gi,
        (match) => {
            return `<a href="${match}">${match}</a>`;
        }
    );

    // Convert me.sap.com/notes/ links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*me\.sap\.com\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, text) => {
            const noteId = extractNoteId(url);
            if (noteId) {
                return `<a href="${nnnPage}?id=${noteId}&t=${language}">${noteId}</a>`;
            }
            return match;
        }
    );

    // Convert launchpad.support.sap.com/#/notes/ links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*launchpad\.support\.sap\.com\/#\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, text) => {
            const noteId = extractNoteId(url);
            if (noteId) {
                return `<a href="${nnnPage}?id=${noteId}&t=${language}">${noteId}</a>`;
            }
            return match;
        }
    );

    // Convert service.sap.com/sap/support/notes/ links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*service\.sap\.com\/sap\/support\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, text) => {
            const noteId = extractNoteId(url);
            if (noteId) {
                return `<a href="${nnnPage}?id=${noteId}&t=${language}">${noteId}</a>`;
            }
            return match;
        }
    );

    // Add target="_blank" to external links that don't already have it
    formattedText = formattedText.replace(
        /<a([^>]*href=["'][^"']*(?!nnn\.html)[^"']*["'][^>]*)(?!.*target=)([^>]*)>/gi,
        '<a$1 target="_blank"$2>'
    );

    // Convert plain "Note XYZ" references to NNN links
    // TODO: i18n (Japanese, Russian, Chinese)
    formattedText = formattedText.replace(
        /\b(Note|Hinweis|nota|SAP)\s+(\d+)\b/gi,
        (match, text, noteId) => {
            // Check if this is already inside an <a> tag
            const beforeMatch = formattedText.substring(0, formattedText.indexOf(match));
            // Simple check: if there's an unclosed <a> tag before this match
            const openTags = (beforeMatch.match(/<a\b[^>]*>/gi) || []).length;
            const closeTags = (beforeMatch.match(/<\/a>/gi) || []).length;

            if (openTags > closeTags) {
                return match; // Don't modify if already inside a link
            }

            return `${text} <a href="${nnnPage}?id=${noteId}&t=${language}">${noteId}</a>`;
        }
    );

    // Convert plain "Notes XYZ and ABC" references to NNN links
    // TODO: i18n (Japanese, Russian, Chinese)
    formattedText = formattedText.replace(
        /\b(Notes?|Hinweise?|notas?|SAP)\s+(\d+)\s+(and|und|et|e|y)\s+(\d+)\b/gi,
        (match, text, noteId1, textAnd, noteId2) => {
            // Check if this is already inside an <a> tag
            const beforeMatch = formattedText.substring(0, formattedText.indexOf(match));
            // Simple check: if there's an unclosed <a> tag before this match
            const openTags = (beforeMatch.match(/<a\b[^>]*>/gi) || []).length;
            const closeTags = (beforeMatch.match(/<\/a>/gi) || []).length;

            if (openTags > closeTags) {
                return match; // Don't modify if already inside a link
            }

            return `${text} <a href="${nnnPage}?id=${noteId1}&t=${language}">${noteId1}</a> `
              + `${textAnd} <a href="${nnnPage}?id=${noteId2}&t=${language}">${noteId2}</a>`;
        }
    );

    // Convert bold/italic note references to NNN links
    formattedText = formattedText.replace(
        /(Note|Hinweis|nota|SAP)\s+(?:<(?:strong|b|i)>)(\d+)(?:<\/(?:strong|b|i)>)/gi,
        (match, text, noteId) => {
            // Check if this is already inside an <a> tag
            const beforeMatch = formattedText.substring(0, formattedText.indexOf(match));
            // Simple check: if there's an unclosed <a> tag before this match
            const openTags = (beforeMatch.match(/<a\b[^>]*>/gi) || []).length;
            const closeTags = (beforeMatch.match(/<\/a>/gi) || []).length;

            if (openTags > closeTags) {
                return match; // Don't modify if already inside a link
            }

            return `${text} <a href="${nnnPage}?id=${noteId}&t=${language}">${noteId}</a>`;
        }
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

    // Match service.sap.com/sap/support/notes/XXXXXX
    const supportPortalMatch = url.match(/service\.sap\.com\/sap\/support\/notes\/(\d+)/i);
    if (supportPortalMatch) {
        return supportPortalMatch[1];
    }

    return null;
} 