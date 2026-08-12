import { elementDescription } from '../bookmarks-shared.js';
import { startInspector } from '../runtime.js';

function deepestActiveElement(document) {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
}

export function scanFocused(documents) {
    return documents.flatMap(document => {
        const element = deepestActiveElement(document);
        if (!element || element === document.body || element === document.documentElement) return [];
        if (element.matches('iframe, frame')) {
            try {
                const nested = element.contentDocument && deepestActiveElement(element.contentDocument);
                if (nested && nested !== element.contentDocument.body && nested !== element.contentDocument.documentElement) return [];
            } catch {
                // A cross-origin frame itself can still be highlighted.
            }
        }
        return [{
            element,
            label: 'FOCUS',
            severity: 'info',
            detail: `${elementDescription(element)} にフォーカスがあります。`,
        }];
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'force-focus-outline',
    title: 'フォーカスインジケーター',
    scan: scanFocused,
});
