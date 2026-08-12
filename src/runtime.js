const GLOBAL_PREFIX = '__a11yTestAssistBookmarklet__';
const ROOT_ATTRIBUTE = 'data-a11y-test-assist-root';

const COLORS = {
    error: '#b91c1c',
    warning: '#a16207',
    info: '#0369a1',
    success: '#047857',
};

function setStyles(element, declarations) {
    Object.assign(element.style, declarations);
}

function getSameOriginDocuments(startDocument) {
    const documents = [];
    const inaccessibleFrames = [];
    const visit = document => {
        documents.push(document);
        for (const frame of document.querySelectorAll('iframe, frame')) {
            try {
                if (frame.contentDocument?.documentElement) {
                    visit(frame.contentDocument);
                } else {
                    inaccessibleFrames.push(frame);
                }
            } catch {
                inaccessibleFrames.push(frame);
            }
        }
    };
    visit(startDocument);
    return { documents, inaccessibleFrames };
}

export function getRoots(document) {
    const roots = [document];
    const visit = root => {
        for (const element of root.querySelectorAll('*')) {
            if (element.hasAttribute?.(ROOT_ATTRIBUTE)) continue;
            if (element.shadowRoot) {
                roots.push(element.shadowRoot);
                visit(element.shadowRoot);
            }
        }
    };
    visit(document);
    return roots;
}

export function queryAllDeep(document, selector) {
    return getRoots(document).flatMap(root => [...root.querySelectorAll(selector)]);
}

export function isRendered(element) {
    if (!(element instanceof element.ownerDocument.defaultView.Element)) return false;
    if (element.closest('[hidden], [inert]')) return false;
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    return element.getClientRects().length > 0;
}

export function normalizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function referencedText(element, attributeName) {
    const ids = normalizeText(element.getAttribute(attributeName)).split(' ').filter(Boolean);
    return normalizeText(ids.map(id => element.ownerDocument.getElementById(id)?.textContent ?? '').join(' '));
}

function rectInTopViewport(element, topWindow) {
    let rect = element.getBoundingClientRect();
    let currentWindow = element.ownerDocument.defaultView;
    while (currentWindow && currentWindow !== topWindow) {
        let frame;
        try {
            frame = currentWindow.frameElement;
        } catch {
            return null;
        }
        if (!frame) return null;
        const frameRect = frame.getBoundingClientRect();
        rect = {
            left: rect.left + frameRect.left,
            top: rect.top + frameRect.top,
            right: rect.right + frameRect.left,
            bottom: rect.bottom + frameRect.top,
            width: rect.width,
            height: rect.height,
        };
        currentWindow = frame.ownerDocument.defaultView;
    }
    return rect;
}

function makeElement(document, tagName, text) {
    const element = document.createElement(tagName);
    if (text !== undefined) element.textContent = text;
    return element;
}

function createUi(document, id, title, destroy) {
    const host = makeElement(document, 'div');
    host.setAttribute(ROOT_ATTRIBUTE, id);
    setStyles(host, {
        all: 'initial',
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '2147483647',
    });
    const shadow = host.attachShadow({ mode: 'open' });
    const overlay = makeElement(document, 'div');
    const panel = makeElement(document, 'section');
    const heading = makeElement(document, 'strong', title);
    const summary = makeElement(document, 'div', '確認中…');
    const detail = makeElement(document, 'div', '枠にマウスを重ねるか、対象へフォーカスすると詳細を表示します。');
    const button = makeElement(document, 'button', '終了');

    setStyles(overlay, { position: 'fixed', inset: '0', pointerEvents: 'none' });
    setStyles(panel, {
        all: 'initial',
        position: 'fixed',
        top: '12px',
        right: '12px',
        boxSizing: 'border-box',
        width: 'min(360px, calc(100vw - 24px))',
        maxHeight: 'min(45vh, 360px)',
        overflow: 'auto',
        padding: '12px',
        border: '2px solid #111827',
        borderRadius: '8px',
        background: '#ffffff',
        color: '#111827',
        boxShadow: '0 4px 18px rgba(0,0,0,.28)',
        font: '14px/1.45 system-ui, sans-serif',
        pointerEvents: 'auto',
    });
    setStyles(heading, { display: 'block', paddingRight: '60px', fontWeight: '700', fontSize: '15px' });
    setStyles(summary, { marginTop: '6px', fontWeight: '600' });
    setStyles(detail, { marginTop: '8px', overflowWrap: 'anywhere' });
    setStyles(button, {
        all: 'revert',
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '4px 9px',
        border: '1px solid #374151',
        borderRadius: '5px',
        background: '#f9fafb',
        color: '#111827',
        font: '600 13px/1.4 system-ui, sans-serif',
        cursor: 'pointer',
    });
    button.addEventListener('click', destroy);
    panel.append(heading, summary, detail, button);
    shadow.append(overlay, panel);
    (document.body || document.documentElement).append(host);
    return { host, overlay, panel, summary, detail };
}

