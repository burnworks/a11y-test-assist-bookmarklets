import { accessibleNameInfo, allMatching, elementDescription } from '../bookmarks-shared.js';
import { isRendered, startInspector } from '../runtime.js';

const selector = 'input:not([type="hidden" i]), select, textarea, button, [role="button"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="switch"], [role="slider"], [role="spinbutton"], [role="searchbox"]';

export function scanFormLabels(documents) {
    return allMatching(documents, selector).filter(isRendered).map(element => {
        const info = accessibleNameInfo(element);
        const severity = !info.name ? 'error' : info.fallback ? 'warning' : 'success';
        const label = !info.name ? '名前なし' : info.fallback ? `${info.source}のみ` : 'NAME';
        return {
            element,
            label,
            severity,
            detail: `${elementDescription(element)}：${info.name ? `「${info.name}」（取得元: ${info.source}）` : 'アクセシブルな名前を確認できません'}`,
        };
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'show-form-label',
    title: 'フォームコントロールの名前',
    scan: scanFormLabels,
});
