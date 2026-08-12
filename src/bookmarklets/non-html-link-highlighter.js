import { allMatching, elementDescription, extensionFromLink } from '../bookmarks-shared.js';
import { isRendered, startInspector } from '../runtime.js';

const extensions = new Set(['pdf', 'xls', 'xlsx', 'ods', 'csv', 'doc', 'docx', 'odt', 'rtf', 'ppt', 'pptx', 'odp', 'epub', 'zip']);

export function scanNonHtmlLinks(documents) {
    return allMatching(documents, 'a[href]').filter(isRendered).flatMap(element => {
        const extension = extensionFromLink(element);
        if (!extensions.has(extension)) return [];
        return [{
            element,
            label: extension.toUpperCase(),
            severity: 'warning',
            detail: `${elementDescription(element)}：リンク先は.${extension}ファイルです。リンク文言から判別できるか確認してください。`,
        }];
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'non-html-link-highlighter',
    title: 'HTML以外へのリンク',
    scan: scanNonHtmlLinks,
});
