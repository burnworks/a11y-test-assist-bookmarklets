import { allMatching, contentText, elementDescription } from '../bookmarks-shared.js';
import { isRendered, normalizeText, referencedText, startInspector } from '../runtime.js';

export function scanImageAlternatives(documents) {
    return allMatching(documents, 'img, input[type="image" i]').filter(isRendered).map(element => {
        const hasAlt = element.hasAttribute('alt');
        const rawAlt = element.getAttribute('alt') || '';
        const alt = normalizeText(rawAlt);
        const presentational = ['none', 'presentation'].includes((element.getAttribute('role') || '').toLowerCase());
        let label = 'ALT';
        let severity = 'success';
        let message = `alt="${alt}"`;
        if (!hasAlt) {
            label = 'ALTなし'; severity = 'error'; message = 'alt属性がありません';
        } else if (!alt && rawAlt.length > 0) {
            label = 'ALT空白'; severity = 'warning'; message = 'alt属性値が空白文字だけです';
        } else if (!alt) {
            const actionable = element.closest('a[href], button, [role="button"], [role="link"]');
            const containerName = actionable && (referencedText(actionable, 'aria-labelledby')
                || normalizeText(actionable.getAttribute('aria-label'))
                || contentText(actionable));
            const isImageButton = element.localName === 'input';
            label = isImageButton || (actionable && !containerName) ? 'ALT空!' : 'ALT空';
            severity = isImageButton || (actionable && !containerName) ? 'error' : 'info';
            message = isImageButton
                ? '画像ボタンのalt属性値が空です'
                : actionable && !containerName
                    ? 'リンクまたはボタンの唯一の内容ですが、alt属性値が空です'
                    : 'alt属性値は空です（装飾画像として妥当か確認してください）';
        } else if (presentational) {
            label = 'ALT矛盾'; severity = 'warning'; message = `role="${element.getAttribute('role')}"ですがaltに「${alt}」があります`;
        }
        const ariaName = referencedText(element, 'aria-labelledby') || normalizeText(element.getAttribute('aria-label'));
        return { element, label, severity, detail: `${elementDescription(element)}：${message}${ariaName ? `、ARIAによる名前「${ariaName}」あり` : ''}` };
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'image-alt-attribute-checker',
    title: '画像のalt属性',
    scan: scanImageAlternatives,
});
