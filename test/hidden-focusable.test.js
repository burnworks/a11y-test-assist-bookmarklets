import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanHiddenFocusable } from '../src/bookmarklets/hidden-focusable-checker.js';

function fixture(html) {
    const dom = new JSDOM(html, { pretendToBeVisual: true });
    for (const element of dom.window.document.querySelectorAll('*')) {
        element.getClientRects = () => [{ left: 0, top: 0, right: 100, bottom: 20 }];
    }
    return dom.window.document;
}

test('hidden focus checker finds tab stops but ignores disabled, inert, and visually hidden controls', () => {
    const document = fixture(`
        <div aria-hidden="true">
            <button id="bad">Bad</button>
            <button id="disabled" disabled>Disabled</button>
            <div inert><button id="inert">Inert</button></div>
            <button id="display-none" style="display:none">Hidden</button>
            <button id="programmatic" tabindex="-1">Programmatic</button>
        </div>
        <button id="outside">Outside</button>
    `);
    const ids = scanHiddenFocusable([document]).map(result => result.element.id);
    assert.deepEqual(ids, ['bad']);
});

test('currently focused tabindex -1 control inside aria-hidden is reported', () => {
    const document = fixture('<div aria-hidden="true"><button id="active" tabindex="-1">Active</button></div>');
    document.querySelector('#active').focus();
    const [result] = scanHiddenFocusable([document]);
    assert.equal(result.element.id, 'active');
    assert.equal(result.label, '隠Focus');
});

test('aria-hidden inheritance crosses open shadow boundaries', () => {
    const document = fixture('<div id="hidden" aria-hidden="true"><div id="host"></div></div>');
    const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<button id="shadow-button">Shadow</button>';
    shadow.querySelector('button').getClientRects = () => [{ left: 0, top: 0, right: 100, bottom: 20 }];
    const [result] = scanHiddenFocusable([document]);
    assert.equal(result.element.id, 'shadow-button');
});
