import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createTextSpacingApplier, scanTextSpacing } from '../src/bookmarklets/text-spacing-checker.js';

test('text spacing applier adds styles to document and open shadow roots and cleans them up', () => {
    const dom = new JSDOM('<div id="host"></div>');
    const { document } = dom.window;
    document.querySelector('#host').attachShadow({ mode: 'open' }).innerHTML = '<p>Shadow</p>';
    const cleanups = [];
    createTextSpacingApplier()([document], () => {}, cleanup => cleanups.push(cleanup));
    assert.match(document.querySelector('style[data-a11y-text-spacing]').textContent, /letter-spacing:\.?0?12em/);
    assert.ok(document.querySelector('#host').shadowRoot.querySelector('style[data-a11y-text-spacing]'));
    cleanups.forEach(cleanup => cleanup());
    assert.equal(document.querySelectorAll('style[data-a11y-text-spacing]').length, 0);
});

test('text spacing scanner reports clipped text only', () => {
    const dom = new JSDOM(`
        <div id="clipped" style="overflow:hidden">Clipped text</div>
        <div id="visible" style="overflow:visible">Visible text</div>
    `);
    const { document } = dom.window;
    for (const element of document.querySelectorAll('body *')) {
        element.getClientRects = () => [{}];
        Object.defineProperties(element, {
            clientWidth: { value: 100 }, clientHeight: { value: 20 },
            scrollWidth: { value: element.id === 'clipped' ? 140 : 100 }, scrollHeight: { value: 20 },
        });
    }
    const results = scanTextSpacing([document]);
    assert.deepEqual(results.map(result => result.element.id), ['clipped']);
    assert.match(results[0].label, /横/);
});
