import { allMatching, elementDescription, isEffectivelyDisabled } from '../bookmarks-shared.js';
import { isRendered, normalizeText, startInspector } from '../runtime.js';

const targetSelector = [
    'a[href]', 'area[href]', 'button', 'input:not([type="hidden" i])', 'select', 'textarea',
    'summary', '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
    '[role="switch"]', '[role="tab"]', '[role="menuitem"]', '[onclick]',
].join(',');

function rect(element) {
    const value = element.getBoundingClientRect();
    return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
}

function center(box) {
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function distanceBetween(a, b) {
    const ac = center(a);
    const bc = center(b);
    return Math.hypot(ac.x - bc.x, ac.y - bc.y);
}

function pointToRectDistance(point, box) {
    const dx = Math.max(box.left - point.x, 0, point.x - box.right);
    const dy = Math.max(box.top - point.y, 0, point.y - box.bottom);
    return Math.hypot(dx, dy);
}

function hasRequiredSpacing(candidate, targets) {
    const candidateCenter = center(candidate.box);
    return targets.every(other => {
        if (other === candidate) return true;
        const otherSmall = other.box.width < 24 || other.box.height < 24;
        return otherSmall
            ? distanceBetween(candidate.box, other.box) >= 24
            : pointToRectDistance(candidateCenter, other.box) >= 12;
    });
}

function inlineTextExceptionCandidate(element) {
    if (element.localName !== 'a') return false;
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    if (style.display && style.display !== 'inline') return false;
    const parentText = normalizeText(element.parentElement?.textContent);
    return parentText.length > normalizeText(element.textContent).length;
}

export function scanTargetSizes(documents) {
    const targets = allMatching(documents, targetSelector)
        .filter(element => isRendered(element) && !isEffectivelyDisabled(element))
        .map(element => ({ element, box: rect(element) }))
        .filter(target => target.box.width > 0 && target.box.height > 0);
    return targets.filter(target => target.box.width < 24 || target.box.height < 24).map(target => {
        const inline = inlineTextExceptionCandidate(target.element);
        const spaced = hasRequiredSpacing(target, targets);
        const classification = inline ? '行内' : spaced ? '間隔' : '密集';
        const note = inline
            ? '文章中の行内リンクの例外候補です。行内であることを目視確認してください'
            : spaced
                ? '24 CSS pxの円が周囲のターゲットと重ならない間隔がある候補です'
                : '近接するポインターターゲットがあり、間隔の例外を満たさない可能性があります';
        return {
            element: target.element,
            label: `小:${classification}`,
            severity: inline || spaced ? 'info' : 'warning',
            detail: `${elementDescription(target.element)}：ターゲット ${Math.round(target.box.width * 10) / 10}×${Math.round(target.box.height * 10) / 10} CSS px。${note}。`,
        };
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'target-size-checker',
    title: 'ターゲットサイズ（24px）',
    scan: scanTargetSizes,
});
