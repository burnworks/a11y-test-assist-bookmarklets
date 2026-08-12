import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanLandmarks } from '../src/bookmarklets/landmark-checker.js';

function fixture(html) {
    const dom = new JSDOM(html);
    for (const element of dom.window.document.querySelectorAll('*')) {
        element.getClientRects = () => [{ left: 0, top: 0, right: 100, bottom: 20 }];
    }
    return dom.window.document;
}

function byId(results) {
    return Object.fromEntries(results.map(result => [result.element.id, result]));
}

test('landmark checker recognises implicit and explicit roles and excludes nested headers', () => {
    const results = byId(scanLandmarks([fixture(`
        <header id="banner"></header>
        <main id="main"><article><header id="nested"></header></article></main>
        <nav id="nav" aria-label="Primary"></nav>
        <aside id="aside"></aside>
        <section id="region" aria-label="News"></section>
        <form id="unnamed-form"></form>
        <div id="search" role="search" aria-label="Site"></div>
    `)]));
    assert.match(results.banner.label, /banner/);
    assert.match(results.main.label, /main/);
    assert.match(results.nav.label, /navigation/);
    assert.match(results.region.label, /region/);
    assert.match(results.search.label, /search/);
    assert.equal(results.nested, undefined);
    assert.equal(results['unnamed-form'], undefined);
});

test('duplicate singleton and repeated unnamed landmarks are flagged', () => {
    const results = byId(scanLandmarks([fixture(`
        <main id="first"></main><div id="second" role="main"></div>
        <nav id="nav-a"></nav><nav id="nav-b"></nav>
        <div id="form" role="form"></div>
    `)]));
    assert.equal(results.first.severity, 'warning');
    assert.match(results.first.detail, /2件/);
    assert.equal(results['nav-a'].severity, 'warning');
    assert.match(results['nav-a'].detail, /識別できる名前/);
    assert.match(results.form.detail, /名前が必要/);
});
