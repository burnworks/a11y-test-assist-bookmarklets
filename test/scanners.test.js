import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { accessibleNameInfo, extensionFromLink } from '../src/bookmarks-shared.js';
import { scanFocusable } from '../src/bookmarklets/focusable-element-checker.js';
import { scanHeaderCells } from '../src/bookmarklets/header-cell-scope-indicator.js';
import { scanImageAlternatives } from '../src/bookmarklets/image-alt-attribute-checker.js';
import { scanNonHtmlLinks } from '../src/bookmarklets/non-html-link-highlighter.js';
import { scanInteractiveNames } from '../src/bookmarklets/interactive-name-checker.js';
import { scanHeadings } from '../src/bookmarklets/show-heading-level.js';

function fixture(html, url = 'https://example.com/page') {
    const dom = new JSDOM(html, { url });
    const { document } = dom.window;
    for (const element of document.querySelectorAll('*')) {
        element.getClientRects = () => [{ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 }];
        element.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 });
    }
    return document;
}

function byId(results) {
    return Object.fromEntries(results.map(result => [result.element.id, result]));
}

test('accessible name uses ARIA references before aria-label and native labels', () => {
    const document = fixture(`
        <span id="first">First</span><span id="second">Second</span>
        <label for="control">Native label</label>
        <input id="control" aria-labelledby="first second" aria-label="ARIA label">
    `);
    assert.deepEqual(accessibleNameInfo(document.querySelector('input')), {
        name: 'First Second', source: 'aria-labelledby',
    });
});

test('form checker distinguishes good names, fallback names, and missing names', () => {
    const document = fixture(`
        <label for="named">Email</label><input id="named">
        <input id="fallback" placeholder="Search">
        <input id="missing">
        <button id="button"><img alt="Save"></button>
        <input id="default-submit" type="submit">
        <input type="hidden" id="hidden">
    `);
    const results = byId(scanInteractiveNames([document]));
    assert.equal(results.named.severity, 'success');
    assert.equal(results.fallback.severity, 'warning');
    assert.equal(results.missing.severity, 'error');
    assert.match(results.button.detail, /Save/);
    assert.match(results['default-submit'].detail, /ブラウザ既定/);
    assert.equal(results.hidden, undefined);
});

test('image checker classifies missing, empty, whitespace, and actionable empty alt', () => {
    const document = fixture(`
        <img id="missing">
        <img id="decorative" alt="">
        <img id="whitespace" alt="   ">
        <a href="/next"><img id="link-only" alt=""></a>
        <a href="/next"><img id="link-with-text" alt=""> Read more</a>
        <input id="image-button" type="image" alt="">
    `);
    const results = byId(scanImageAlternatives([document]));
    assert.equal(results.missing.severity, 'error');
    assert.equal(results.decorative.severity, 'info');
    assert.equal(results.whitespace.severity, 'warning');
    assert.equal(results['link-only'].severity, 'error');
    assert.equal(results['link-with-text'].severity, 'info');
    assert.equal(results['image-button'].severity, 'error');
});

test('focus checker numbers one radio in a group and reports mouse-only controls', () => {
    const document = fixture(`
        <a id="link" href="/">Link</a>
        <input id="r1" type="radio" name="choice">
        <input id="r2" type="radio" name="choice" checked>
        <fieldset disabled><button id="disabled-by-fieldset">No</button></fieldset>
        <div id="mouse-only" role="button" onclick="void 0">Mouse only</div>
        <button id="positive" tabindex="2">First</button>
    `);
    const results = byId(scanFocusable([document]));
    assert.equal(results.r1, undefined);
    assert.ok(results.r2);
    assert.equal(results['disabled-by-fieldset'], undefined);
    assert.equal(results['mouse-only'].severity, 'error');
    assert.match(results.positive.detail, /正のtabindex=2/);
});

test('heading checker supports ARIA headings and reports skipped or removed semantics', () => {
    const document = fixture(`
        <h1 id="one">One</h1>
        <h3 id="three">Three</h3>
        <div id="aria" role="heading" aria-level="4">Four</div>
        <div id="invalid" role="heading">Unknown</div>
        <h2 id="removed" role="presentation">Not a heading</h2>
    `);
    const results = byId(scanHeadings([document]));
    assert.equal(results.one.severity, 'info');
    assert.equal(results.three.severity, 'warning');
    assert.equal(results.aria.label, 'H4');
    assert.equal(results.invalid.severity, 'error');
    assert.equal(results.removed.severity, 'error');
});

test('scope checker treats a missing scope as informational and invalid values as errors', () => {
    const document = fixture(`
        <table><tr><th id="missing">A</th><th id="valid" scope="col">B</th><th id="invalid" scope="sideways">C</th></tr></table>
    `);
    const results = byId(scanHeaderCells([document]));
    assert.equal(results.missing.severity, 'info');
    assert.equal(results.valid.severity, 'success');
    assert.equal(results.invalid.severity, 'error');
});

test('non-HTML link checker uses the URL pathname and supports query strings', () => {
    const document = fixture(`
        <a id="pdf" href="/report.PDF?download=1#page=2">Report</a>
        <a id="sheet" href="/data.csv?v=3">Data</a>
        <a id="html" href="/article.html?file=.pdf">Article</a>
    `);
    const results = byId(scanNonHtmlLinks([document]));
    assert.equal(results.pdf.label, 'PDF');
    assert.equal(results.sheet.label, 'CSV');
    assert.equal(results.html, undefined);
    assert.equal(extensionFromLink(document.querySelector('#pdf')), 'pdf');
});
