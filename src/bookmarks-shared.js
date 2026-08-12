import { normalizeText, queryAllDeep, referencedText } from './runtime.js';

export function allMatching(documents, selector) {
    return documents.flatMap(document => queryAllDeep(document, selector));
}

export function elementDescription(element) {
    const tag = element.localName;
    const id = element.id ? `#${element.id}` : '';
    const name = normalizeText(element.getAttribute('name'));
    return `<${tag}${id}>${name ? ` name="${name}"` : ''}`;
}

function textAlternative(node) {
    if (node.nodeType === node.TEXT_NODE) return node.nodeValue;
    if (node.nodeType !== node.ELEMENT_NODE) return '';
    const element = node;
    if (element.matches('[hidden], [aria-hidden="true"]')) return '';
    if (element.localName === 'img') return element.getAttribute('alt') || '';
    return [...element.childNodes].map(textAlternative).join(' ');
}

export function contentText(element) {
    return normalizeText([...element.childNodes].map(textAlternative).join(' '));
}

export function accessibleNameInfo(element) {
    const labelledBy = referencedText(element, 'aria-labelledby');
    if (labelledBy) return { name: labelledBy, source: 'aria-labelledby' };

    const ariaLabel = normalizeText(element.getAttribute('aria-label'));
    if (ariaLabel) return { name: ariaLabel, source: 'aria-label' };

    const labels = element.labels ? [...element.labels] : [];
    const labelText = normalizeText(labels.map(contentText).join(' '));
    if (labelText) return { name: labelText, source: labels.length > 1 ? '複数のlabel' : 'label' };

    if (element.localName === 'button' || element.getAttribute('role') === 'button') {
        const name = contentText(element);
        if (name) return { name, source: '内容テキスト' };
    }

    if (element.localName === 'input') {
        const type = (element.getAttribute('type') || 'text').toLowerCase();
        if (type === 'image') {
            const name = normalizeText(element.getAttribute('alt'));
            if (name) return { name, source: 'alt' };
        }
        if (['button', 'submit', 'reset'].includes(type)) {
            const name = normalizeText(element.value);
            if (name) return { name, source: 'value' };
        }
    }

    const title = normalizeText(element.getAttribute('title'));
    if (title) return { name: title, source: 'title', fallback: true };
    const placeholder = normalizeText(element.getAttribute('placeholder'));
    if (placeholder) return { name: placeholder, source: 'placeholder', fallback: true };
    return { name: '', source: 'なし' };
}

export function extensionFromLink(link) {
    let pathname;
    try {
        pathname = new URL(link.href, link.ownerDocument.baseURI).pathname;
    } catch {
        pathname = link.getAttribute('href') || '';
    }
    try {
        pathname = decodeURIComponent(pathname);
    } catch {
        // Keep the encoded pathname if it contains malformed escape sequences.
    }
    const match = pathname.match(/\.([a-z0-9]{1,8})$/i);
    return match?.[1].toLowerCase() || '';
}

