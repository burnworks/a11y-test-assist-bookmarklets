import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanTargetSizes } from '../src/bookmarklets/target-size-checker.js';

function fixture() {
    const dom = new JSDOM(`
        <button id="large">Large</button>
        <button id="crowded-a">A</button><button id="crowded-b">B</button>
        <button id="spaced">Spaced</button>
        <p>Read the <a id="inline" href="#">details</a> here.</p>
        <button id="disabled" disabled>Disabled</button>
    `);
    const { document } = dom.window;
    const boxes = {
        large: [0, 0, 30, 30], 'crowded-a': [50, 0, 16, 16], 'crowded-b': [68, 0, 16, 16],
        spaced: [150, 0, 16, 16], inline: [0, 60, 20, 16], disabled: [0, 90, 10, 10],
    };
    for (const [id, [left, top, width, height]] of Object.entries(boxes)) {
        const element = document.getElementById(id);
        element.getClientRects = () => [{}];
        element.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height });
    }
    return document;
}

test('target size checker separates crowded, spaced, inline, large, and disabled targets', () => {
    const results = Object.fromEntries(scanTargetSizes([fixture()]).map(result => [result.element.id, result]));
    assert.equal(results.large, undefined);
    assert.equal(results.disabled, undefined);
    assert.equal(results['crowded-a'].label, '小:密集');
    assert.equal(results['crowded-a'].severity, 'warning');
    assert.equal(results.spaced.label, '小:間隔');
    assert.equal(results.spaced.severity, 'info');
    assert.equal(results.inline.label, '小:行内');
});
