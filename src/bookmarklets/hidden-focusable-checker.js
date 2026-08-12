import { allMatching, elementDescription, isEffectivelyDisabled } from '../bookmarks-shared.js';
import { hasComposedAncestor, isRendered, startInspector } from '../runtime.js';

const focusableSelector = [
    'a[href]', 'area[href]', 'button', 'input:not([type="hidden" i])', 'select', 'textarea',
    'summary', 'iframe', 'audio[controls]', 'video[controls]', '[contenteditable]', '[tabindex]',
].join(',');

function deepActiveElement(document) {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
}

function hiddenAncestor(element) {
    let current = element;
    while (current) {
        if (current.getAttribute?.('aria-hidden')?.toLowerCase() === 'true') return current;
        const root = current.getRootNode?.();
        current = current.parentElement || root?.host || null;
    }
    return null;
}

function isAvailableForFocus(element) {
    return isRendered(element)
        && !isEffectivelyDisabled(element)
        && !hasComposedAncestor(element, '[inert]');
}

export function scanHiddenFocusable(documents) {
    const activeElements = new Set(documents.map(deepActiveElement).filter(Boolean));
    return allMatching(documents, focusableSelector).flatMap(element => {
        const hidden = hiddenAncestor(element);
        if (!hidden || !isAvailableForFocus(element)) return [];
        const active = activeElements.has(element);
        const sequential = element.tabIndex >= 0;
        if (!active && !sequential) return [];
        return [{
            element,
            label: active ? '隠Focus' : '隠Tab',
            severity: 'error',
            detail: `${elementDescription(element)}：aria-hidden="true" の ${elementDescription(hidden)} 内にあり、${active ? '現在フォーカスされています' : `Tabキーでフォーカスできます（tabindex=${element.tabIndex}）`}。aria-hidden の範囲から移動するか、フォーカスできない状態にしてください。`,
        }];
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'hidden-focusable-checker',
    title: 'aria-hidden内のフォーカス',
    scan: scanHiddenFocusable,
});
