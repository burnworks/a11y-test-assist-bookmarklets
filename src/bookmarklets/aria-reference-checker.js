import { elementDescription } from '../bookmarks-shared.js';
import { getRoots, normalizeText, startInspector } from '../runtime.js';

const RULES = [
    { attribute: 'aria-labelledby', multiple: true },
    { attribute: 'aria-describedby', multiple: true },
    { attribute: 'aria-controls', multiple: true },
    { attribute: 'aria-owns', multiple: true },
    { attribute: 'aria-flowto', multiple: true },
    { attribute: 'aria-activedescendant', multiple: false },
    { attribute: 'aria-details', multiple: true },
    { attribute: 'aria-errormessage', multiple: false },
    { attribute: 'headers', multiple: true, targetSelector: 'th' },
    { attribute: 'list', multiple: false, targetSelector: 'datalist' },
    { attribute: 'form', multiple: false, targetSelector: 'form' },
    { attribute: 'popovertarget', multiple: false, targetSelector: '[popover]' },
];

function idsFor(element, rule) {
    const value = normalizeText(element.getAttribute(rule.attribute));
    if (!value) return [];
    return value.split(' ');
}

function rootElements(root) {
    return [...root.querySelectorAll('*')];
}

function idIndex(root) {
    const index = new Map();
    for (const element of root.querySelectorAll('[id]')) {
        if (!element.id) continue;
        const matches = index.get(element.id) || [];
        matches.push(element);
        index.set(element.id, matches);
    }
    return index;
}

function labelledByCycle(start, index) {
    const visiting = new Set();
    const visited = new Set();
    const visit = element => {
        if (visiting.has(element)) return true;
        if (visited.has(element)) return false;
        visiting.add(element);
        for (const id of normalizeText(element.getAttribute('aria-labelledby')).split(' ').filter(Boolean)) {
            const target = index.get(id)?.[0];
            if (target && visit(target)) return true;
        }
        visiting.delete(element);
        visited.add(element);
        return false;
    };
    return visit(start);
}

function ruleForElement(element) {
    const rules = RULES.filter(rule => element.hasAttribute(rule.attribute));
    if (element.localName === 'label' && element.hasAttribute('for')) rules.push({ attribute: 'for', multiple: false, targetSelector: 'button, input:not([type="hidden" i]), meter, output, progress, select, textarea' });
    if (element.localName === 'output' && element.hasAttribute('for')) rules.push({ attribute: 'for', multiple: true });
    return rules;
}

function targetSummary(target) {
    const text = normalizeText(target.textContent);
    return `${elementDescription(target)}${text ? `「${text.slice(0, 80)}${text.length > 80 ? '…' : ''}」` : ''}`;
}

export function scanAriaReferences(documents) {
    const results = [];
    for (const document of documents) {
        for (const root of getRoots(document)) {
            const index = idIndex(root);
            for (const [id, elements] of index) {
                if (elements.length < 2) continue;
                for (const element of elements) {
                    results.push({
                        element,
                        label: `ID×${elements.length}`,
                        severity: 'error',
                        detail: `${elementDescription(element)}：id="${id}" が同じDOMツリー内に${elements.length}件あります。`,
                    });
                }
            }

            for (const element of rootElements(root)) {
                for (const rule of ruleForElement(element)) {
                    const ids = idsFor(element, rule);
                    const missing = [];
                    const ambiguous = [];
                    const wrongType = [];
                    const resolved = [];
                    for (const id of ids) {
                        const matches = index.get(id) || [];
                        if (!matches.length) {
                            missing.push(id);
                            continue;
                        }
                        if (matches.length > 1) ambiguous.push(id);
                        const target = matches[0];
                        if (rule.targetSelector && !target.matches(rule.targetSelector)) wrongType.push(id);
                        resolved.push(target);
                    }
                    const empty = ids.length === 0;
                    const tooMany = !rule.multiple && ids.length > 1;
                    const selfReference = resolved.includes(element);
                    const activeOutside = rule.attribute === 'aria-activedescendant' && resolved[0]
                        && !element.contains(resolved[0])
                        && !normalizeText(element.getAttribute('aria-owns')).split(' ').includes(resolved[0].id);
                    const cycle = rule.attribute === 'aria-labelledby' && labelledByCycle(element, index);
                    const errors = [
                        empty && '値が空',
                        missing.length && `参照先なし: ${missing.join(', ')}`,
                        ambiguous.length && `重複IDを参照: ${ambiguous.join(', ')}`,
                        wrongType.length && `要素型が不適切: ${wrongType.join(', ')}`,
                    ].filter(Boolean);
                    const warnings = [
                        tooMany && '単一ID参照に空白を含む値',
                        selfReference && '自分自身を参照',
                        activeOutside && 'aria-activedescendantが子孫またはaria-owns参照ではない',
                        cycle && 'aria-labelledby参照が循環',
                    ].filter(Boolean);
                    const severity = errors.length ? 'error' : warnings.length ? 'warning' : 'success';
                    const targetText = resolved.length ? `参照先: ${resolved.map(targetSummary).join(' / ')}` : '';
                    results.push({
                        element,
                        label: errors.length ? 'REF!' : warnings.length ? 'REF?' : 'REF',
                        severity,
                        detail: `${elementDescription(element)} ${rule.attribute}="${element.getAttribute(rule.attribute)}"：${[...errors, ...warnings, targetText || '参照先を確認できません'].join('。')}`,
                    });
                }
            }
        }
    }
    return results;
}

if (typeof window !== 'undefined') startInspector({
    id: 'aria-reference-checker',
    title: 'ARIA・HTML ID参照',
    scan: scanAriaReferences,
});
