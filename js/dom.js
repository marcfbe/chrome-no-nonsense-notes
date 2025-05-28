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

function domAppend(parent, child) {
    parent.appendChild(child);
}

