function domId(id) {
    return document.getElementById(id);
}

function domClass(className) {
    return document.getElementsByClassName(className);
}

function domCreate(element, className = '') {
    const el = document.createElement(element);
    if (className) {
        el.className = className;
    }
    return el;
}

function domText(element, textContent = '') {
    const el = document.createElement(element);
    if (textContent && textContent.includes('<') && textContent.includes('>')) {
        el.innerHTML = String(textContent).trim();
    } else {
        el.textContent = String(textContent).trim();
    }
    return el;
}

function domTextId(id, textContent = '') {
    const el = domId(id);
    if (textContent && textContent.includes('<') && textContent.includes('>')) {
        el.innerHTML = String(textContent).trim();
    } else {
        el.textContent = String(textContent).trim();
    }
}

function domLink(text, href, language = '') {
    if (!href) {
        return domText('span', text);
    }
    const ref = String(href).trim();
    const link = domText('a', text);
    const lang = (language) ? `&t=${language}` : '';

    // map to extension (same tab)
    if (ref.startsWith('/notes/')) {
        const noteId = ref.split('/')[2];
        link.href = `${nnnPage}?id=${noteId}${lang}`;
    } else if (ref.match(/^\d+\s*$/)) {
        link.href = `${nnnPage}?id=${ref}${lang}`;
    } else {
        // map to website and open in new tab
        if (ref.startsWith('/')) {
            link.href = `https://me.sap.com${ref}`;
        } else {
            link.href = ref;
        }
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    }
    return link;
}

function domAppend(parent, child) {
    parent.appendChild(child);
}

function domHide(element) {
    element.style.display = 'none';
}

function domShow(element) {
    element.style.display = 'block';
}
