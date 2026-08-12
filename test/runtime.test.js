import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { normalizeText, queryAllDeep, referencedText } from '../src/runtime.js';

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

