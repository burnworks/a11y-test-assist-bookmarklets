import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { normalizeText, queryAllDeep, referencedText, startInspector } from '../src/runtime.js';

test('normalizeText collapses whitespace', () => {
    assert.equal(normalizeText('  one\n two  '), 'one two');
});

test('referencedText joins multiple referenced nodes in order', () => {
    const dom = new JSDOM('<span id="a">First</span><span id="b">Second</span><input aria-labelledby="a missing b">');
    const input = dom.window.document.querySelector('input');
    assert.equal(referencedText(input, 'aria-labelledby'), 'First Second');
});

test('queryAllDeep includes open shadow roots', () => {
    const dom = new JSDOM('<main><button>Light</button><div id="host"></div></main>');
    const document = dom.window.document;
    document.querySelector('#host').attachShadow({ mode: 'open' }).innerHTML = '<button>Shadow</button>';
    assert.equal(queryAllDeep(document, 'button').length, 2);
});

test('inspector follows DOM changes and a second execution removes all UI', async () => {
    const dom = new JSDOM('<button id="first" style="position:absolute">First</button>', {
        pretendToBeVisual: true,
        url: 'https://example.com/',
    });
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    const makeVisible = element => {
        element.getClientRects = () => [{ left: 10, top: 10, right: 110, bottom: 30, width: 100, height: 20 }];
        element.getBoundingClientRect = () => ({ left: 10, top: 10, right: 110, bottom: 30, width: 100, height: 20 });
    };
    makeVisible(document.querySelector('#first'));
    const config = {
        id: 'lifecycle-test',
        title: 'Lifecycle test',
        scan: documents => documents.flatMap(current => [...current.querySelectorAll('button')].map(element => ({
            element, label: element.id, severity: 'info', detail: element.textContent,
        }))),
    };

    try {
        const controller = startInspector(config);
        const host = document.querySelector('[data-a11y-test-assist-root="lifecycle-test"]');
        assert.ok(controller);
        assert.equal(host.shadowRoot.querySelectorAll('[data-a11y-marker]').length, 1);
        assert.equal(document.querySelector('#first').getAttribute('style'), 'position:absolute');

        const second = document.createElement('button');
        second.id = 'second';
        second.textContent = 'Second';
        makeVisible(second);
        document.body.append(second);
        await new Promise(resolve => dom.window.setTimeout(resolve, 40));
        assert.equal(host.shadowRoot.querySelectorAll('[data-a11y-marker]').length, 2);

        assert.equal(startInspector(config), null);
        assert.equal(document.querySelector('[data-a11y-test-assist-root="lifecycle-test"]'), null);
    } finally {
        globalThis.window = previousWindow;
        globalThis.document = previousDocument;
        dom.window.close();
    }
});
