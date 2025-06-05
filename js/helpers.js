function displayError(error, noteId = '') {
    // Update title to show error
    document.title = `Error - SAP Note ${noteId}`;
    domTextId('title', `Error loading SAP Note ${noteId}`);

    const errorDisclaimer = domCreate('div');
    errorDisclaimer.id = 'DISCLAIMER';

    const errorTitle = domText('strong', error.code ? error.code + ': ' : '');
    const errorMessage = domText('div', error.message);

    domAppend(errorDisclaimer, errorTitle);
    domAppend(errorDisclaimer, errorMessage);

    // Add for debugging
    if (error.code && (error.code < 400 || error.code >= 500)) {
        const errorStack = domText('div', error.stack);
        domAppend(errorDisclaimer, errorStack);
    }

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

function calculateNoteStats(note) {
    const stats = {};

    if (note.CorrectionsInfo) {
        stats.corrections = note.CorrectionsInfo.Corrections?.value || 0;
        stats.correctionsState = note.CorrectionsInfo.Corrections?.state || 'None';

        stats.manualActivities = note.CorrectionsInfo.ManualActivities?.value || 0;
        stats.manualActivitiesState = note.CorrectionsInfo.ManualActivities?.state || 'None';

        stats.prerequisites = note.CorrectionsInfo.Prerequisites?.value || 0;
        stats.prerequisitesState = note.CorrectionsInfo.Prerequisites?.state || 'None';
    } else {
        // Fallback to counting items if CorrectionsInfo is not available
        stats.corrections = note.CorrectionInstructions?.Items?.length || 0;
        stats.correctionsState = 'None';

        stats.manualActivities = note.manualActivities?.Items?.length || 0;
        stats.manualActivitiesState = 'None';

        stats.prerequisites = note.Preconditions?.Items?.length || 0;
        stats.prerequisitesState = 'None';
    }

    stats.attachments = note.Attachments?.Items?.length || 0;
    stats.attachmentsState = 'None';

    stats.totalCount = stats.corrections + stats.manualActivities + stats.prerequisites + stats.attachments;

    return stats;
}

function renderStats(note, stats) {
    const statsItems = domId('stats-items');
    const statsGrid = domCreate('div', 'stats-grid');

    const statItems = (note.Header.Type.value === 'SAP Knowledge Base Article') ? [
        { label: note.Attachments?._label || 'Attachments', value: stats.attachments, highlight: stats.attachments > 0, state: stats.attachmentsState }
    ] : [
        { label: note.CorrectionsInfo.Corrections?._label || 'Corrections', value: stats.corrections, highlight: stats.corrections > 0, state: stats.correctionsState },
        { label: note.CorrectionsInfo.ManualActivities?._label || 'Manual Activities', value: stats.manualActivities, highlight: stats.manualActivities > 0, state: stats.manualActivitiesState },
        { label: note.CorrectionsInfo.Prerequisites?._label || 'Prerequisites', value: stats.prerequisites, highlight: stats.prerequisites > 0, state: stats.prerequisitesState },
        { label: note.Attachments?._label || 'Attachments', value: stats.attachments, highlight: stats.attachments > 0, state: stats.attachmentsState }
    ];

    statItems.forEach(item => {
        if (item.value > 0) {
            const statItem = domCreate('div', 'stat-item');

            if (item.state) {
                statItem.classList.add(`state-${item.state.toLowerCase()}`);
            }

            const label = domCreate('div', 'stat-label');
            label.textContent = item.label;

            const value = domCreate('div', 'stat-value');
            if (item.highlight) {
                value.classList.add('highlight');
            }
            value.textContent = item.value;

            domAppend(statItem, label);
            domAppend(statItem, value);
            domAppend(statsGrid, statItem);
        }
    });

    domAppend(statsItems, statsGrid);
}

/**
 * Get the language from the note header
 * Workaround for bug in SAP Note API where the language field is not correct for machine translations
 * @param {Object} note - The note object
 * @returns {string} The language code
 */
function getLanguageFromHeader(note) {
    if (note._machineTranslationLanguage === '' || note._machineTranslationLanguage === note._loadedLanguage) {
        return note.Header.Language.value;
    } else {
        switch (note._machineTranslationLanguage) {
            case 'E':
                return 'English';
            case 'F':
                return 'Français';
            case 'D':
                return 'Deutsch';
            case 'I':
                return 'Italiano';
            case 'J':
                return '日本語';
            case 'P':
                return 'Português';
            case 'R':
                return 'Русский';
            case 'S':
                return 'Español';
            case '1':
                return '中文';
            case '3':
                return '한국어';
            default:
                return note.Header.Language.value;
        }
    }
}