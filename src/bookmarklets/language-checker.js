import { allMatching, elementDescription } from '../bookmarks-shared.js';
import { isRendered, normalizeText, startInspector } from '../runtime.js';

const grandfatheredTags = new Set([
    'art-lojban', 'cel-gaulish', 'en-gb-oed', 'i-ami', 'i-bnn', 'i-default', 'i-enochian',
    'i-hak', 'i-klingon', 'i-lux', 'i-mingo', 'i-navajo', 'i-pwn', 'i-tao', 'i-tay', 'i-tsu',
    'no-bok', 'no-nyn', 'sgn-be-fr', 'sgn-be-nl', 'sgn-ch-de', 'zh-guoyu', 'zh-hakka',
    'zh-min', 'zh-min-nan', 'zh-xiang',
]);

export function languageTagInfo(value) {
    const tag = normalizeText(value);
    if (!tag) return { valid: false, empty: true, canonical: '' };
    if (grandfatheredTags.has(tag.toLowerCase()) || /^x(?:-[a-z0-9]{1,8})+$/i.test(tag)) {
        return { valid: true, canonical: tag };
    }
    try {
        return { valid: true, canonical: Intl.getCanonicalLocales(tag)[0] };
    } catch {
        return { valid: false, empty: false, canonical: '' };
    }
}

function languageAttributes(element) {
    const html = element.hasAttribute('lang') ? element.getAttribute('lang') : null;
    const xml = element.hasAttribute('xml:lang') ? element.getAttribute('xml:lang') : null;
    return { html, xml, effective: html !== null ? html : xml };
}

function inheritedLanguage(element) {
    let current = element;
    while (current) {
        const attributes = languageAttributes(current);
        if (attributes.effective !== null) return normalizeText(attributes.effective);
        const root = current.getRootNode?.();
        current = current.parentElement || root?.host || null;
    }
    return '';
}

function resultFor(element, pageRoot = false) {
    const attributes = languageAttributes(element);
    if (pageRoot && attributes.effective === null) return {
        element,
        label: 'LANGなし',
        severity: 'error',
        detail: `${elementDescription(element)}：文書の既定言語を示す lang 属性がありません。`,
    };
    const info = languageTagInfo(attributes.effective);
    const conflict = attributes.html !== null && attributes.xml !== null
        && normalizeText(attributes.html).toLowerCase() !== normalizeText(attributes.xml).toLowerCase();
    const parentLanguage = pageRoot ? '' : inheritedLanguage(element.parentElement || element.getRootNode()?.host);
    const notes = [
        info.empty && (pageRoot ? '文書の既定言語が空です' : '継承した言語を「不明」にリセットします'),
        !info.valid && !info.empty && 'BCP 47言語タグとして解釈できません',
        conflict && `lang="${attributes.html}" と xml:lang="${attributes.xml}" が一致しません（HTMLではlangが優先）`,
        info.valid && info.canonical.toLowerCase() !== normalizeText(attributes.effective).toLowerCase() && `正規化表記: ${info.canonical}`,
        parentLanguage && `変更前の言語: ${parentLanguage}`,
    ].filter(Boolean);
    const value = normalizeText(attributes.effective);
    return {
        element,
        label: info.valid ? `LANG:${value}` : info.empty ? 'LANG空' : `LANG不正:${value}`,
        severity: info.empty ? pageRoot ? 'error' : 'warning' : !info.valid ? 'error' : conflict ? 'warning' : pageRoot ? 'success' : 'info',
        detail: `${elementDescription(element)}：${pageRoot ? '文書の既定言語' : '部分的な言語指定'} ${value ? `lang="${value}"` : 'lang=""'}${notes.length ? `。${notes.join('。')}` : ''}`,
    };
}

export function scanLanguages(documents) {
    const results = [];
    for (const document of documents) {
        const root = document.documentElement;
        if (root) results.push(resultFor(root, true));
        const explicit = allMatching([document], '[lang], [xml\\:lang]')
            .filter(element => element !== root && isRendered(element));
        for (const element of explicit) results.push(resultFor(element));
    }
    return results;
}

if (typeof window !== 'undefined') startInspector({
    id: 'language-checker',
    title: 'ページと部分の言語',
    scan: scanLanguages,
});
