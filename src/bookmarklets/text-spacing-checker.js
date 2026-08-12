import { elementDescription } from '../bookmarks-shared.js';
import { getRoots, isRendered, normalizeText, queryAllDeep, startInspector } from '../runtime.js';

const spacingCss = '*:not([data-a11y-test-assist-root]){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';

function clippedAxes(element) {
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    const horizontal = ['hidden', 'clip'].includes(style.overflowX || style.overflow) && element.scrollWidth > element.clientWidth + 1;
    const vertical = ['hidden', 'clip'].includes(style.overflowY || style.overflow) && element.scrollHeight > element.clientHeight + 1;
    return [horizontal && '横', vertical && '縦'].filter(Boolean);
}

export function scanTextSpacing(documents) {
    return documents.flatMap(document => queryAllDeep(document, 'body *'))
        .filter(element => isRendered(element) && normalizeText(element.textContent))
        .flatMap(element => {
            const axes = clippedAxes(element);
            if (!axes.length) return [];
            return [{
                element,
                label: `文字切れ?${axes.join('')}`,
                severity: 'warning',
                detail: `${elementDescription(element)}：文字間隔適用後、overflowが${axes.join('・')}方向で内容を切り取っている可能性があります（表示領域 ${element.clientWidth}×${element.clientHeight}px、内容 ${element.scrollWidth}×${element.scrollHeight}px）。目視で文字の欠落・重なりを確認してください。`,
            }];
        });
}

export function createTextSpacingApplier() {
    const styledRoots = new WeakSet();
    return (documents, _report, addCleanup) => {
        for (const document of documents) for (const root of getRoots(document)) {
            if (styledRoots.has(root)) continue;
            styledRoots.add(root);
            const style = document.createElement('style');
            style.setAttribute('data-a11y-text-spacing', '');
            style.textContent = spacingCss;
            (root.head || root).append(style);
            addCleanup(() => style.remove());
        }
    };
}

const applyTextSpacing = createTextSpacingApplier();

if (typeof window !== 'undefined') startInspector({
    id: 'text-spacing-checker',
    title: '文字間隔（WCAG 1.4.12）',
    scan: scanTextSpacing,
    onDocuments: applyTextSpacing,
});
