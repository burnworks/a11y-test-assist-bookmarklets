import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createDialogFocusMonitor, scanDialogs } from '../src/bookmarklets/dialog-focus-checker.js';

function fixture(html) {
    const dom = new JSDOM(html, { pretendToBeVisual: true });
    for (const element of dom.window.document.querySelectorAll('*')) {
        element.getClientRects = () => [{ left: 0, top: 0, right: 100, bottom: 20 }];
    }
    return dom.window.document;
}

test('dialog checker reports name, modal focus, and outside tab stops', () => {
    const document = fixture(`
        <button id="outside">Outside</button>
        <div id="dialog" role="dialog" aria-modal="true" aria-label="Settings">
            <button id="inside">Inside</button>
        </div>
    `);
    document.querySelector('#inside').focus();
    const results = scanDialogs([document]);
    const dialog = results.find(result => result.element.id === 'dialog');
    const outside = results.find(result => result.element.id === 'outside');
    assert.equal(dialog.severity, 'warning');
    assert.match(dialog.detail, /名前: 「Settings」/);
    assert.equal(outside.label, '外Tab');
});

test('unnamed dialog is an error and closed native dialog is ignored', () => {
    const document = fixture('<div id="open" role="dialog"></div><dialog id="closed"></dialog>');
    const results = scanDialogs([document]);
    assert.equal(results.find(result => result.element.id === 'open').severity, 'error');
    assert.equal(results.some(result => result.element.id === 'closed'), false);
});

test('focus monitor logs movement outside a modal dialog', () => {
    const document = fixture(`
        <button id="outside">Outside</button>
        <div role="dialog" aria-modal="true" aria-label="Modal"><button id="inside">Inside</button></div>
    `);
    const reports = [];
    const cleanups = [];
    createDialogFocusMonitor()([document], report => reports.push(report), cleanup => cleanups.push(cleanup));
    document.querySelector('#outside').focus();
    assert.equal(reports.length, 1);
    assert.match(reports[0].message, /outside/);
    cleanups.forEach(cleanup => cleanup());
});
