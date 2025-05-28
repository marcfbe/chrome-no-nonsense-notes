document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');

    if (!noteId) {
        const error = new Error('Invalid SAP Note');
        displayErrorDisclaimer(error);
        return;
    }

    try {
        const note = await fetchSAPNote(noteId);
        
        // console.log('Fetched note data:', note); // Add debugging

        // Set breadcrumbs
        const breadcrumbsDiv = domId('breadcrumbs');
        if (note.Header && note.Header.SAPComponentPath && note.Header.SAPComponentPath.length > 0) {
            const breadcrumbsList = domCreate('ol', 'breadcrumbs-list');

            note.Header.SAPComponentPath.forEach((pathItem, index) => {
                const listItem = domCreate('li', 'breadcrumb-item');

                if (pathItem._url) {
                    const link = domCreate('a');
                    link.href = `https://me.sap.com${pathItem._url}`;
                    link.textContent = pathItem._label;
                    link.target = '_blank';
                    domAppend(listItem, link);
                } else {
                    listItem.textContent = pathItem._label;
                }

                domAppend(breadcrumbsList, listItem);
            });

            domAppend(breadcrumbsDiv, breadcrumbsList);
        }

        if (note.Title && note.Title.value) {
            document.title = note.Title.value.replace(/\.$/, '');
            domId('note-title').textContent = document.title;
        }
        
        if (note.Header) {
            if (note.Header.Type && note.Header.Version) {
                domId('note-type-version').textContent = `${note.Header.Type.value}, Version: ${note.Header.Version.value}`;
            }
            if (note.Header.ReleasedOn && note.Header.ReleasedOn.value) {
                domId('note-date').textContent = `Released: ${normalizeDateFormat(note.Header.ReleasedOn.value)}`;
            }
            
            if (note.Header.SAPComponentKey) {
                domId('note-component').textContent = note.Header.SAPComponentKey.value || '';
            }
            if (note.Header.Category) {
                domId('note-category').textContent = note.Header.Category.value || '';
            }
            if (note.Header.Priority) {
                domId('note-priority').textContent = note.Header.Priority.value || '';
            }
            if (note.Header.Status) {
                domId('note-status').textContent = note.Header.Status.value || '';
            }

            // Stats
            const statsDiv = domId('note-stats');
            const stats = calculateNoteStats(note);

            if (stats.size > 0) {
                const isKBA = note.Header.Type.value !== 'SAP Note';
                renderStats(statsDiv, stats, isKBA);
            } else {
                statsDiv.style.display = 'none';
            }
        }

        // Description (HTML content)
        if (note.LongText && note.LongText.value) {
            domId('note-description').innerHTML = formatLongText(note.LongText.value);
        }

        // Software components
        const softwareComponentsDiv = domId('note-software-components');
        const softwareComponentsSection = domId('note-software-components-all');

        if (note.Validity && note.Validity.Items && note.Validity.Items.length > 0) {
            const table = domCreate('table', 'software-components-table');

            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const headers = ['Software Component', 'From', 'To'];
            headers.forEach(headerText => {
                const th = domCreate('th');
                th.textContent = headerText;
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.Validity.Items.forEach(component => {
                const row = domCreate('tr');

                // Software Component
                const componentCell = domCreate('td');
                componentCell.textContent = component.SoftwareComponent;
                domAppend(row, componentCell);

                // From
                const fromCell = domCreate('td');
                fromCell.textContent = component.From;
                domAppend(row, fromCell);

                // To
                const toCell = domCreate('td');
                toCell.textContent = component.To;
                domAppend(row, toCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(softwareComponentsDiv, table);
        } else {
            softwareComponentsSection.style.display = 'none';
        }

        // Corrections
        const correctionsDiv = domId('note-corrections');
        const correctionsSection = domId('note-corrections-all');
        const hasCorrections = note.CorrectionInstructions && note.CorrectionInstructions.Items && note.CorrectionInstructions.Items.length > 0;
        const hasPrerequisites = note.Preconditions && note.Preconditions.Items && note.Preconditions.Items.length > 0;
        
        if (hasCorrections || hasPrerequisites) {
            // Correction Instructions
            if (hasCorrections) {
                const heading = domCreate('h4');
                heading.textContent = 'Correction instructions';
                domAppend(correctionsDiv, heading);

                const table = domCreate('table', 'corrections-table');

                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const headers = ['Software Component', 'Number of Correction Instructions'];
                headers.forEach(headerText => {
                    const th = domCreate('th');
                    th.textContent = headerText;
                    domAppend(headerRow, th);
                });

                domAppend(thead, headerRow);
                domAppend(table, thead);

                const tbody = domCreate('tbody');
                note.CorrectionInstructions.Items.forEach(correction => {
                    const row = domCreate('tr');

                    // Software Component
                    const componentCell = domCreate('td');
                    componentCell.textContent = correction.SoftwareComponent;
                    domAppend(row, componentCell);

                    // Number of Correction Instructions (as link if URL exists)
                    const numberCell = domCreate('td');
                    if (correction.URL) {
                        const link = domCreate('a');
                        link.href = `https://me.sap.com${correction.URL}`;
                        link.textContent = correction.NumberOfCorrin;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        domAppend(numberCell, link);
                    } else {
                        numberCell.textContent = correction.NumberOfCorrin;
                    }
                    domAppend(row, numberCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(correctionsDiv, table);
            }

            // Prerequisites
            if (hasPrerequisites) {
                const heading = domCreate('h4');
                heading.textContent = 'Prerequisites';
                domAppend(correctionsDiv, heading);

                const table = domCreate('table', 'prerequisites-table');

                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const headers = ['Software Component', 'From', 'To', 'SAP Note/KBA', 'Component', 'Title'];
                headers.forEach(headerText => {
                    const th = domCreate('th');
                    th.textContent = headerText;
                    th.style.whiteSpace = 'nowrap';
                    domAppend(headerRow, th);
                });

                domAppend(thead, headerRow);
                domAppend(table, thead);

                const tbody = domCreate('tbody');
                note.Preconditions.Items.forEach(prerequisite => {
                    const row = domCreate('tr');

                    // Software Component
                    const softwareComponentCell = domCreate('td');
                    softwareComponentCell.textContent = prerequisite.SoftwareComponent;
                    softwareComponentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, softwareComponentCell);

                    // From
                    const fromCell = domCreate('td');
                    fromCell.textContent = prerequisite.ValidFrom;
                    fromCell.style.whiteSpace = 'nowrap';
                    domAppend(row, fromCell);

                    // To
                    const toCell = domCreate('td');
                    toCell.textContent = prerequisite.ValidTo;
                    toCell.style.whiteSpace = 'nowrap';
                    domAppend(row, toCell);

                    // Note number (as link if URL exists)
                    const noteCell = domCreate('td');
                    if (prerequisite.URL) {
                        const link = domCreate('a');
                        link.href = `viewer.html?id=${prerequisite.Number.trim()}`;
                        link.textContent = prerequisite.Number;
                        domAppend(noteCell, link);
                    } else {
                        noteCell.textContent = prerequisite.Number;
                    }
                    noteCell.style.whiteSpace = 'nowrap';
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domCreate('td');
                    componentCell.textContent = prerequisite.Component;
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link if URL exists)
                    const titleCell = domCreate('td');
                    if (prerequisite.URL) {
                        const link = domCreate('a');
                        link.href = `viewer.html?id=${prerequisite.Number.trim()}`;
                        link.textContent = prerequisite.Title;
                        domAppend(titleCell, link);
                    } else {
                        titleCell.textContent = prerequisite.Title;
                    }
                    domAppend(row, titleCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(correctionsDiv, table);
            }
        } else {
            correctionsSection.style.display = 'none';
        }

        // Support packages
        const supportPackagesDiv = domId('note-support-packages');
        const supportPackagesSection = domId('note-support-packages-all');

        if (note.SupportPackage && note.SupportPackage.Items && note.SupportPackage.Items.length > 0) {
            const table = domCreate('table', 'support-packages-table');

            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const headers = ['Software Component Version', 'Support Package'];
            headers.forEach(headerText => {
                const th = domCreate('th');
                th.textContent = headerText;
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.SupportPackage.Items.forEach(supportPackage => {
                const row = domCreate('tr');

                // Software Component Version
                const componentVersionCell = domCreate('td');
                componentVersionCell.textContent = supportPackage.SoftwareComponentVersion;
                domAppend(row, componentVersionCell);

                // Support Package (as link if URL exists)
                const supportPackageCell = domCreate('td');
                if (supportPackage.URL) {
                    const link = domCreate('a');
                    link.href = `https://me.sap.com${supportPackage.URL}`;
                    link.textContent = supportPackage.SupportPackage;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    domAppend(supportPackageCell, link);
                } else {
                    supportPackageCell.textContent = supportPackage.SupportPackage;
                }
                domAppend(row, supportPackageCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(supportPackagesDiv, table);
        } else {
            supportPackagesSection.style.display = 'none';
        }

        // References
        const referencesDiv = domId('note-references');
        const referencesSection = domId('note-references-all');
        const hasReferences = (note.References.RefTo.Items.length > 0 || note.References.RefBy.Items.length > 0);

        if (hasReferences) {
            // "Reference to"
            if (note.References.RefTo.Items.length > 0) {
                const subtitle = domCreate('h4');
                subtitle.textContent = 'This document refers to';
                domAppend(referencesDiv, subtitle);

                const table = domCreate('table', 'references-table');

                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const headers = ['SAP Note/KBA', 'Component', 'Title'];
                headers.forEach(headerText => {
                    const th = domCreate('th');
                    th.textContent = headerText;
                    th.style.whiteSpace = 'nowrap';
                    if (headerText === 'SAP Note/KBA') {
                        th.style.width = '8em';
                    } else if (headerText === 'Component') {
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
                    const noteLink = domCreate('a');
                    noteLink.href = `viewer.html?id=${ref.RefNumber}`;
                    noteLink.textContent = ref.RefNumber;
                    noteCell.style.whiteSpace = 'nowrap';
                    domAppend(noteCell, noteLink);
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domCreate('td');
                    componentCell.textContent = ref.RefComponent;
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link)
                    const titleCell = domCreate('td');
                    const link = domCreate('a');
                    link.href = `viewer.html?id=${ref.RefNumber}`;
                    link.textContent = ref.RefTitle;
                    domAppend(titleCell, link);
                    domAppend(row, titleCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(referencesDiv, table);
            }

            // "Referenced by"
            if (note.References.RefBy.Items.length > 0) {
                const subtitle = domCreate('h4');
                subtitle.textContent = 'This document is referenced by';
                domAppend(referencesDiv, subtitle);

                const table = domCreate('table', 'references-table');

                const thead = domCreate('thead');
                const headerRow = domCreate('tr');

                const headers = ['SAP Note/KBA', 'Component', 'Title'];
                headers.forEach(headerText => {
                    const th = domCreate('th');
                    th.textContent = headerText;
                    th.style.whiteSpace = 'nowrap';
                    if (headerText === 'SAP Note/KBA') {
                        th.style.width = '8em';
                    } else if (headerText === 'Component') {
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
                    const noteLink = domCreate('a');
                    noteLink.href = `viewer.html?id=${ref.RefNumber}`;
                    noteLink.textContent = ref.RefNumber;
                    noteCell.style.whiteSpace = 'nowrap';
                    domAppend(noteCell, noteLink);
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domCreate('td');
                    componentCell.textContent = ref.RefComponent;
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link)
                    const titleCell = domCreate('td');
                    const link = domCreate('a');
                    link.href = `viewer.html?id=${ref.RefNumber}`;
                    link.textContent = ref.RefTitle;
                    domAppend(titleCell, link);
                    domAppend(row, titleCell);

                    domAppend(tbody, row);
                });

                domAppend(table, tbody);
                domAppend(referencesDiv, table);
            }
        } else {
            referencesSection.style.display = 'none';
        }

        // Attachments
        const attachmentsDiv = domId('note-attachments');
        const attachmentsSection = domId('note-attachments-all');

        if (note.Attachments && note.Attachments.Items && note.Attachments.Items.length > 0) {
            const table = domCreate('table', 'attachments-table');

            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const headers = ['File Name', 'File Size (KB)', 'Type'];
            headers.forEach(headerText => {
                const th = domCreate('th');
                th.textContent = headerText;
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.Attachments.Items.forEach(attachment => {
                const row = domCreate('tr');

                // File Name (as link)
                const fileNameCell = domCreate('td');
                const link = domCreate('a');
                link.href = attachment.URL;
                link.textContent = attachment.FileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                domAppend(fileNameCell, link);
                domAppend(row, fileNameCell);

                // File Size
                const fileSizeCell = domCreate('td');
                fileSizeCell.textContent = attachment.FileSize;
                fileSizeCell.style.textAlign = 'right';
                domAppend(row, fileSizeCell);

                // MIME Type
                const mimeTypeCell = domCreate('td');
                mimeTypeCell.textContent = attachment.MimeType;
                domAppend(row, mimeTypeCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(attachmentsDiv, table);
        } else {
            attachmentsSection.style.display = 'none';
        }

        // Attributes
        const attributesDiv = domId('note-attributes');
        const attributesSection = domId('note-attributes-all');

        if (note.Attributes && note.Attributes.Items && note.Attributes.Items.length > 0) {
            const table = domCreate('table', 'attributes-table');

            note.Attributes.Items.forEach(attr => {
                const row = domCreate('tr');

                const keyCell = domCreate('td');
                keyCell.textContent = attr.Key;
                keyCell.style.fontWeight = 'bold';
                keyCell.style.whiteSpace = 'nowrap';
                domAppend(row, keyCell);

                const valueCell = domCreate('td');
                valueCell.textContent = attr.Value;
                domAppend(row, valueCell);

                domAppend(table, row);
            });

            domAppend(attributesDiv, table);
        } else {
            attributesSection.style.display = 'none';
        }

        // Show the content after everything is loaded
        const noteContent = domId('note-content');
        const noteContentWide = domId('note-content-wide');

        if (noteContent) {
            noteContent.classList.add('loaded');
        }
        if (noteContentWide) {
            noteContentWide.classList.add('loaded');
        }

    } catch (error) {
        // console.error('Error details:', error); // Add debugging
        displayErrorDisclaimer(error, noteId);
    }
});

function displayErrorDisclaimer(error, noteId = '') {
    // Update title to show error
    document.title = `Error - SAP Note ${noteId}`;
    domId('note-title').textContent = `Error Loading SAP Note ${noteId}`;

    const errorDisclaimer = domCreate('div');
    errorDisclaimer.id = 'DISCLAIMER';

    const errorTitle = domCreate('strong');
    errorTitle.textContent = error.code ? error.code + ': ' : '';

    const errorMessage = domCreate('span');
    errorMessage.textContent = error.message;

    domAppend(errorDisclaimer, errorTitle);
    domAppend(errorDisclaimer, errorMessage);

    const noteContent = domId('note-content');
    const leftColumn = noteContent.querySelector('.left-column');
    if (leftColumn) {
        domAppend(leftColumn, errorDisclaimer);
    }

    const sections = [
        noteContent.querySelector('.right-column'),
        domId('note-type-version'),
        domId('note-date'),
        domId('note-content-wide')
    ];
    sections.forEach(section => {
        if (section) {
            section.style.display = 'none';
        }
    });

    if (noteContent) {
        noteContent.classList.add('loaded');
    }
}

// Scroll to top functionality
document.addEventListener('DOMContentLoaded', () => {
    const scrollToTopBtn = domId('scrollToTop');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
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
        return {};
    } else {
        return stats;
    }
}

function renderStats(container, stats, isKBA = false) {
    const statsGrid = domCreate('div', 'stats-grid');
    
    const statItems = isKBA ? [
        { label: 'Attachments', value: stats.attachments, highlight: stats.attachments > 0, state: stats.attachmentsState }
    ] : [
        { label: 'Corrections', value: stats.corrections, highlight: stats.corrections > 0, state: stats.correctionsState },
        { label: 'Manual Activities', value: stats.manualActivities, highlight: stats.manualActivities > 0, state: stats.manualActivitiesState },
        { label: 'Prerequisites', value: stats.prerequisites, highlight: stats.prerequisites > 0, state: stats.prerequisitesState },
        { label: 'Attachments', value: stats.attachments, highlight: stats.attachments > 0, state: stats.attachmentsState }
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