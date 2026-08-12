import { allMatching, elementDescription } from '../bookmarks-shared.js';
import { normalizeText, startInspector } from '../runtime.js';

const IMPLICIT_LIVE = new Map([
    ['alert', { live: 'assertive', atomic: true }],
    ['status', { live: 'polite', atomic: true }],
    ['log', { live: 'polite', atomic: false }],
    ['marquee', { live: 'off', atomic: false }],
    ['timer', { live: 'off', atomic: false }],
]);
const VALID_LIVE = new Set(['off', 'polite', 'assertive']);
const WRAPPED = Symbol('a11yTestAssistAriaNotifyWrapper');

function roleTokens(element) {
    return normalizeText(element.getAttribute('role')).toLowerCase().split(' ').filter(Boolean);
}

export function liveRegionInfo(element) {
    const explicit = element.hasAttribute('aria-live');
    const rawLive = normalizeText(element.getAttribute('aria-live')).toLowerCase();
    const role = roleTokens(element).find(token => IMPLICIT_LIVE.has(token)) || '';
    if (!explicit && !role) return null;
    const implicit = IMPLICIT_LIVE.get(role);
    const invalidLive = explicit && !VALID_LIVE.has(rawLive);
    const live = explicit && !invalidLive ? rawLive : implicit?.live || 'off';
    const rawAtomic = normalizeText(element.getAttribute('aria-atomic')).toLowerCase();
    const atomic = rawAtomic === 'true' || (!element.hasAttribute('aria-atomic') && Boolean(implicit?.atomic));
    const relevant = normalizeText(element.getAttribute('aria-relevant')).toLowerCase() || 'additions text';
    const busy = normalizeText(element.getAttribute('aria-busy')).toLowerCase() === 'true';
    return { explicit, rawLive, invalidLive, live, role, atomic, relevant, busy };
}

function composedParent(node) {
    const parent = node.parentElement || node.parentNode;
    if (parent?.nodeType === 1) return parent;
    return node.getRootNode?.()?.host || null;
}

export function closestLiveRegion(node) {
    let element = node?.nodeType === 1 ? node : node?.parentElement;
    while (element) {
        if (liveRegionInfo(element)) return element;
        element = composedParent(element);
    }
    return null;
}

function regionDetail(element, info) {
    const text = normalizeText(element.textContent);
    return `${elementDescription(element)}：live=${info.live}${info.invalidLive ? `（不正な指定「${info.rawLive || '空'}」）` : ''}${info.role ? `、role=${info.role}` : ''}、atomic=${info.atomic}、relevant=${info.relevant}、busy=${info.busy}${text ? `、内容「${text}」` : '、内容は空'}`;
}

export function scanLiveRegions(documents) {
    return allMatching(documents, '[aria-live], [role]').flatMap(element => {
        const info = liveRegionInfo(element);
        if (!info) return [];
        return [{
            element,
            label: info.invalidLive ? 'LIVE !' : `LIVE ${info.live}`,
            severity: info.invalidLive ? 'error' : info.live === 'assertive' ? 'warning' : 'info',
            detail: regionDetail(element, info),
        }];
    });
}

function textFromNodes(nodes) {
    return normalizeText([...nodes].map(node => node.textContent || node.nodeValue || '').join(' '));
}

export function mutationReports(records) {
    const grouped = new Map();
    const directReports = [];
    const add = (region, record) => {
        if (!region) return;
        const current = grouped.get(region) || { region, types: new Set(), added: [], removed: [], attributes: [] };
        current.types.add(record.type);
        if (record.type === 'childList') {
            const added = textFromNodes(record.addedNodes);
            const removed = textFromNodes(record.removedNodes);
            if (added) current.added.push(added);
            if (removed) current.removed.push(removed);
        }
        if (record.type === 'characterData') current.types.add('text');
        if (record.type === 'attributes') current.attributes.push(record.attributeName);
        grouped.set(region, current);
    };

    for (const record of records) {
        const closest = closestLiveRegion(record.target);
        add(closest, record);
        if (!closest && record.type === 'attributes' && ['aria-live', 'role'].includes(record.attributeName) && record.oldValue) {
            directReports.push({
                kind: 'live',
                severity: 'warning',
                message: `${record.attributeName}の変更によりライブリージョンではなくなりました`,
                detail: `${elementDescription(record.target)}：変更前の値「${record.oldValue}」`,
            });
        }
        if (record.type === 'childList') {
            for (const node of [...record.addedNodes, ...record.removedNodes]) {
                if (node.nodeType !== 1) continue;
                if (liveRegionInfo(node)) add(node, record);
                for (const region of node.querySelectorAll?.('[aria-live], [role]') || []) {
                    if (liveRegionInfo(region)) add(region, record);
                }
            }
        }
    }

    return [...grouped.values()].map(change => {
        const info = liveRegionInfo(change.region);
        const currentText = normalizeText(change.region.textContent);
        const added = normalizeText(change.added.join(' '));
        const removed = normalizeText(change.removed.join(' '));
        const changeParts = [added && `追加「${added}」`, removed && `削除「${removed}」`, change.attributes.length && `属性変更 ${[...new Set(change.attributes)].join(', ')}`].filter(Boolean);
        const relevantTokens = new Set(info.relevant.split(' '));
        const relevant = relevantTokens.has('all')
            || (Boolean(added) && relevantTokens.has('additions'))
            || (Boolean(removed) && relevantTokens.has('removals'))
            || (change.types.has('text') && relevantTokens.has('text'))
            || change.attributes.length > 0;
        const expected = info.atomic ? currentText : added || removed || currentText;
        const active = change.region.ownerDocument.activeElement;
        const offNote = info.live === 'off' && (change.region === active || change.region.contains(active))
            ? 'aria-live=off（フォーカスは領域内）'
            : info.live === 'off' && 'aria-live=off（通常は領域内にフォーカスがある場合のみ通知）';
        const notes = [info.busy && 'aria-busy=trueのため通知保留の可能性', !relevant && 'aria-relevantの対象外', offNote].filter(Boolean);
        return {
            kind: 'live',
            severity: info.invalidLive ? 'error' : info.live === 'assertive' ? 'warning' : 'info',
            message: `${info.role || 'aria-live'} / ${info.live}：${changeParts.join('、') || '内容更新'}`,
            detail: `${regionDetail(change.region, info)}${expected ? `。通知候補「${expected}」` : ''}${notes.length ? `。${notes.join('、')}` : ''}`,
        };
    }).concat(directReports);
}

