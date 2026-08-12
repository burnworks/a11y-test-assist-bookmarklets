import { allMatching, elementDescription } from '../bookmarks-shared.js';
import { isRendered, normalizeText, startInspector } from '../runtime.js';

function headingLevel(element) {
    if (/^h[1-6]$/.test(element.localName)) return Number(element.localName[1]);
    const raw = normalizeText(element.getAttribute('aria-level'));
    return /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
}

export function scanHeadings(documents) {
    let previousLevel = 0;
    return allMatching(documents, 'h1, h2, h3, h4, h5, h6, [role="heading"]')
        .filter(isRendered)
        .map(element => {
            const level = headingLevel(element);
            const removed = ['none', 'presentation'].includes((element.getAttribute('role') || '').toLowerCase());
            const skipped = level && previousLevel && level > previousLevel + 1;
            const severity = !level || removed ? 'error' : skipped ? 'warning' : 'info';
            const detail = !level
                ? 'role="heading"に有効なaria-levelがありません'
                : removed
                    ? `見出し要素のセマンティクスがrole="${element.getAttribute('role')}"で除去されています`
                    : `レベル${level}${skipped ? `（直前のレベル${previousLevel}から飛んでいます）` : ''}`;
            if (level && !removed) previousLevel = level;
            return { element, label: level ? `H${level}` : 'H?', severity, detail: `${elementDescription(element)}：${detail}` };
        });
}

if (typeof window !== 'undefined') startInspector({
    id: 'show-heading-level',
    title: '見出しレベル',
    scan: scanHeadings,
});
