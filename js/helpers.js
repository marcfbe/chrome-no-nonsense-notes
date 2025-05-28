function displayError(error, noteId = '') {
    // Update title to show error
    document.title = `Error - SAP Note ${noteId}`;
    domTextId('title', `Error loading SAP Note ${noteId}`);

    const errorDisclaimer = domCreate('div');
    errorDisclaimer.id = 'DISCLAIMER';

    const errorTitle = domText('strong', error.code ? error.code + ': ' : '');
    const errorMessage = domText('span', error.message);

    domAppend(errorDisclaimer, errorTitle);
    domAppend(errorDisclaimer, errorMessage);

    // Add for debugging
    const errorStack = domText('div', error.stack);
    domAppend(errorDisclaimer, errorStack);

    [
        domId('type-version'),
        domId('date'),
        domId('left-column'),
        domId('right-column'),
        domId('content-wide')
    ].forEach(domHide);

    const errorBanner = domId('error-banner');
    domAppend(errorBanner, errorDisclaimer);
}

function hasValues(sectionData) {
    return (sectionData && sectionData.Items && sectionData.Items.length > 0)
}

function getColumns(sectionData) {
    if (sectionData && sectionData._columnNames && typeof sectionData._columnNames === 'object') {
        // Skip columns with URLs
        return Object.entries(sectionData._columnNames)
            .filter(([key]) => key !== 'URL' && key !== 'RefUrl')
            .map(([key, value]) => ({
                key: key,
                value: value
            }));
    }
    return [];
}

