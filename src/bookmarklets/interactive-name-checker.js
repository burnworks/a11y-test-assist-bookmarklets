import { accessibleNameInfo, allMatching, contentText, elementDescription } from '../bookmarks-shared.js';
import { isRendered, normalizeText, startInspector } from '../runtime.js';

const selector = [
    'a[href]', 'area[href]', 'button', 'input:not([type="hidden" i])', 'select', 'textarea', 'summary',
    '[contenteditable]:not([contenteditable="false" i])', '[role~="button" i]', '[role~="link" i]',
    '[role~="checkbox" i]', '[role~="radio" i]', '[role~="textbox" i]', '[role~="combobox" i]',
    '[role~="switch" i]', '[role~="slider" i]', '[role~="spinbutton" i]', '[role~="searchbox" i]',
    '[role~="tab" i]', '[role~="menuitem" i]', '[role~="menuitemcheckbox" i]',
    '[role~="menuitemradio" i]', '[role~="option" i]', '[role~="treeitem" i]',
].join(',');

const formSelector = [
    'input:not([type="hidden" i])', 'select', 'textarea', 'button', '[role~="button" i]', '[role~="checkbox" i]',
    '[role~="radio" i]', '[role~="textbox" i]', '[role~="combobox" i]', '[role~="switch" i]', '[role~="slider" i]',
    '[role~="spinbutton" i]', '[role~="searchbox" i]',
].join(',');

function visibleLabel(element) {
    const labels = element.labels ? [...element.labels] : [];
    const labelText = normalizeText(labels.map(contentText).join(' '));
    if (labelText) return labelText;
    const role = (element.getAttribute('role') || '').toLowerCase().split(/\s+/)[0];
    if (['a', 'button', 'summary'].includes(element.localName)
        || /^(button|link|checkbox|menuitem|menuitemcheckbox|menuitemradio|option|radio|switch|tab|treeitem)$/.test(role)) {
        return contentText(element);
    }
    if (element.localName === 'input' && element.hasAttribute('value') && ['button', 'submit', 'reset'].includes((element.type || '').toLowerCase())) {
        return normalizeText(element.value);
    }
    return '';
}

function comparable(value) {
    return normalizeText(value).toLocaleLowerCase();
}

export function scanInteractiveNames(documents) {
    return allMatching(documents, selector).filter(isRendered).map(element => {
        const info = accessibleNameInfo(element);
        const visible = visibleLabel(element);
        const mismatch = Boolean(info.name && visible && !comparable(info.name).includes(comparable(visible)));
        const severity = !info.name ? 'error' : info.fallback || mismatch ? 'warning' : 'success';
        const label = !info.name ? '名前なし' : mismatch ? '表示不一致' : info.fallback ? `${info.source}のみ` : info.source;
        const notes = [
            info.name ? `名前「${info.name}」（取得元: ${info.source}）` : 'アクセシブルな名前を確認できません',
            mismatch && `可視ラベル「${visible}」が名前に含まれていません`,
        ].filter(Boolean);
        return {
            element,
            label,
            severity,
            scope: element.matches(formSelector) ? 'form' : 'interactive',
            detail: `${elementDescription(element)}：${notes.join('。')}`,
        };
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'interactive-name-checker',
    title: '操作要素のアクセシブルな名前',
    scan: scanInteractiveNames,
    initialView: 'problems',
    views: [
        { id: 'problems', label: '問題のみ', filter: result => result.severity !== 'success' },
        { id: 'all', label: 'すべて' },
        { id: 'forms', label: 'フォームのみ', filter: result => result.scope === 'form' },
    ],
});
