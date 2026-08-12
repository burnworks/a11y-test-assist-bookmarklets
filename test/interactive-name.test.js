import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanInteractiveNames } from '../src/bookmarklets/interactive-name-checker.js';

function fixture(html) {
    const dom = new JSDOM(html);
    for (const element of dom.window.document.querySelectorAll('*')) element.getClientRects = () => [{}];
    return dom.window.document;
}

function byId(results) {
    return Object.fromEntries(results.map(result => [result.element.id, result]));
}

test('interactive name checker includes links, controls, and common ARIA widgets', () => {
    const results = byId(scanInteractiveNames([fixture(`
        <a id="link" href="/"><img alt="Home"></a>
        <button id="button">Save</button>
        <div id="tab" role="TAB presentation">Profile</div>
        <label for="input">Email</label><input id="input">
        <a id="empty" href="/"><img alt=""></a>
    `)]));
    assert.equal(results.link.severity, 'success');
    assert.match(results.link.detail, /Home/);
    assert.equal(results.button.label, '内容テキスト');
    assert.equal(results.tab.severity, 'success');
    assert.equal(results.input.scope, 'form');
    assert.equal(results.empty.severity, 'error');
});

test('visible label absent from the accessible name is flagged once on the interactive element', () => {
    const results = scanInteractiveNames([fixture('<button id="save" aria-label="Store">Save</button>')]);
    assert.equal(results.length, 1);
    assert.equal(results[0].label, '表示不一致');
    assert.match(results[0].detail, /可視ラベル「Save」/);
});

test('fallback names remain warnings', () => {
    const results = byId(scanInteractiveNames([fixture('<input id="placeholder" placeholder="Search"><a id="title" href="/" title="Help"></a>')]));
    assert.equal(results.placeholder.severity, 'warning');
    assert.equal(results.title.label, 'titleのみ');
});