function createMarker(document, result, select) {
    const marker = makeElement(document, 'div');
    const badge = makeElement(document, 'span', result.label);
    const color = COLORS[result.severity] || COLORS.info;
    marker.dataset.a11yMarker = '';
    setStyles(marker, {
        position: 'fixed',
        boxSizing: 'border-box',
        border: `3px ${result.borderStyle || 'solid'} ${color}`,
        borderRadius: '3px',
        boxShadow: '0 0 0 1px #fff',
        pointerEvents: 'none',
    });
    setStyles(badge, {
        position: 'absolute',
        left: '-3px',
        top: '-3px',
        transform: 'translateY(-100%)',
        padding: '1px 4px',
        borderRadius: '3px 3px 0 0',
        background: color,
        color: '#fff',
        font: '700 12px/1.4 system-ui, sans-serif',
        whiteSpace: 'nowrap',
    });
    marker.append(badge);
    marker._a11yResult = result;
    marker._a11ySelect = select;
    return marker;
}

export function startInspector(config) {
    const topWindow = window;
    const topDocument = document;
    const stateKey = `${GLOBAL_PREFIX}${config.id}`;
    if (topWindow[stateKey]?.destroy) {
        topWindow[stateKey].destroy();
        return null;
    }

    let destroyed = false;
    let scheduled = false;
    let results = [];
    let markers = [];
    let observers = [];
    let listeningDocuments = [];
    let ui;

    const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        observers.forEach(observer => observer.disconnect());
        observers = [];
        for (const currentDocument of listeningDocuments) {
            currentDocument.removeEventListener('pointerover', selectFromEvent, true);
            currentDocument.removeEventListener('focusin', selectFromEvent, true);
            currentDocument.removeEventListener('focusin', scheduleScan, true);
            currentDocument.defaultView?.removeEventListener('scroll', scheduleDraw, true);
            currentDocument.defaultView?.removeEventListener('resize', scheduleDraw, true);
        }
        listeningDocuments = [];
        ui?.host.remove();
        delete topWindow[stateKey];
    };

    ui = createUi(topDocument, config.id, config.title, destroy);

    const showDetail = result => {
        if (!result) return;
        ui.detail.textContent = result.detail || result.label;
    };

    function selectFromEvent(event) {
        const path = event.composedPath?.() || [event.target];
        const result = results.find(item => path.some(node => node === item.element || item.element?.contains?.(node)));
        if (result) showDetail(result);
    }

    function draw() {
        scheduled = false;
        markers.forEach(marker => marker.remove());
        markers = [];
        for (const result of results) {
            const rect = rectInTopViewport(result.element, topWindow);
            if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.right < 0 || rect.top > topWindow.innerHeight || rect.left > topWindow.innerWidth) continue;
            const marker = createMarker(topDocument, result, showDetail);
            setStyles(marker, {
                left: `${Math.max(0, rect.left)}px`,
                top: `${Math.max(0, rect.top)}px`,
                width: `${Math.max(1, Math.min(rect.right, topWindow.innerWidth) - Math.max(0, rect.left))}px`,
                height: `${Math.max(1, Math.min(rect.bottom, topWindow.innerHeight) - Math.max(0, rect.top))}px`,
            });
            ui.overlay.append(marker);
            markers.push(marker);
        }
    }

    function scheduleDraw() {
        if (destroyed || scheduled) return;
        scheduled = true;
        topWindow.requestAnimationFrame(draw);
    }

    function attach(documentList) {
        observers.forEach(observer => observer.disconnect());
        observers = [];
        for (const currentDocument of listeningDocuments) {
            currentDocument.removeEventListener('pointerover', selectFromEvent, true);
            currentDocument.removeEventListener('focusin', selectFromEvent, true);
            currentDocument.removeEventListener('focusin', scheduleScan, true);
            currentDocument.defaultView?.removeEventListener('scroll', scheduleDraw, true);
            currentDocument.defaultView?.removeEventListener('resize', scheduleDraw, true);
        }
        listeningDocuments = documentList;
        for (const currentDocument of documentList) {
            currentDocument.addEventListener('pointerover', selectFromEvent, true);
            currentDocument.addEventListener('focusin', selectFromEvent, true);
            currentDocument.addEventListener('focusin', scheduleScan, true);
            currentDocument.defaultView?.addEventListener('scroll', scheduleDraw, true);
            currentDocument.defaultView?.addEventListener('resize', scheduleDraw, true);
            for (const root of getRoots(currentDocument)) {
                const observer = new currentDocument.defaultView.MutationObserver(scheduleScan);
                observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
                observers.push(observer);
            }
        }
    }

    function scan() {
        scheduled = false;
        if (destroyed) return;
        const context = getSameOriginDocuments(topDocument);
        results = config.scan(context.documents).filter(result => result?.element);
        const counts = results.reduce((map, result) => map.set(result.severity, (map.get(result.severity) || 0) + 1), new Map());
        const countText = [...counts].map(([severity, count]) => `${severity}: ${count}`).join(' / ');
        ui.summary.textContent = `${results.length}件${countText ? `（${countText}）` : ''}${context.inaccessibleFrames.length ? `・検査不能iframe ${context.inaccessibleFrames.length}件` : ''}`;
        attach(context.documents);
        draw();
    }

    function scheduleScan() {
        if (destroyed || scheduled) return;
        scheduled = true;
        topWindow.requestAnimationFrame(scan);
    }

    const controller = { destroy, refresh: scheduleScan };
    topWindow[stateKey] = controller;
    scan();
    return controller;
}