function notifyTarget(target) {
    if (target?.nodeType === 9) return 'document';
    return target?.localName ? elementDescription(target) : 'unknown';
}

function instrumentProperty(target, property, report, addCleanup) {
    const descriptor = Object.getOwnPropertyDescriptor(target, property);
    if (!descriptor || typeof descriptor.value !== 'function' || descriptor.value[WRAPPED]) return false;
    const original = descriptor.value;
    function wrappedAriaNotify(announcement, options = {}) {
        const priority = options?.priority || 'normal';
        report({
            kind: 'ariaNotify',
            severity: priority === 'high' ? 'warning' : 'info',
            message: `${priority}：「${String(announcement)}」`,
            detail: `${notifyTarget(this)}.ariaNotify()、priority=${priority}`,
        });
        return Reflect.apply(original, this, arguments);
    }
    wrappedAriaNotify[WRAPPED] = true;
    try {
        Object.defineProperty(target, property, { ...descriptor, value: wrappedAriaNotify });
    } catch {
        return false;
    }
    addCleanup(() => {
        if (Object.getOwnPropertyDescriptor(target, property)?.value === wrappedAriaNotify) {
            Object.defineProperty(target, property, descriptor);
        }
    });
    return true;
}

export function createAriaNotifyInstrumentation() {
    const documents = new Set();
    const checkedUnsupported = new WeakSet();
    let interval = null;
    const instrument = (document, report, addCleanup) => {
        const view = document.defaultView;
        if (!view) return;
        const supported = typeof document.ariaNotify === 'function'
            || typeof view.Element.prototype.ariaNotify === 'function'
            || typeof view.HTMLElement?.prototype.ariaNotify === 'function';
        instrumentProperty(view.Document.prototype, 'ariaNotify', report, addCleanup);
        instrumentProperty(view.Element.prototype, 'ariaNotify', report, addCleanup);
        if (view.HTMLElement) instrumentProperty(view.HTMLElement.prototype, 'ariaNotify', report, addCleanup);
        if (view.SVGElement) instrumentProperty(view.SVGElement.prototype, 'ariaNotify', report, addCleanup);
        instrumentProperty(document, 'ariaNotify', report, addCleanup);
        if (!supported && !checkedUnsupported.has(document)) {
            checkedUnsupported.add(document);
            report({ kind: '監視', severity: 'info', message: 'このdocumentではariaNotify APIが見つかりません', detail: 'APIを追加せず、ライブリージョンの更新だけを監視します。' });
        }
    };
    return (nextDocuments, report, addCleanup) => {
        documents.clear();
        nextDocuments.forEach(document => documents.add(document));
        documents.forEach(document => instrument(document, report, addCleanup));
        if (interval === null) {
            interval = setInterval(() => documents.forEach(document => instrument(document, report, addCleanup)), 1000);
            addCleanup(() => clearInterval(interval));
        }
    };
}

const instrumentAriaNotify = createAriaNotifyInstrumentation();

if (typeof window !== 'undefined') startInspector({
    id: 'live-regions-check',
    title: 'ライブリージョン監視',
    logTitle: '更新ログ（新しい順）',
    scan: scanLiveRegions,
    onMutations: (records, report) => mutationReports(records).forEach(report),
    onDocuments: instrumentAriaNotify,
});
