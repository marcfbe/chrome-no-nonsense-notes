document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');

    if (!noteId) {
        const error = new Error('Invalid SAP Note');
        displayError(error);
        return;
    }

    try {
        const note = await fetchSAPNote(noteId);

        // console.log('Fetched note data:', note); // Add for debugging

        // Set breadcrumbs
        const breadcrumbs = domId('breadcrumbs');

        if (note.Header.SAPComponentPath && Array.isArray(note.Header.SAPComponentPath) && note.Header.SAPComponentPath.length > 0) {
            const breadcrumbsList = domCreate('ol', 'breadcrumbs-list');

            note.Header.SAPComponentPath.forEach((pathItem) => {
                const listItem = domCreate('li', 'breadcrumb-item');
                const link = domLink(pathItem._label, pathItem._url);
                domAppend(listItem, link);
                domAppend(breadcrumbsList, listItem);
            });

            domAppend(breadcrumbs, breadcrumbsList);
        }

        if (note.Title && note.Title.value) {
            document.title = note.Title.value.replace(/\.$/, '');
            domTextId('title', document.title);
        }

        if (note.Header) {
            if (note.Header.Type && note.Header.Version) {
                domTextId('type-version', `${note.Header.Type.value}, ${note.Header.Version._label}: ${note.Header.Version.value}`);
            }
            if (note.Header.ReleasedOn && note.Header.ReleasedOn.value) {
                domTextId('date', `${note.Header.ReleasedOn._label}: ${normalizeDateFormat(note.Header.ReleasedOn.value)}`);
            }

            if (note.Header.SAPComponentKey) {
                domTextId('component-label', note.Header.SAPComponentKey._label);
                domTextId('component', note.Header.SAPComponentKey.value);
            }
            if (note.Header.Category) {
                domTextId('category-label', note.Header.Category._label);
                domTextId('category', note.Header.Category.value);
            }
            if (note.Header.Priority) {
                domTextId('priority-label', note.Header.Priority._label);
                domTextId('priority', note.Header.Priority.value);
            }
            if (note.Header.Status) {
                domTextId('status-label', note.Header.Status._label);
                domTextId('status', note.Header.Status.value);
            }

            // Statistics
            const stats = domId('stats');
            const statistics = calculateNoteStats(note);

            if (statistics) {
                const statsItems = domId('stats-items');
                const isKBA = note.Header.Type.value !== 'SAP Note';
                renderStats(statsItems, note, statistics, isKBA);
            } else {
                domHide(stats);
            }
        }

        // Description (HTML content)
        if (note.LongText && note.LongText.value) {
            domId('description').innerHTML = formatLongText(note.LongText.value);
        }

        // Validity (Software Components / Products)
        domTextId('validity-label', note.Validity._label);

        const validity = domId('validity');

        if (hasValues(note.Validity)) {
            const validityItems = domId('validity-items');
            const table = domCreate('table');
            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const columns = getColumns(note.Validity);
            columns.forEach(column => {
                const th = domText('th', column.value);
                if (column.key === 'Product' || column.key === 'SoftwareComponent') {
                    th.style.width = '22em';
                }
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.Validity.Items.forEach(item => {
                const row = domCreate('tr');

                if (item.Product) {
                    const productCell = domText('td', item.Product);
                    domAppend(row, productCell);
                }

                if (item.SoftwareComponent) {
                    const componentCell = domText('td', item.SoftwareComponent);
                    domAppend(row, componentCell);
                }

                if (item.From) {
                    const fromCell = domText('td', item.From);
                    domAppend(row, fromCell);
                }

                if (item.To) {
                    const toCell = domText('td', item.To);
                    domAppend(row, toCell);
                }

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(validityItems, table);
        } else {
            domHide(validity);
        }

        // Corrections
        domTextId('corrections-label', note.CorrectionsInfo.Corrections._label);

        const corrections = domId('corrections');
        const hasCorrections = (hasValues(note.CorrectionInstructions) || hasValues(note.Preconditions) || note.ManualActions.value);

        if (hasCorrections) {
            // Correction Instructions
            domTextId('corrections-instructions-label', note.CorrectionInstructions._label);

            const correctionInstructions = domId('corrections-instructions');

            if (hasValues(note.CorrectionInstructions)) {
                const correctionsInstructionsItems = domId('corrections-instructions-items');
                const table = domCreate('table');
                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const columns = getColumns(note.CorrectionInstructions);
                columns.forEach(column => {
                    const th = domText('th', column.value);
                    domAppend(headerRow, th);
                });

                domAppend(thead, headerRow);
                domAppend(table, thead);

                const tbody = domCreate('tbody');
                note.CorrectionInstructions.Items.forEach(correction => {
                    const row = domCreate('tr');

                    // Software Component
                    const componentCell = domText('td', correction.SoftwareComponent);
                    domAppend(row, componentCell);

                    // Number of Correction Instructions (as link if URL exists)
                    const numberCell = domCreate('td');
                    const link = domLink(correction.NumberOfCorrin + ' (details)', correction.URL);
                    domAppend(numberCell, link);
                    domAppend(row, numberCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(correctionsInstructionsItems, table);
            } else {
                domHide(correctionInstructions);
            }

            // Prerequisites
            domTextId('corrections-prerequisites-label', note.Preconditions._label);

            const prerequisites = domId('corrections-prerequisites');

            if (hasValues(note.Preconditions)) {
                const prerequisitesItems = domId('corrections-prerequisites-items');
                const table = domCreate('table');
                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const columns = getColumns(note.Preconditions);
                columns.forEach(column => {
                    const th = domText('th', column.value);
                    domAppend(headerRow, th);
                });

                domAppend(thead, headerRow);
                domAppend(table, thead);

                const tbody = domCreate('tbody');
                note.Preconditions.Items.forEach(prerequisite => {
                    const row = domCreate('tr');

                    // Software Component
                    const softwareComponentCell = domText('td', prerequisite.SoftwareComponent);
                    softwareComponentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, softwareComponentCell);

                    // From
                    const fromCell = domText('td', prerequisite.ValidFrom);
                    fromCell.style.whiteSpace = 'nowrap';
                    domAppend(row, fromCell);

                    // To
                    const toCell = domText('td', prerequisite.ValidTo);
                    toCell.style.whiteSpace = 'nowrap';
                    domAppend(row, toCell);

                    // Note number (as link if URL exists)
                    const noteCell = domCreate('td');
                    const link = domLink(prerequisite.Number, prerequisite.Number);
                    domAppend(noteCell, link);
                    noteCell.style.whiteSpace = 'nowrap';
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domText('td', prerequisite.Component);
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link if URL exists)
                    const titleCell = domCreate('td');
                    if (prerequisite.URL) {
                        const link = domLink(prerequisite.Title, prerequisite.URL);
                        domAppend(titleCell, link);
                    }
                    domAppend(row, titleCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(prerequisitesItems, table);
            } else {
                domHide(prerequisites);
            }

            // Manual Activities
            domTextId('corrections-manual-activities-label', note.ManualActions._label);

            const manualActivities = domId('corrections-manual-activities');

            if (note.ManualActions.value) {
                const manual = domId('corrections-manual-activities-items');
                manual.innerHTML = normalizeManualActivities(note.ManualActions.value);
            } else {
                domHide(manualActivities);
            }

        } else {
            domHide(corrections);
        }

        // Support packages
        domTextId('support-packages-label', note.SupportPackage._label);

        const supportPackages = domId('support-packages');

        if (hasValues(note.SupportPackage)) {
            const supportPackagesItems = domId('support-packages-items');
            const table = domCreate('table');
            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const columns = getColumns(note.SupportPackage);
            columns.forEach(column => {
                const th = domText('th', column.value);
                if (column.key === 'SoftwareComponentVersion') {
                    th.style.width = '24em';
                }
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.SupportPackage.Items.forEach(supportPackage => {
                const row = domCreate('tr');

                // Software Component Version
                const componentVersionCell = domText('td', supportPackage.SoftwareComponentVersion);
                domAppend(row, componentVersionCell);

                // Support Package (as link if URL exists)
                const supportPackageCell = domText('td');
                const link = domLink(supportPackage.SupportPackage, supportPackage.URL);
                domAppend(supportPackageCell, link);
                domAppend(row, supportPackageCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(supportPackagesItems, table);
        } else {
            domHide(supportPackages);
        }

        // Support package patches
        domTextId('support-package-patches-label', note.SupportPackagePatch._label);

        const supportPackagePatches = domId('support-package-patches');

        if (hasValues(note.SupportPackagePatch)) {
            const supportPackagePatchesItems = domId('support-package-patches-items');
            const table = domCreate('table');
            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const columns = getColumns(note.SupportPackagePatch);
            columns.forEach(column => {
                const th = domText('th', column.value);
                if (column.key === 'SoftwareComponentVersion') {
                    th.style.width = '24em';
                }
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.SupportPackagePatch.Items.forEach(patch => {
                const row = domCreate('tr');

                // Software Component Version
                const componentVersionCell = domText('td', patch.SoftwareComponentVersion);
                domAppend(row, componentVersionCell);

                // Support Package
                const supportPackageCell = domText('td', patch.SupportPackage);
                domAppend(row, supportPackageCell);

                // Support Package Patch (as link if URL exists)
                const patchCell = domCreate('td');
                const link = domLink('Download', patch.URL);
                domAppend(patchCell, link);
                domAppend(row, patchCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(supportPackagePatchesItems, table);
        } else {
            domHide(supportPackagePatches);
        }

        // References
        domTextId('references-label', note.References._label);

        const references = domId('references');
        const hasReferences = (hasValues(note.References.RefTo) || hasValues(note.References.RefBy));

        if (hasReferences) {
            // "Reference to"
            domTextId('references-ref-to-label', note.References.RefTo._label);

            const refTo = domId('references-ref-to');

            if (hasValues(note.References.RefTo)) {
                const refToItems = domId('references-ref-to-items');
                const table = domCreate('table');
                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const columns = getColumns(note.References.RefTo);
                columns.forEach(column => {
                    const th = domText('th', column.value);
                    if (column.key === 'RefNumber') {
                        th.style.whiteSpace = 'nowrap';
                        th.style.width = '8em';
                    } else if (column.key === 'RefComponent') {
                        th.style.whiteSpace = 'nowrap';
                        th.style.width = '14em';
                    }
                    domAppend(headerRow, th);
                });

                domAppend(thead, headerRow);
                domAppend(table, thead);

                const tbody = domCreate('tbody');
                note.References.RefTo.Items.forEach(ref => {
                    const row = domCreate('tr');

                    // Note number
                    const noteCell = domCreate('td');
                    const noteLink = domLink(ref.RefNumber, ref.RefNumber);
                    domAppend(noteCell, noteLink);
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domText('td', ref.RefComponent);
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link)
                    const titleCell = domCreate('td');
                    const titleLink = domLink(ref.RefTitle, ref.RefUrl);
                    domAppend(titleCell, titleLink);
                    domAppend(row, titleCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(refToItems, table);
            } else {
                domHide(refTo);
            }

            // "Referenced by"
            domTextId('references-ref-by-label', note.References.RefBy._label);

            const refBy = domId('references-ref-by');

            if (hasValues(note.References.RefBy)) {
                const refByItems = domId('references-ref-by-items');

                const table = domCreate('table');
                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const columns = getColumns(note.References.RefBy);
                columns.forEach(column => {
                    const th = domText('th', column.value);
                    if (column.key === 'RefNumber') {
                        th.style.whiteSpace = 'nowrap';
                        th.style.width = '8em';
                    } else if (column.key === 'RefComponent') {
                        th.style.whiteSpace = 'nowrap';
                        th.style.width = '14em';
                    }
                    domAppend(headerRow, th);
                });

                domAppend(thead, headerRow);
                domAppend(table, thead);

                const tbody = domCreate('tbody');
                note.References.RefBy.Items.forEach(ref => {
                    const row = domCreate('tr');

                    // Note number
                    const noteCell = domCreate('td');
                    const noteLink = domLink(ref.RefNumber, ref.RefNumber);
                    domAppend(noteCell, noteLink);
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domText('td', ref.RefComponent);
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link)
                    const titleCell = domCreate('td');
                    const titleLink = domLink(ref.RefTitle, ref.RefUrl);
                    domAppend(titleCell, titleLink);
                    domAppend(row, titleCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(refByItems, table);
            } else {
                domHide(refBy);
            }
        } else {
            domHide(references);
        }

        // Attachments
        domTextId('attachments-label', note.Attachments._label);

        const attachments = domId('attachments');

        if (hasValues(note.Attachments)) {
            const attachmentsItems = domId('attachments-items');
            const table = domCreate('table');

            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const columns = getColumns(note.Attachments);
            columns.forEach(column => {
                const th = domText('th', column.value);
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.Attachments.Items.forEach(attachment => {
                const row = domCreate('tr');

                // File Name (as link)
                const fileNameCell = domCreate('td');
                const link = domLink(attachment.FileName, attachment.URL);
                domAppend(fileNameCell, link);
                domAppend(row, fileNameCell);

                // File Size
                const fileSizeCell = domText('td', attachment.FileSize + ' KB');
                domAppend(row, fileSizeCell);

                // MIME Type
                const mimeTypeCell = domText('td', attachment.MimeType);
                domAppend(row, mimeTypeCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(attachmentsItems, table);
        } else {
            domHide(attachments);
        }

        // Attributes
        domTextId('attributes-label', note.Attributes._label);

        const attributes = domId('attributes');

        if (hasValues(note.Attributes)) {
            const attributesItems = domId('attributes-items');
            const table = domCreate('table');

            note.Attributes.Items.forEach(attr => {
                const row = domCreate('tr');

                const keyCell = domText('td', attr.Key);
                keyCell.style.fontWeight = 'bold';
                keyCell.style.whiteSpace = 'nowrap';
                domAppend(row, keyCell);

                const valueCell = domCreate('td');
                valueCell.textContent = attr.Value;
                domAppend(row, valueCell);

                domAppend(table, row);
            });

            domAppend(attributesItems, table);
        } else {
            domHide(attributes);
        }

        // Show the content after everything is loaded
        domId('content').classList.add('loaded');
        domId('content-wide').classList.add('loaded');

    } catch (error) {
        // console.error('Error details:', error); // Add for debugging
        displayError(error, noteId);
    }
});

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

    const noteContent = domId('content');
    const leftColumn = noteContent.querySelector('.left-column');
    if (leftColumn) {
        domAppend(leftColumn, errorDisclaimer);
    }

    [
        noteContent.querySelector('.right-column'),
        domId('type-version'),
        domId('date'),
        domId('content-wide')
    ].forEach(domHide);

    noteContent.classList.add('loaded');
}

// Scroll to top functionality
document.addEventListener('DOMContentLoaded', () => {
    const scrollToTopBtn = domId('scrollToTop');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top when button is clicked
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

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

    const totalCount = stats.corrections + stats.manualActivities + stats.prerequisites + stats.attachments;
    if (totalCount === 0) {
        return null;
    } else {
        return stats;
    }
}

function renderStats(container, note, stats, isKBA = false) {
    const statsGrid = domCreate('div', 'stats-grid');

    const statItems = isKBA ? [
        { label: note.Attachments._label, value: stats.attachments, highlight: stats.attachments > 0, state: stats.attachmentsState }
    ] : [
        { label: note.CorrectionsInfo.Corrections._label, value: stats.corrections, highlight: stats.corrections > 0, state: stats.correctionsState },
        { label: note.CorrectionsInfo.ManualActivities._label, value: stats.manualActivities, highlight: stats.manualActivities > 0, state: stats.manualActivitiesState },
        { label: note.CorrectionsInfo.Prerequisites._label, value: stats.prerequisites, highlight: stats.prerequisites > 0, state: stats.prerequisitesState },
        { label: note.Attachments._label, value: stats.attachments, highlight: stats.attachments > 0, state: stats.attachmentsState }
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

    domAppend(container, statsGrid);
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