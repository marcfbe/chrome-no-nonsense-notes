async function fetchSAPNote(noteId, language) {
    // Use demo data for noteId 42424242
    if (noteId === '42424242') {
        try {
            const response = await fetch('./demo/42424242-demo.json');
            if (!response.ok) {
                throw new Error(`Failed to load demo data: ${response.status}`);
            }
            const demoData = await response.json();
            const sapNote = { ...demoData.Response.SAPNote };
            return sapNote;
        } catch (error) {
            throw new Error(`Failed to load demo data: ${error.message}`);
        }
    }

    // This fetch requires a valid SAP session cookie to be available in the browser
    const lang = language ? `&t=${language}` : '';
    const response = await fetch(`https://me.sap.com/backend/raw/sapnotes/Detail?q=${noteId}&isVTEnabled=true${lang}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': '*/*',
            'Accept-Language': 'en',
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'Pragma': 'no-cache',
            'Referer': `https://me.sap.com/notes/${noteId}`,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    if (!response.ok) {
        let message;
        switch (response.status) {
            case 401:
                message = 'You are not authorized to access this note.<br>Please logon to <a href="https://me.sap.com/">https://me.sap.com/</a>';
                break;
            case 403:
                message = 'Access denied';
                break;
            case 404:
                message = 'Note not found';
                break;
            case 429:
                message = 'Too many requests';
                break;
            case 500:
                message = 'Internal server error';
                break;
            default:
                message = response.statusText;
        }
        throw new Error(`HTTP error ${response.status}<br>${message}`, { code: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Expected JSON, got: ' + text.slice(0, 100));
    }

    const data = await response.json();

    if (!data.Response) {
        throw new Error('Invalid response format');
    }

    // Check for API errors
    if (data.Response.Error && (data.Response.Error.Message || data.Response.Error.Code)) {
        const error = new Error(data.Response.Error.Message || 'Unknown error occurred');
        error.code = data.Response.Error.Code;
        error.isAPIError = true;
        throw error;
    }

    if (!data.Response.SAPNote) {
        throw new Error('Invalid response format - no SAP Note data');
    }

    return data.Response.SAPNote;
} 