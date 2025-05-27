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
        const breadcrumbsDiv = document.getElementById('breadcrumbs');
        if (note.Header && note.Header.SAPComponentPath && note.Header.SAPComponentPath.length > 0) {
            const breadcrumbsList = document.createElement('ol');
            breadcrumbsList.className = 'breadcrumbs-list';

            note.Header.SAPComponentPath.forEach((pathItem, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'breadcrumb-item';

                if (pathItem._url) {
                    const link = document.createElement('a');
                    link.href = `https://me.sap.com${pathItem._url}`;
                    link.textContent = pathItem._label;
                    link.target = '_blank';
                    listItem.appendChild(link);
                } else {
                    listItem.textContent = pathItem._label;
                }

                breadcrumbsList.appendChild(listItem);
            });

            breadcrumbsDiv.appendChild(breadcrumbsList);
        }

        // Set title and metadata with null checks
        if (note.Title && note.Title.value) {
            document.title = note.Title.value.replace(/\.$/, '');
            document.getElementById('note-title').textContent = document.title;
        }
        
        if (note.Header) {
            if (note.Header.Type && note.Header.Version) {
                document.getElementById('note-type-version').textContent = `${note.Header.Type.value}, Version: ${note.Header.Version.value}`;
            }
            if (note.Header.ReleasedOn && note.Header.ReleasedOn.value) {
                document.getElementById('note-date').textContent = `Released: ${normalizeDateFormat(note.Header.ReleasedOn.value)}`;
            }
            
            // Set component info with null checks
            if (note.Header.SAPComponentKey) {
                document.getElementById('note-component').textContent = note.Header.SAPComponentKey.value || '';
            }
            if (note.Header.Category) {
                document.getElementById('note-category').textContent = note.Header.Category.value || '';
            }
            if (note.Header.Priority) {
                document.getElementById('note-priority').textContent = note.Header.Priority.value || '';
            }
            if (note.Header.Status) {
                document.getElementById('note-status').textContent = note.Header.Status.value || '';
            }

            // Set stats
            const statsDiv = document.getElementById('note-stats');
            if (statsDiv) {
                const stats = calculateNoteStats(note);
                renderStats(statsDiv, stats);
            }
        }

        // Set description (HTML content) with null check
        if (note.LongText && note.LongText.value) {
            document.getElementById('note-description').innerHTML = formatLongText(note.LongText.value);
        }

        // Set software components
        const softwareComponentsDiv = document.getElementById('note-software-components');
        const softwareComponentsSection = document.getElementById('note-software-components-all');
        if (note.Validity && note.Validity.Items && note.Validity.Items.length > 0) {
            // Create table
            const table = document.createElement('table');
            table.className = 'software-components-table';

            // Create header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            const headers = ['Software Component', 'From', 'To'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create body
            const tbody = document.createElement('tbody');
            note.Validity.Items.forEach(component => {
                const row = document.createElement('tr');

                // Software Component
                const componentCell = document.createElement('td');
                componentCell.textContent = component.SoftwareComponent;
                row.appendChild(componentCell);

                // From
                const fromCell = document.createElement('td');
                fromCell.textContent = component.From;
                row.appendChild(fromCell);

                // To
                const toCell = document.createElement('td');
                toCell.textContent = component.To;
                row.appendChild(toCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            softwareComponentsDiv.appendChild(table);
        } else {
            // Hide the entire software components section
            softwareComponentsSection.style.display = 'none';
        }

        // Set support packages
        const supportPackagesDiv = document.getElementById('note-support-packages');
        const supportPackagesSection = document.getElementById('note-support-packages-all');
        if (note.SupportPackage && note.SupportPackage.Items && note.SupportPackage.Items.length > 0) {
            // Create table
            const table = document.createElement('table');
            table.className = 'support-packages-table';

            // Create header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            const headers = ['Software Component Version', 'Support Package'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create body
            const tbody = document.createElement('tbody');
            note.SupportPackage.Items.forEach(supportPackage => {
                const row = document.createElement('tr');

                // Software Component Version
                const componentVersionCell = document.createElement('td');
                componentVersionCell.textContent = supportPackage.SoftwareComponentVersion;
                row.appendChild(componentVersionCell);

                // Support Package (as link if URL exists)
                const supportPackageCell = document.createElement('td');
                if (supportPackage.URL) {
                    const link = document.createElement('a');
                    link.href = `https://me.sap.com${supportPackage.URL}`;
                    link.textContent = supportPackage.SupportPackage;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    supportPackageCell.appendChild(link);
                } else {
                    supportPackageCell.textContent = supportPackage.SupportPackage;
                }
                row.appendChild(supportPackageCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            supportPackagesDiv.appendChild(table);
        } else {
            // Hide the entire support packages section
            supportPackagesSection.style.display = 'none';
        }

        // Set references
        const referencesDiv = document.getElementById('note-references');
        const referencesSection = document.getElementById('note-references-all');
        const hasReferences = (note.References.RefTo.Items.length > 0 || note.References.RefBy.Items.length > 0);

        if (hasReferences) {
            if (note.References.RefTo.Items.length > 0) {
                // Add subtitle
                const subtitle = document.createElement('h4');
                subtitle.textContent = 'This document refers to';
                subtitle.className = 'references-subtitle';
                referencesDiv.appendChild(subtitle);

                // Create table
                const table = document.createElement('table');
                table.className = 'references-table';

                // Create header
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');

                const headers = ['SAP Note/KBA', 'Component', 'Title'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    th.style.whiteSpace = 'nowrap';
                    headerRow.appendChild(th);
                });

                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Create body
                const tbody = document.createElement('tbody');
                note.References.RefTo.Items.forEach(ref => {
                    const row = document.createElement('tr');

                    // Note number
                    const noteCell = document.createElement('td');
                    noteCell.textContent = ref.RefNumber;
                    noteCell.style.whiteSpace = 'nowrap';
                    row.appendChild(noteCell);

                    // Component
                    const componentCell = document.createElement('td');
                    componentCell.textContent = ref.RefComponent;
                    componentCell.style.whiteSpace = 'nowrap';
                    row.appendChild(componentCell);

                    // Title (as link)
                    const titleCell = document.createElement('td');
                    const link = document.createElement('a');
                    link.href = `viewer.html?id=${ref.RefNumber}`;
                    link.textContent = ref.RefTitle;
                    titleCell.appendChild(link);
                    row.appendChild(titleCell);

                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                referencesDiv.appendChild(table);
            }

            // Add "Referenced by" section
            if (note.References.RefBy.Items.length > 0) {
                // Add spacing
                const spacing = document.createElement('div');
                spacing.style.marginTop = '30px';
                referencesDiv.appendChild(spacing);

                // Add subtitle
                const subtitle = document.createElement('h4');
                subtitle.textContent = 'This document is referenced by';
                subtitle.className = 'references-subtitle';
                referencesDiv.appendChild(subtitle);

                // Create table
                const table = document.createElement('table');
                table.className = 'references-table';

                // Create header
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');

                const headers = ['SAP Note/KBA', 'Component', 'Title'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    th.style.whiteSpace = 'nowrap';
                    headerRow.appendChild(th);
                });

                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Create body
                const tbody = document.createElement('tbody');
                note.References.RefBy.Items.forEach(ref => {
                    const row = document.createElement('tr');

                    // Note number
                    const noteCell = document.createElement('td');
                    noteCell.textContent = ref.RefNumber;
                    noteCell.style.whiteSpace = 'nowrap';
                    row.appendChild(noteCell);

                    // Component
                    const componentCell = document.createElement('td');
                    componentCell.textContent = ref.RefComponent;
                    componentCell.style.whiteSpace = 'nowrap';
                    row.appendChild(componentCell);

                    // Title (as link)
                    const titleCell = document.createElement('td');
                    const link = document.createElement('a');
                    link.href = `viewer.html?id=${ref.RefNumber}`;
                    link.textContent = ref.RefTitle;
                    titleCell.appendChild(link);
                    row.appendChild(titleCell);

                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                referencesDiv.appendChild(table);
            }
        } else {
            // Hide the entire references section
            referencesSection.style.display = 'none';
        }

        // Set attachments
        const attachmentsDiv = document.getElementById('note-attachments');
        const attachmentsSection = document.getElementById('note-attachments-all');
        if (note.Attachments && note.Attachments.Items && note.Attachments.Items.length > 0) {
            // Create table
            const table = document.createElement('table');
            table.className = 'attachments-table';

            // Create header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            const headers = ['File Name', 'File Size (KB)', 'Type'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create body
            const tbody = document.createElement('tbody');
            note.Attachments.Items.forEach(attachment => {
                const row = document.createElement('tr');

                // File Name (as link)
                const fileNameCell = document.createElement('td');
                const link = document.createElement('a');
                link.href = attachment.URL;
                link.textContent = attachment.FileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                fileNameCell.appendChild(link);
                row.appendChild(fileNameCell);

                // File Size
                const fileSizeCell = document.createElement('td');
                fileSizeCell.textContent = attachment.FileSize;
                fileSizeCell.style.textAlign = 'right';
                row.appendChild(fileSizeCell);

                // MIME Type
                const mimeTypeCell = document.createElement('td');
                mimeTypeCell.textContent = attachment.MimeType;
                row.appendChild(mimeTypeCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            attachmentsDiv.appendChild(table);
        } else {
            // Hide the entire attachments section
            attachmentsSection.style.display = 'none';
        }

        // Set attributes
        const attributesDiv = document.getElementById('note-attributes');
        const attributesSection = document.getElementById('note-attributes-all');
        if (note.Attributes && note.Attributes.Items && note.Attributes.Items.length > 0) {
            const table = document.createElement('table');
            table.className = 'attributes-table';

            note.Attributes.Items.forEach(attr => {
                const row = document.createElement('tr');

                const keyCell = document.createElement('td');
                keyCell.textContent = attr.Key;
                keyCell.style.fontWeight = 'bold';
                keyCell.style.whiteSpace = 'nowrap';
                row.appendChild(keyCell);

                const valueCell = document.createElement('td');
                valueCell.textContent = attr.Value;
                row.appendChild(valueCell);

                table.appendChild(row);
            });

            attributesDiv.appendChild(table);
        } else {
            // Hide the entire attributes section
            attributesSection.style.display = 'none';
        }

        // Show the content after everything is loaded
        const noteContent = document.getElementById('note-content');
        const noteContentWide = document.getElementById('note-content-wide');
        if (noteContent) {
            noteContent.classList.add('loaded');
        }
        if (noteContentWide) {
            noteContentWide.classList.add('loaded');
        }
    } catch (error) {
        console.error('Error details:', error); // Add debugging
        displayErrorDisclaimer(error, noteId);
    }
});

function displayErrorDisclaimer(error, noteId = '') {
    // Update title to show error
    document.title = `Error - SAP Note ${noteId}`;
    document.getElementById('note-title').textContent = `Error Loading SAP Note ${noteId}`;

    // Create error disclaimer
    const errorDisclaimer = document.createElement('div');
    errorDisclaimer.id = 'DISCLAIMER';

    const errorTitle = document.createElement('strong');
    errorTitle.textContent = error.code ? error.code + ': ' : '';

    const errorMessage = document.createElement('span');
    errorMessage.textContent = error.message;

    errorDisclaimer.appendChild(errorTitle);
    errorDisclaimer.appendChild(errorMessage);

    // Insert the disclaimer into the DOM
    const noteContent = document.getElementById('note-content');
    const leftColumn = noteContent.querySelector('.left-column');
    if (leftColumn) {
        leftColumn.appendChild(errorDisclaimer);
    }

    const sections = [
        document.querySelector('.right-column'),
        document.getElementById('note-type-version'),
        document.getElementById('note-date'),
        document.getElementById('note-content-wide')
    ];
    sections.forEach(section => {
        if (section) {
            section.style.display = 'none';
        }
    });

    // Show the content
    if (noteContent) {
        noteContent.classList.add('loaded');
    }
}

// Scroll to top functionality
document.addEventListener('DOMContentLoaded', () => {
    const scrollToTopBtn = document.getElementById('scrollToTop');

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
    
    // Version
    stats.version = note.Header?.Version?.value || 0;
    
    // References count
    const refToCount = note.References?.RefTo?.Items?.length || 0;
    const refByCount = note.References?.RefBy?.Items?.length || 0;
    stats.referencesTo = refToCount;
    stats.referencedBy = refByCount;
    stats.totalReferences = refToCount + refByCount;
    
    // Software components count
    stats.softwareComponents = note.Validity?.Items?.length || 0;
    
    // Attributes count
    stats.attributes = note.Attributes?.Items?.length || 0;
    
    // Attachments count
    stats.attachments = note.Attachments?.Items?.length || 0;
    
    // Available translations count
    stats.translations = note.Translations?.Items?.length || 0;
    
    return stats;
}

function renderStats(container, stats) {
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    
    const statItems = [
        { label: 'Version', value: stats.version, highlight: stats.version > 1 },
        { label: 'References', value: stats.totalReferences, highlight: stats.totalReferences > 0 },
        { label: 'Refers To', value: stats.referencesTo, highlight: false },
        { label: 'Referenced By', value: stats.referencedBy, highlight: false },
        { label: 'Components', value: stats.softwareComponents, highlight: stats.softwareComponents > 0 },
        { label: 'Translations', value: stats.translations, highlight: stats.translations > 0 }
    ];
    
    // Only show attributes and attachments if they exist
    if (stats.attributes > 0) {
        statItems.push({ label: 'Attributes', value: stats.attributes, highlight: true });
    }
    if (stats.attachments > 0) {
        statItems.push({ label: 'Attachments', value: stats.attachments, highlight: true });
    }
    
    statItems.forEach(item => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        const label = document.createElement('div');
        label.className = 'stat-label';
        label.textContent = item.label;
        
        const value = document.createElement('div');
        value.className = 'stat-value';
        if (item.highlight) {
            value.classList.add('highlight');
        }
        value.textContent = item.value;
        
        statItem.appendChild(label);
        statItem.appendChild(value);
        statsGrid.appendChild(statItem);
    });
    
    container.appendChild(statsGrid);
} 