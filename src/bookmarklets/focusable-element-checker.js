import { allMatching, elementDescription } from '../bookmarks-shared.js';
import { isRendered, startInspector } from '../runtime.js';

const selector = [
    'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'summary',
    'iframe', 'audio[controls]', 'video[controls]', '[contenteditable]', '[tabindex]',
].join(',');

export function scanFocusable(documents) {
    const elements = allMatching(documents, selector)
        .filter(element => isRendered(element) && !element.disabled && element.tabIndex >= 0);
    const positive = elements.filter(element => element.tabIndex > 0)
        .sort((a, b) => a.tabIndex - b.tabIndex);
    const normal = elements.filter(element => element.tabIndex === 0);
    return [...positive, ...normal].map((element, index) => ({
        element,
        label: String(index + 1),
        severity: element.tabIndex > 0 ? 'warning' : 'info',
        detail: `${elementDescription(element)}：Tab順 ${index + 1}${element.tabIndex > 0 ? `、tabindex=${element.tabIndex}` : ''}`,
    }));
}

if (typeof window !== 'undefined') startInspector({
    id: 'focusable-element-checker',
    title: 'フォーカス可能要素',
    scan: scanFocusable,
});
