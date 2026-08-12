import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanAriaReferences } from '../src/bookmarklets/aria-reference-checker.js';

function byElementAndAttribute(results, id, attribute) {
    return results.find(result => result.element.id === id && result.detail.includes(`${attribute}=`));
}

test('reference checker reports valid, missing, duplicate, wrong-type, and cyclic references', () => {
    const dom = new JSDOM(`
        <span id="label">Name</span>
        <input id="valid" aria-labelledby="label">
        <input id="missing" aria-describedby="not-found">
        <div id="duplicate"></div><span id="duplicate"></span>
        <button id="ambiguous" aria-controls="duplicate">Open</button>
        <label id="wrong" for="label">Wrong target</label>
        <span id="cycle-a" aria-labelledby="cycle-b">A</span>
        <span id="cycle-b" aria-labelledby="cycle-a">B</span>
    `);
    const results = scanAriaReferences([dom.window.document]);
    assert.equal(byElementAndAttribute(results, 'valid', 'aria-labelledby').severity, 'success');
    assert.equal(byElementAndAttribute(results, 'missing', 'aria-describedby').severity, 'error');
    assert.equal(byElementAndAttribute(results, 'ambiguous', 'aria-controls').severity, 'error');
    assert.equal(byElementAndAttribute(results, 'wrong', 'for').severity, 'error');
    assert.equal(byElementAndAttribute(results, 'cycle-a', 'aria-labelledby').severity, 'warning');
    assert.equal(results.filter(result => result.label === 'ID×2').length, 2);
});

test('references resolve within their own shadow root', () => {
    const dom = new JSDOM('<div id="label">Light</div><div id="host"></div>');
    const shadow = dom.window.document.querySelector('#host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<span id="label">Shadow</span><button id="control" aria-labelledby="label"></button>';
    const result = scanAriaReferences([dom.window.document]).find(item => item.element.id === 'control');
    assert.equal(result.severity, 'success');
    assert.match(result.detail, /Shadow/);
});

