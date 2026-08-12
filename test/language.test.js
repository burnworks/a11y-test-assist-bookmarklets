import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { languageTagInfo, scanLanguages } from '../src/bookmarklets/language-checker.js';

function fixture(html) {
    const dom = new JSDOM(html);
    for (const element of dom.window.document.querySelectorAll('*')) element.getClientRects = () => [{}];
    return dom.window.document;
}

function byId(results) {
    return Object.fromEntries(results.map(result => [result.element.id || 'root', result]));
}

test('language tag validation accepts canonical and grandfathered tags and rejects malformed values', () => {
    assert.deepEqual(languageTagInfo('ja-JP'), { valid: true, canonical: 'ja-JP' });
    assert.equal(languageTagInfo('i-klingon').valid, true);
    assert.equal(languageTagInfo('x-company').valid, true);
    assert.equal(languageTagInfo('ja_JP').valid, false);
    assert.equal(languageTagInfo('  ').empty, true);
});

test('language checker reports page language, changes, empty values, invalid tags, and conflicts', () => {
    const results = byId(scanLanguages([fixture(`<!doctype html><html lang="ja"><body>
        <p id="english" lang="en">English</p>
        <p id="empty" lang="">Unknown</p>
        <p id="invalid" lang="ja_JP">Invalid</p>
        <p id="conflict" lang="fr" xml:lang="de">Bonjour</p>
    </body></html>`)]));
    assert.equal(results.root.severity, 'success');
    assert.equal(results.english.severity, 'info');
    assert.match(results.english.detail, /変更前の言語: ja/);
    assert.equal(results.empty.severity, 'warning');
    assert.equal(results.invalid.severity, 'error');
    assert.equal(results.conflict.severity, 'warning');
});

test('missing page language is an error and open shadow roots are inspected', () => {
    const document = fixture('<!doctype html><html><body><div id="host"></div></body></html>');
    const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<span id="shadow-language" lang="en">English</span>';
    shadow.querySelector('span').getClientRects = () => [{}];
    const results = byId(scanLanguages([document]));
    assert.equal(results.root.label, 'LANGなし');
    assert.equal(results['shadow-language'].severity, 'info');
});
