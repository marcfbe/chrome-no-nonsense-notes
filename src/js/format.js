/**
 * Normalizes date strings to yyyy-mm-dd format
 * @param {string} dateString - Various date formats
 * @returns {string} Date in yyyy-mm-dd format
 */
function normalizeDateFormat(dateString, language) {
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
        const timeAgo = getTimeAgoString(cleanDate, language);

        cleanDate = `${cleanDate}, ${timeAgo}`;
    }

    return cleanDate;
}

/**
 * Gets the correct plural form for Russian
 */
function getRussianPlural(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
        return one;
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return few;
    } else {
        return many;
    }
}

/**
 * Formats date strings to include "time ago" information
 * @param {string} dateString - The date string to format
 * @param {string} language - The language code (D, E, P, S, F, I, J, R, 1, 3)
 * @returns {string} Formatted date string with time ago information
 */
function getTimeAgoString(dateString, language) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));

    // Default to English if language not found
    const lang = language || 'E';
    const t = timeAgoTranslations[lang] || timeAgoTranslations['E'];

    if (diffDays === 0) {
        return `<span style="color: red">${t.today}</span>`;
    } else if (diffDays === 1) {
        return `<span style="color: red">${t.yesterday}</span>`;
    } else if (diffDays < 7) {
        if (lang === 'R') {
            const dayWord = getRussianPlural(diffDays, t.day, t.days, t.daysMany);
            return `<span style="color: orange">${diffDays} ${dayWord} ${t.ago}</span>`;
        } else if (lang === 'J' || lang === '1' || lang === '3') {
            return `<span style="color: orange">${diffDays}${t.days}</span>`;
        } else {
            const dayWord = diffDays === 1 ? t.day : t.days;
            return `<span style="color: orange">${diffDays} ${dayWord} ${t.ago}</span>`;
        }
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        if (lang === 'R') {
            const weekWord = getRussianPlural(weeks, t.week, t.weeks, t.weeksMany);
            return `<span style="color: #ffa07a">${weeks} ${weekWord} ${t.ago}</span>`;
        } else if (lang === 'J' || lang === '1' || lang === '3') {
            return `<span style="color: #ffa07a">${weeks}${t.weeks}</span>`;
        } else {
            const weekWord = weeks === 1 ? t.week : t.weeks;
            return `<span style="color: #ffa07a">${weeks} ${weekWord} ${t.ago}</span>`;
        }
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        if (lang === 'R') {
            const monthWord = getRussianPlural(months, t.month, t.months, t.monthsMany);
            return `<span>${months} ${monthWord} ${t.ago}</span>`;
        } else if (lang === 'J' || lang === '1' || lang === '3') {
            return `<span>${months}${t.months}</span>`;
        } else {
            const monthWord = months === 1 ? t.month : t.months;
            return `<span>${months} ${monthWord} ${t.ago}</span>`;
        }
    } else {
        const years = Math.floor(diffDays / 365);
        if (lang === 'R') {
            const yearWord = getRussianPlural(years, t.year, t.years, t.yearsMany);
            return `<span>${years} ${yearWord} ${t.ago}</span>`;
        } else if (lang === 'J' || lang === '1' || lang === '3') {
            return `<span>${years}${t.years}</span>`;
        } else {
            const yearWord = years === 1 ? t.year : t.years;
            return `<span>${years} ${yearWord} ${t.ago}</span>`;
        }
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
 * Converts a URL match to an NNN link if it contains a valid note ID
 * @param {string} match - The original match string
 * @param {string} url - The URL to extract note ID from
 * @param {string} language - The language code for the NNN link
 * @returns {string} Formatted NNN link or original match
 */
function convertUrlToNnnLink(match, url, language) {
    const noteId = extractNoteId(url);
    if (noteId && /^\d+$/.test(noteId)) {
        return `<a href="${nnnPage}?id=${noteId}&t=${language}">${noteId}</a>`;
    }
    return match;
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

    // Convert relative /notes/XYZ/LANGUAGE URLs to NNN links
    formattedText = formattedText.replace(
        /href=["']\/notes\/(\d+)\/([A-Z0-9])["']/gi,
        `href="${nnnPage}?id=$1&t=$2"`
    );

    // Convert relative /notes/XYZ URLs to NNN links
    formattedText = formattedText.replace(
        /href=["']\/notes\/(\d+)[^"']*["']/gi,
        `href="${nnnPage}?id=$1&t=${language}"`
    );

    // Convert plain HTTP/HTTPS URLs to links (but not if they're already in <a> tags or src attributes)
    formattedText = formattedText.replace(
        /(?<!<a[^>]*>.*?)(?<!(?:href|src)=["'])https?:\/\/[^\s<>"]+(?![^<]*<\/a>)/gi,
        (match) => {
            return `<a href="${match}">${match}</a>`;
        }
    );

    // Convert me.sap.com/notes/ links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*me\.sap\.com\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, _text) => convertUrlToNnnLink(match, url, language)
    );

    // Convert launchpad.support.sap.com/#/notes/ links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*launchpad\.support\.sap\.com\/#\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, _text) => convertUrlToNnnLink(match, url, language)
    );

    // Convert service.sap.com/sap/support/notes/ links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["']([^"']*service\.sap\.com\/sap\/support\/notes\/[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
        (match, url, _text) => convertUrlToNnnLink(match, url, language)
    );

    // Convert SAP internal i7p.wdf.sap.corp links to NNN
    formattedText = formattedText.replace(
        /<a[^>]*href=["'][^"']*i7p\.wdf\.sap\.corp\/.*\/entry\.htm[^"']*["'][^>]*>([^<]*)<\/a>/gi,
        (match, text) => convertUrlToNnnLink(match, `me.sap.com/notes/${text}`, language)
    );

    // Add target="_blank" to external links that don't already have it
    formattedText = formattedText.replace(
        /<a([^>]*href=["'][^"']*(?!nnn\.html)[^"']*["'][^>]*)(?!.*target=)([^>]*)>/gi,
        '<a$1 target="_blank"$2>'
    );

    // Convert plain "Note XYZ" references to NNN links
    formattedText = formattedText.replace(
        /\b(Note|Hinweis|nota|SAP|ノート|注意|注意事項|注記)\s+(\d+)\b/gi,
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
    formattedText = formattedText.replace(
        /\b(Notes?|Hinweise?|notas?|SAP|ノート|注意|注意事項|注記)\s+(\d+)\s+(and|und|et|e|y)\s+(\d+)\b/gi,
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

    // Convert CVSS to https://www.first.org/cvss/calculator/3-0#
    formattedText = formattedText.replace(
        /CVSS:\d+\.\d+\/[A-Z0-9\/:]+/gi,
        (match) => {
            return `<a href="https://www.first.org/cvss/calculator/3-0#${match}">${match}</a>`;
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
