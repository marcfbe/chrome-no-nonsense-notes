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

function domText(element, content = '') {
    const el = document.createElement(element);
    const textContent = String(content).trim();
    if (textContent && textContent.includes('<') && textContent.includes('>')) {
        el.innerHTML = textContent;
    } else {
        el.textContent = textContent;
    }
    return el;
}

function domTextId(id, content = '') {
    const el = domId(id);
    const textContent = String(content).trim();
    if (textContent && textContent.includes('<') && textContent.includes('>')) {
        el.innerHTML = textContent;
    } else {
        el.textContent = textContent;
    }
    return el;
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
