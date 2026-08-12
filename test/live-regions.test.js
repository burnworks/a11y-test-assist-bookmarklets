import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import {
    createAriaNotifyInstrumentation,
    liveRegionInfo,
    mutationReports,
    scanLiveRegions,
} from '../src/bookmarklets/live-regions-check.js';

test('live region metadata includes explicit and implicit live settings', () => {
    const dom = new JSDOM(`
        <div id="polite" aria-live="polite"></div>
        <div id="alert" role="alert"></div>
        <div id="status" role="status" aria-atomic="false"></div>
        <div id="invalid" aria-live="loud"></div>
    `);
    const { document } = dom.window;
    assert.equal(liveRegionInfo(document.querySelector('#polite')).live, 'polite');
    assert.deepEqual(liveRegionInfo(document.querySelector('#alert')), {
        explicit: false, rawLive: '', invalidLive: false, live: 'assertive', role: 'alert', atomic: true, relevant: 'additions text', busy: false,
    });
    assert.equal(liveRegionInfo(document.querySelector('#status')).atomic, false);
    assert.equal(liveRegionInfo(document.querySelector('#invalid')).invalidLive, true);
    assert.equal(scanLiveRegions([document]).length, 4);
});

test('mutation reports describe additions, removals, busy state, and atomic content', () => {
    const dom = new JSDOM('<div id="region" role="status" aria-busy="true">Total: <span>2</span></div>');
    const { document } = dom.window;
    const region = document.querySelector('#region');
    const added = document.createTextNode(' items');
    region.append(added);
    const reports = mutationReports([{
        type: 'childList', target: region, addedNodes: [added], removedNodes: [], attributeName: null,
    }]);
    assert.equal(reports.length, 1);
    assert.match(reports[0].message, /追加「items」/);
    assert.match(reports[0].detail, /通知保留/);
    assert.match(reports[0].detail, /Total: 2 items/);
});

test('aria-relevant filters text and removal changes independently', () => {
    const dom = new JSDOM('<div id="region" aria-live="polite" aria-relevant="additions">Before</div>');
    const region = dom.window.document.querySelector('#region');
    const text = region.firstChild;
    text.data = 'After';
    const textReport = mutationReports([{
        type: 'characterData', target: text, addedNodes: [], removedNodes: [], attributeName: null,
    }])[0];
    assert.match(textReport.detail, /aria-relevantの対象外/);

    region.setAttribute('aria-relevant', 'removals');
    const removed = dom.window.document.createTextNode('Removed');
    const removalReport = mutationReports([{
        type: 'childList', target: region, addedNodes: [], removedNodes: [removed], attributeName: null,
    }])[0];
    assert.doesNotMatch(removalReport.detail, /aria-relevantの対象外/);
});

test('removing the live role is still reported', () => {
    const dom = new JSDOM('<div id="region">Message</div>');
    const region = dom.window.document.querySelector('#region');
    const reports = mutationReports([{
        type: 'attributes', target: region, addedNodes: [], removedNodes: [], attributeName: 'role', oldValue: 'status',
    }]);
    assert.equal(reports.length, 1);
    assert.match(reports[0].message, /ライブリージョンではなくなりました/);
});

test('ariaNotify instrumentation logs Document and Element calls and restores originals', () => {
    const dom = new JSDOM('<button id="button">Notify</button>');
    const { document, Document, Element } = dom.window;
    const nativeCalls = [];
    Document.prototype.ariaNotify = function (message, options) { nativeCalls.push(['document', this, message, options]); };
    Element.prototype.ariaNotify = function (message, options) { nativeCalls.push(['element', this, message, options]); };
    const originalDocumentMethod = Document.prototype.ariaNotify;
    const originalElementMethod = Element.prototype.ariaNotify;
    const logs = [];
    const cleanups = [];
    const instrument = createAriaNotifyInstrumentation();
    instrument([document], entry => logs.push(entry), cleanup => cleanups.push(cleanup));

    document.ariaNotify('Saved');
    document.querySelector('#button').ariaNotify('Failed', { priority: 'high' });
    assert.deepEqual(logs.map(log => log.message), ['normal：「Saved」', 'high：「Failed」']);
    assert.equal(nativeCalls.length, 2);

    cleanups.reverse().forEach(cleanup => cleanup());
    assert.equal(Document.prototype.ariaNotify, originalDocumentMethod);
    assert.equal(Element.prototype.ariaNotify, originalElementMethod);
    dom.window.close();
});

test('built bookmarklet records live updates and ariaNotify calls end to end', async () => {
    const code = (await readFile('live-regions-check/live-regions-check.js', 'utf8')).trim().replace(/^javascript:/, '');
    const dom = new JSDOM('<div id="region" role="status"></div>', {
        pretendToBeVisual: true,
        runScripts: 'dangerously',
        url: 'https://example.com/',
    });
    const { document, Document } = dom.window;
    const calls = [];
    Document.prototype.ariaNotify = function (message) { calls.push(message); };
    const original = Document.prototype.ariaNotify;
    const region = document.querySelector('#region');
    region.getClientRects = () => [{ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 }];
    region.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 });

    dom.window.eval(code);
    region.textContent = 'Updated status';
    document.ariaNotify('Saved');
    await new Promise(resolve => dom.window.setTimeout(resolve, 50));

    const host = document.querySelector('[data-a11y-test-assist-root="live-regions-check"]');
    const logText = [...host.shadowRoot.querySelectorAll('ol li')].map(item => item.textContent).join('\n');
    assert.match(logText, /Updated status/);
    assert.match(logText, /ariaNotify/);
    assert.deepEqual(calls, ['Saved']);

    dom.window.eval(code);
    assert.equal(document.querySelector('[data-a11y-test-assist-root="live-regions-check"]'), null);
    assert.equal(Document.prototype.ariaNotify, original);
    dom.window.close();
});
