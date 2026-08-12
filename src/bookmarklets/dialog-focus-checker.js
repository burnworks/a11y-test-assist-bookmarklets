import { accessibleNameInfo, allMatching, elementDescription, isEffectivelyDisabled } from '../bookmarks-shared.js';
import { hasComposedAncestor, isRendered, startInspector } from '../runtime.js';

const focusableSelector = [
    'a[href]', 'area[href]', 'button', 'input:not([type="hidden" i])', 'select', 'textarea',
    'summary', 'iframe', 'audio[controls]', 'video[controls]', '[contenteditable]', '[tabindex]',
].join(',');

function deepActiveElement(document) {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
}

function composedContains(container, element) {
    let current = element;
    while (current) {
        if (current === container) return true;
        const root = current.getRootNode?.();
        current = current.parentElement || root?.host || null;
    }
    return false;
}

function nativeModal(dialog) {
    try { return dialog.matches(':modal'); } catch { return false; }
}

function dialogState(element) {
    const role = (element.getAttribute('role') || '').toLowerCase().split(/\s+/)[0];
    const native = element.localName === 'dialog';
    if (!(native || role === 'dialog' || role === 'alertdialog')) return null;
    if (native && !element.open && !nativeModal(element)) return null;
    if (!isRendered(element)) return null;
    return {
        role: role === 'alertdialog' ? 'alertdialog' : 'dialog',
        native,
        modal: nativeModal(element) || element.getAttribute('aria-modal')?.toLowerCase() === 'true',
    };
}

function isTabStop(element) {
    return isRendered(element)
        && !isEffectivelyDisabled(element)
        && !hasComposedAncestor(element, '[inert]')
        && element.tabIndex >= 0;
}

export function scanDialogs(documents) {
    const results = [];
    for (const document of documents) {
        const dialogs = allMatching([document], 'dialog, [role~="dialog" i], [role~="alertdialog" i]')
            .map(element => ({ element, state: dialogState(element) }))
            .filter(item => item.state);
        const tabStops = allMatching([document], focusableSelector).filter(isTabStop);
        const active = deepActiveElement(document);
        for (const { element, state } of dialogs) {
            const nameInfo = accessibleNameInfo(element);
            const focusInside = composedContains(element, active);
            const outside = state.modal ? tabStops.filter(candidate => !composedContains(element, candidate)) : [];
            const issues = [
                !nameInfo.name && 'アクセシブルな名前がありません',
                state.modal && !focusInside && 'モーダルダイアログ内にフォーカスがありません',
                outside.length && `ダイアログ外にTab移動先が${outside.length}件あります`,
            ].filter(Boolean);
            results.push({
                element,
                label: `DLG:${state.modal ? 'modal' : 'modeless'}`,
                severity: !nameInfo.name ? 'error' : issues.length ? 'warning' : 'info',
                detail: `${elementDescription(element)}：${state.role}、${state.modal ? 'モーダル' : '非モーダル'}、名前: ${nameInfo.name ? `「${nameInfo.name}」（${nameInfo.source}）` : 'なし'}、フォーカス: ${focusInside ? '内側' : '外側'}${issues.length ? `。要確認: ${issues.join('／')}` : ''}`,
            });
            for (const candidate of outside) results.push({
                element: candidate,
                label: '外Tab',
                severity: 'warning',
                detail: `${elementDescription(candidate)}：モーダル ${elementDescription(element)} の外側にあるTab移動先です。実際にTabキーで移動できないか確認してください。`,
            });
        }
    }
    return results;
}

export function createDialogFocusMonitor() {
    const listening = new WeakSet();
    return (documents, report, addCleanup) => {
        for (const document of documents) {
            if (listening.has(document)) continue;
            listening.add(document);
            const handler = event => {
                const modals = allMatching([document], 'dialog, [role~="dialog" i], [role~="alertdialog" i]')
                    .filter(element => dialogState(element)?.modal);
                for (const dialog of modals) if (!composedContains(dialog, event.target)) report({
                    kind: 'focus',
                    severity: 'warning',
                    message: `モーダル外へ移動: ${elementDescription(event.target)}`,
                    detail: `${elementDescription(dialog)} が開いている間に、フォーカスが ${elementDescription(event.target)} へ移動しました。`,
                });
            };
            document.addEventListener('focusin', handler, true);
            addCleanup(() => document.removeEventListener('focusin', handler, true));
        }
    };
}

const monitorDialogFocus = createDialogFocusMonitor();

if (typeof window !== 'undefined') startInspector({
    id: 'dialog-focus-checker',
    title: 'ダイアログとフォーカス',
    logTitle: 'フォーカス逸脱ログ（新しい順）',
    scan: scanDialogs,
    onDocuments: monitorDialogFocus,
});
