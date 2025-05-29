// Main SAP Note viewer
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    const noteLanguage = urlParams.get('t') || 'E';

    if (!noteId) {
        const error = new Error('Invalid SAP Note');
        displayError(error);
        return;
    }

    try {
        const note = await fetchSAPNote(noteId, noteLanguage);

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

        // *** Header ***

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

            if (statistics.totalCount > 0) {
                renderStats(note, statistics);
            } else {
                domHide(stats);
            }
        }

        // *** Language Selector ***

        if (note.Translations) {
            domTextId('language-selector-label', note.Translations._label);
            const languageSelector = domId('language-selector-content');

            const select = domCreate('select');
            select.addEventListener('change', (e) => {
                const code = e.target.value;
                if (code) {
                    window.location.href = `viewer.html?id=${noteId}&t=${code}`;
                }
            });

            const defaultOption = domText('option', getLanguageFromHeader(note));
            defaultOption.value = noteLanguage;
            domAppend(select, defaultOption);

            note.Translations.Items.forEach(translation => {
                const option = domText('option', translation.TranslationLanguage);
                option.value = translation.TranslationLanguageCode;
                domAppend(select, option);
            });

            domAppend(languageSelector, select);
        } else {
            domHide(domId('language-selector'));
        }

        // *** Description (HTML content) ***

        if (note.LongText && note.LongText.value) {
            domTextId('description', formatLongText(note.LongText.value, noteLanguage));
        }

        // *** CVSS ***

        const cvss = domId('cvss');

        if (note.CVSS) {
            domTextId('cvss-label', note.CVSS._label);
            const cvssItems = domId('cvss-items');

            // CVSS Score
            domTextId('cvss-score-label', note.CVSS.CVSS_Score._label);
            const score = parseFloat(note.CVSS.CVSS_Score.value);
            domTextId('cvss-score-value', score + ' / 10');
            const cvssScore = domId('cvss-score-value');

            // Color based on severity
            if (score === 0) {
                cvssScore.style.color = '#666666'; // None - Gray
            } else if (score <= 3.9) {
                cvssScore.style.color = '#3CB371'; // Low - Green
            } else if (score <= 6.9) {
                cvssScore.style.color = '#FFD700'; // Medium - Yellow
            } else if (score <= 8.9) {
                cvssScore.style.color = '#FFA500'; // High - Orange
            } else {
                cvssScore.style.color = '#DC143C'; // Critical - Red
            }

            // CVSS Vector
            domTextId('cvss-vector-label', note.CVSS.CVSS_Vector._label);
            const link = domLink(note.CVSS.CVSS_Vector.vectorValue, 'https://www.first.org/cvss/calculator/3-0#' + note.CVSS.CVSS_Vector.vectorValue);
            domAppend(domId('cvss-vector-value'), link);

            const table = domCreate('table');
            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const columns = getColumns(note.CVSS.CVSS_Vector);
            columns.forEach(column => {
                const th = domText('th', column.value);
                domAppend(headerRow, th);
            });

            domAppend(thead, headerRow);
            domAppend(table, thead);

            const tbody = domCreate('tbody');
            note.CVSS.CVSS_Vector.Items.forEach(item => {
                const row = domCreate('tr');

                const keyCell = domText('td', item.Key);
                keyCell.style.fontWeight = 'bold';
                keyCell.style.whiteSpace = 'nowrap';
                domAppend(row, keyCell);

                const valueCell = domText('td', item.Value);
                domAppend(row, valueCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(cvssItems, table);
        } else {
            domHide(cvss);
            domHide(domId('cvss-score'));
        }

        // *** Validity (Software Components / Products) ***

        const validity = domId('validity');

        if (hasValues(note.Validity)) {
            domTextId('validity-label', note.Validity._label);
            const validityItems = domId('validity-items');
            const table = domCreate('table');
            const thead = domCreate('thead');
            const headerRow = domCreate('tr');

            const columns = getColumns(note.Validity);
            columns.forEach(column => {
                const th = domText('th', column.value);
                if (column.key === 'Product' || column.key === 'SoftwareComponent') {
                    th.style.width = '24em';
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

        // *** Corrections ***

        const corrections = domId('corrections');
        const hasCorrections = (hasValues(note.CorrectionInstructions) || hasValues(note.Preconditions) || note.ManualActions?.value);

        if (hasCorrections) {
            domTextId('corrections-label', note.CorrectionsInfo.Corrections._label);
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
                    if (column.key === 'SoftwareComponent') {
                        th.style.width = '24em';
                    }
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
                    const link = domLink(prerequisite.Number, prerequisite.Number, noteLanguage);
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
                        const link = domLink(prerequisite.Title, prerequisite.URL, noteLanguage);
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
                domTextId('corrections-manual-activities-items', normalizeManualActivities(note.ManualActions.value));
            } else {
                domHide(manualActivities);
            }

        } else {
            domHide(corrections);
        }

        // *** Support packages ***

        const supportPackages = domId('support-packages');

        if (hasValues(note.SupportPackage)) {
            domTextId('support-packages-label', note.SupportPackage._label);
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

        // *** Support package patches ***

        const supportPackagePatches = domId('support-package-patches');

        if (hasValues(note.SupportPackagePatch)) {
            domTextId('support-package-patches-label', note.SupportPackagePatch._label);
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
                const link = domLink(patch.SupportPackagePatch + ' (Download)', patch.URL);
                domAppend(patchCell, link);
                domAppend(row, patchCell);

                domAppend(tbody, row);
            });

            domAppend(table, tbody);
            domAppend(supportPackagePatchesItems, table);
        } else {
            domHide(supportPackagePatches);
        }

        // *** References ***

        const references = domId('references');
        const hasReferences = (hasValues(note.References.RefTo) || hasValues(note.References.RefBy));

        if (hasReferences) {
            domTextId('references-label', note.References._label);
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
                    const noteLink = domLink(ref.RefNumber, ref.RefNumber, noteLanguage);
                    domAppend(noteCell, noteLink);
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domText('td', ref.RefComponent);
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link)
                    const titleCell = domCreate('td');
                    const titleLink = domLink(ref.RefTitle, ref.RefUrl, noteLanguage);
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
                    const noteLink = domLink(ref.RefNumber, ref.RefNumber, noteLanguage);
                    domAppend(noteCell, noteLink);
                    domAppend(row, noteCell);

                    // Component
                    const componentCell = domText('td', ref.RefComponent);
                    componentCell.style.whiteSpace = 'nowrap';
                    domAppend(row, componentCell);

                    // Title (as link)
                    const titleCell = domCreate('td');
                    const titleLink = domLink(ref.RefTitle, ref.RefUrl, noteLanguage);
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

        // *** Attachments ***

        const attachments = domId('attachments');

        if (hasValues(note.Attachments)) {
            domTextId('attachments-label', note.Attachments._label);
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

        // *** Attributes ***

        const attributes = domId('attributes');

        if (hasValues(note.Attributes)) {
            domTextId('attributes-label', note.Attributes._label);
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
    } catch (error) {
        // console.error('Error details:', error); // Add for debugging
        displayError(error, noteId);
    }

    // Show the content after everything is loaded
    domId('content').classList.add('loaded');
    domId('content-wide').classList.add('loaded');
});

