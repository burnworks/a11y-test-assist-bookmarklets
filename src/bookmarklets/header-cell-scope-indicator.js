import { allMatching, elementDescription } from '../bookmarks-shared.js';
import { isRendered, normalizeText, startInspector } from '../runtime.js';

const validScopes = new Set(['row', 'col', 'rowgroup', 'colgroup']);

export function scanHeaderCells(documents) {
    return allMatching(documents, 'th').filter(isRendered).map(element => {
        const hasScope = element.hasAttribute('scope');
        const scope = normalizeText(element.getAttribute('scope')).toLowerCase();
        const valid = validScopes.has(scope);
        const label = !hasScope ? 'scope —' : valid ? `scope ${scope}` : 'scope !';
        return {
            element,
            label,
            severity: !hasScope ? 'info' : valid ? 'success' : 'error',
            detail: `${elementDescription(element)}：${!hasScope ? 'scope属性なし（単純な表では直ちにエラーとは限りません）' : valid ? `scope="${scope}"` : `不正なscope値「${scope || '空'}」`}${element.id ? `、id="${element.id}"` : ''}${element.hasAttribute('headers') ? `、headers="${element.getAttribute('headers')}"` : ''}`,
        };
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'header-cell-scope-indicator',
    title: '見出しセルのscope',
    scan: scanHeaderCells,
});
