async function fetchSAPNote(noteId, language) {
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
        throw new Error(`HTTP error! status: ${response.status}`);
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