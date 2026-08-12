import { allMatching, elementDescription, isEffectivelyDisabled } from '../bookmarks-shared.js';
import { hasComposedAncestor, isRendered, startInspector } from '../runtime.js';

const selector = [
    'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'summary',
    'iframe', 'audio[controls]', 'video[controls]', '[contenteditable]', '[tabindex]',
    '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]', '[onclick]',
].join(',');

function isSequentiallyFocusable(element) {
    return isRendered(element)
        && !isEffectivelyDisabled(element)
        && !hasComposedAncestor(element, '[inert]')
        && element.tabIndex >= 0;
}

function keepRadioTabStop(element, index, elements) {
    if (!(element instanceof element.ownerDocument.defaultView.HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
    const peers = elements.filter(candidate => candidate instanceof candidate.ownerDocument.defaultView.HTMLInputElement
        && candidate.type === 'radio'
        && candidate.name === element.name
        && candidate.form === element.form
        && candidate.getRootNode() === element.getRootNode());
    const selected = peers.find(candidate => candidate.checked) || peers[0];
    return elements[index] === selected;
}

export function scanFocusable(documents) {
    const candidates = allMatching(documents, selector);
    const elements = candidates.filter(isSequentiallyFocusable).filter(keepRadioTabStop);
    const positive = elements.filter(element => element.tabIndex > 0)
        .sort((a, b) => a.tabIndex - b.tabIndex);
    const normal = elements.filter(element => element.tabIndex === 0);
    const tabStops = [...positive, ...normal].map((element, index) => ({
        element,
        label: String(index + 1),
        severity: element.tabIndex > 0 || element.getAttribute('aria-disabled') === 'true' ? 'warning' : 'info',
        detail: `${elementDescription(element)}：Tab順 ${index + 1}${element.tabIndex > 0 ? `、正のtabindex=${element.tabIndex}` : ''}${element.getAttribute('aria-disabled') === 'true' ? '、aria-disabled="true"ですがフォーカス可能です' : ''}`,
    }));
    const suspicious = candidates.filter(element => isRendered(element)
        && !hasComposedAncestor(element, '[inert]')
        && !isEffectivelyDisabled(element)
        && element.tabIndex < 0
        && (element.hasAttribute('onclick') || /^(button|link|checkbox|radio)$/.test(element.getAttribute('role') || '')))
        .map(element => ({
            element,
            label: 'Tab不可',
            severity: 'error',
            detail: `${elementDescription(element)}：操作可能に見える属性がありますが、Tabキーの移動順に含まれません。`,
        }));
    return [...tabStops, ...suspicious];
}

if (typeof window !== 'undefined') startInspector({
    id: 'focusable-element-checker',
    title: 'フォーカス可能要素',
    scan: scanFocusable,
});
