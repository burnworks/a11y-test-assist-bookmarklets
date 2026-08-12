import { accessibleNameInfo, allMatching, contentText, elementDescription, extensionFromLink } from '../bookmarks-shared.js';
import { isRendered, normalizeText, referencedText, startInspector } from '../runtime.js';

const fileExtensions = new Set([
    'pdf', 'xls', 'xlsx', 'ods', 'csv', 'doc', 'docx', 'odt', 'rtf', 'ppt', 'pptx', 'odp',
    'epub', 'zip', '7z', 'rar', 'tar', 'gz', 'mp3', 'wav', 'm4a', 'mp4', 'mov', 'webm', 'ics',
]);

const genericNames = new Set([
    'こちら', 'ここ', '詳細', '詳細を見る', 'もっと見る', '続きを読む', '次へ', 'link', 'here',
    'click here', 'more', 'details', 'read more', 'learn more', 'continue', 'next',
    'download', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'mp3', 'mp4',
]);

function comparable(value) {
    return normalizeText(value).toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ' ').trim();
}

function extensionFromFilename(value) {
    const pathname = String(value || '').split(/[?#]/, 1)[0];
    const match = pathname.match(/\.([a-z0-9]{1,8})$/i);
    return match?.[1].toLowerCase() || '';
}

function destinationInfo(element) {
    const raw = element.getAttribute('href');
    if (raw === null) return { raw: '', url: '', issue: 'リンク先を示すhrefがありません' };
    if (!normalizeText(raw)) return { raw, url: '', issue: 'hrefが空です' };
    if (/^javascript:/i.test(raw.trim())) return { raw, url: raw.trim(), issue: 'javascript: URLです' };
    try {
        const url = new URL(raw, element.ownerDocument.baseURI);
        const current = new URL(element.ownerDocument.URL);
        let issue = '';
        const samePage = url.origin === current.origin && url.pathname === current.pathname && url.search === current.search;
        if (samePage && raw.trim() === '#') issue = '空のページ内フラグメントです';
        else if (samePage && url.hash) {
            let fragment;
            try { fragment = decodeURIComponent(url.hash.slice(1)); } catch { fragment = url.hash.slice(1); }
            if (!element.ownerDocument.getElementById(fragment)
                && ![...element.ownerDocument.getElementsByName(fragment)].length) issue = `ページ内の参照先 #${fragment} が見つかりません`;
        }
        return { raw, url: url.href, issue };
    } catch {
        return { raw, url: raw, issue: 'URLとして解釈できません' };
    }
}

function contextInfo(element, name) {
    const description = referencedText(element, 'aria-describedby');
    if (description && comparable(description) !== comparable(name)) return { kind: 'aria-describedby', text: description };
    const container = element.closest('p, li, td, th');
    if (container) {
        const parts = [contentText(container)];
        if (container.matches('td, th')) {
            const root = container.getRootNode();
            for (const id of normalizeText(container.getAttribute('headers')).split(' ').filter(Boolean)) {
                const header = root.getElementById?.(id) || element.ownerDocument.getElementById(id);
                if (header) parts.push(contentText(header));
            }
            const row = container.closest('tr');
            if (row) parts.push(...[...row.querySelectorAll('th')].map(contentText));
            const table = container.closest('table');
            if (table && container.cellIndex >= 0) {
                for (const previousRow of [...table.rows].slice(0, row?.rowIndex ?? 0)) {
                    const header = [...previousRow.cells].find(cell => cell.localName === 'th' && cell.cellIndex === container.cellIndex);
                    if (header) parts.push(contentText(header));
                }
            }
        }
        const text = normalizeText([...new Set(parts.filter(Boolean))].join(' '));
        if (text && comparable(text) !== comparable(name)) return { kind: container.localName, text };
    }
    return { kind: '', text: '' };
}

function fileInfo(element) {
    const download = element.hasAttribute('download');
    const downloadName = element.getAttribute('download') || '';
    const extension = extensionFromFilename(downloadName) || extensionFromLink(element);
    return { download, extension: fileExtensions.has(extension) ? extension : '', isFile: download || fileExtensions.has(extension) };
}

function baseLinkInfo(element) {
    const nameInfo = accessibleNameInfo(element);
    const destination = destinationInfo(element);
    const context = contextInfo(element, nameInfo.name);
    const file = fileInfo(element);
    return {
        element,
        nameInfo,
        destination,
        context,
        ...file,
        newWindow: element.getAttribute('target')?.toLowerCase() === '_blank',
        generic: genericNames.has(comparable(nameInfo.name)),
    };
}

function analyseDocument(document) {
    const links = allMatching([document], 'a[href], area[href], [role~="link" i]')
        .filter(isRendered)
        .map(baseLinkInfo);
    const byName = new Map();
    const byDestination = new Map();
    for (const link of links) {
        const name = comparable(link.nameInfo.name);
        if (name) {
            const group = byName.get(name) || [];
            group.push(link);
            byName.set(name, group);
        }
        if (link.destination.url) {
            const group = byDestination.get(link.destination.url) || [];
            group.push(link);
            byDestination.set(link.destination.url, group);
        }
    }
    return links.map(link => {
        const name = comparable(link.nameInfo.name);
        const sameName = name ? byName.get(name) : [];
        const differentDestinations = new Set(sameName.map(item => item.destination.url).filter(Boolean));
        const sameNameDifferentUrl = differentDestinations.size > 1;
        const sameDestination = link.destination.url ? byDestination.get(link.destination.url) : [];
        const differentNames = new Set(sameDestination.map(item => comparable(item.nameInfo.name)).filter(Boolean));
        const sameUrlDifferentName = differentNames.size > 1;
        const missingName = !link.nameInfo.name;
        const genericWithoutContext = link.generic && !link.context.text;
        const isProblem = missingName || Boolean(link.destination.issue) || genericWithoutContext || sameNameDifferentUrl;
        const needsContext = link.generic || sameNameDifferentUrl || sameUrlDifferentName;
        const suffix = link.extension ? link.extension.toUpperCase() : link.download ? 'DL' : '';
        const primaryLabel = missingName ? '名前なし'
            : link.destination.issue ? 'リンク先?'
                : sameNameDifferentUrl ? '同名別URL'
                    : link.generic ? link.context.text ? '文脈確認' : '目的?'
                        : suffix || link.newWindow ? link.newWindow && !suffix ? '新規タブ' : suffix : 'LINK';
        const label = suffix && ![suffix, 'LINK'].includes(primaryLabel) ? `${primaryLabel}・${suffix}` : primaryLabel;
        const notes = [
            `名前: ${link.nameInfo.name ? `「${link.nameInfo.name}」（${link.nameInfo.source}）` : 'なし'}`,
            `リンク先: ${link.destination.url || link.destination.raw || 'なし'}`,
            link.destination.issue && `要確認: ${link.destination.issue}`,
            link.generic && (link.context.text ? 'リンク単独では目的が曖昧な候補です' : '目的を補う文脈を確認できません'),
            link.context.text && `文脈（${link.context.kind}）: 「${link.context.text.slice(0, 180)}${link.context.text.length > 180 ? '…' : ''}」`,
            sameNameDifferentUrl && `同じ名前で異なるリンク先が${differentDestinations.size}件あります`,
            sameUrlDifferentName && `同じリンク先に異なる名前が${differentNames.size}種類あります`,
            link.isFile && `ファイル／ダウンロード: ${link.extension ? `.${link.extension}` : 'download属性'}`,
            link.newWindow && 'target="_blank"で新しい閲覧コンテキストを開きます',
        ].filter(Boolean);
        return {
            element: link.element,
            label,
            severity: missingName ? 'error' : isProblem ? 'warning' : 'info',
            detail: `${elementDescription(link.element)}：${notes.join('。')}`,
            isProblem,
            needsContext,
            isFile: link.isFile,
            hasBehavior: link.newWindow,
        };
    });
}

export function scanLinkPurposes(documents) {
    return documents.flatMap(analyseDocument);
}

if (typeof window !== 'undefined') startInspector({
    id: 'link-purpose-checker',
    title: 'リンクの目的とリンク先',
    scan: scanLinkPurposes,
    initialView: 'problems',
    views: [
        { id: 'problems', label: '問題のみ', filter: result => result.isProblem },
        { id: 'context', label: '文脈・単独名', filter: result => result.needsContext },
        { id: 'files', label: 'ファイル・動作', filter: result => result.isFile || result.hasBehavior },
        { id: 'all', label: 'すべて' },
    ],
});
