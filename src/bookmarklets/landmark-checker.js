import { accessibleNameInfo, allMatching, elementDescription } from '../bookmarks-shared.js';
import { isRendered, startInspector } from '../runtime.js';

const landmarkRoles = new Set([
    'banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation', 'region', 'search',
]);

function explicitLandmarkRole(element) {
    return (element.getAttribute('role') || '').toLowerCase().split(/\s+/).find(role => landmarkRoles.has(role)) || '';
}

function isNestedSectioningContent(element) {
    return Boolean(element.parentElement?.closest('article, aside, main, nav, section'));
}

export function landmarkInfo(element) {
    const explicit = explicitLandmarkRole(element);
    if (explicit) return { role: explicit, source: 'role属性' };
    if (element.hasAttribute('role')) return null;
    if (element.localName === 'main') return { role: 'main', source: 'main要素' };
    if (element.localName === 'nav') return { role: 'navigation', source: 'nav要素' };
    if (element.localName === 'aside') return { role: 'complementary', source: 'aside要素' };
    if (element.localName === 'search') return { role: 'search', source: 'search要素' };
    if (element.localName === 'header' && !isNestedSectioningContent(element)) return { role: 'banner', source: 'header要素' };
    if (element.localName === 'footer' && !isNestedSectioningContent(element)) return { role: 'contentinfo', source: 'footer要素' };
    if (element.localName === 'form' || element.localName === 'section') {
        const name = accessibleNameInfo(element).name;
        if (name) return { role: element.localName === 'form' ? 'form' : 'region', source: `${element.localName}要素` };
    }
    return null;
}

export function scanLandmarks(documents) {
    const landmarks = allMatching(documents, '*')
        .filter(isRendered)
        .map(element => ({ element, info: landmarkInfo(element), nameInfo: accessibleNameInfo(element) }))
        .filter(item => item.info);
    const roleCounts = new Map();
    const nameCounts = new Map();
    for (const { info, nameInfo } of landmarks) {
        roleCounts.set(info.role, (roleCounts.get(info.role) || 0) + 1);
        const name = nameInfo.name.toLocaleLowerCase();
        if (name) nameCounts.set(`${info.role}::${name}`, (nameCounts.get(`${info.role}::${name}`) || 0) + 1);
    }
    return landmarks.map(({ element, info, nameInfo }) => {
        const count = roleCounts.get(info.role);
        const duplicateSingleton = ['main', 'banner', 'contentinfo'].includes(info.role) && count > 1;
        const needsDistinctName = count > 1;
        const duplicateName = nameInfo.name && nameCounts.get(`${info.role}::${nameInfo.name.toLocaleLowerCase()}`) > 1;
        const requiredNameMissing = ['region', 'form'].includes(info.role) && !nameInfo.name;
        const issues = [
            duplicateSingleton && `${info.role} が${count}件あります`,
            requiredNameMissing && `${info.role} にはアクセシブルな名前が必要です`,
            needsDistinctName && !nameInfo.name && `同じ役割が複数あるため識別できる名前を確認してください`,
            duplicateName && `同じ役割・名前のランドマークが複数あります`,
        ].filter(Boolean);
        return {
            element,
            label: `LM:${info.role}${nameInfo.name ? `「${nameInfo.name.slice(0, 18)}」` : ''}`,
            severity: issues.length ? 'warning' : 'info',
            detail: `${elementDescription(element)}：${info.role} ランドマーク（${info.source}）。名前: ${nameInfo.name ? `「${nameInfo.name}」（${nameInfo.source}）` : 'なし'}${issues.length ? `。要確認: ${issues.join('／')}` : ''}`,
        };
    });
}

if (typeof window !== 'undefined') startInspector({
    id: 'landmark-checker',
    title: 'ランドマーク',
    scan: scanLandmarks,
});
