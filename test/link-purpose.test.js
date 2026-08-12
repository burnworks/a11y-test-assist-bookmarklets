import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { scanLinkPurposes } from '../src/bookmarklets/link-purpose-checker.js';

function fixture(html, url = 'https://example.com/articles') {
    const dom = new JSDOM(html, { url });
    for (const element of dom.window.document.querySelectorAll('*')) element.getClientRects = () => [{}];
    return dom.window.document;
}

function byId(results) {
    return Object.fromEntries(results.map(result => [result.element.id, result]));
}

test('link checker reports missing names, generic names, and useful programmatic context', () => {
    const results = byId(scanLinkPurposes([fixture(`
        <a id="missing" href="/one"><img alt=""></a>
        <a id="generic" href="/two">詳細</a>
        <p>製品Aについて<a id="contextual" href="/three">続きを読む</a></p>
        <a id="descriptive" href="/four">料金プラン</a>
    `)]));
    assert.equal(results.missing.severity, 'error');
    assert.equal(results.generic.label, '目的?');
    assert.equal(results.generic.isProblem, true);
    assert.equal(results.contextual.label, '文脈確認');
    assert.equal(results.contextual.isProblem, false);
    assert.equal(results.contextual.needsContext, true);
    assert.equal(results.descriptive.isProblem, false);
});

test('same names with different destinations and broken fragments are candidates', () => {
    const results = byId(scanLinkPurposes([fixture(`
        <a id="first" href="/one">Help</a><a id="second" href="/two">Help</a>
        <a id="broken" href="#missing">Section</a><a id="empty-fragment" href="#">Top</a>
        <a id="valid" href="#exists">Existing section</a><div id="exists"></div>
    `)]));
    assert.equal(results.first.label, '同名別URL');
    assert.equal(results.second.isProblem, true);
    assert.match(results.broken.detail, /見つかりません/);
    assert.match(results['empty-fragment'].detail, /空のページ内フラグメント/);
    assert.equal(results.valid.isProblem, false);
});

test('table headers and aria-describedby are exposed as link context', () => {
    const results = byId(scanLinkPurposes([fixture(`
        <span id="description">Account settings</span><a id="described" href="/settings" aria-describedby="description">Details</a>
        <table><thead><tr><th>Document</th><th>Format</th></tr></thead><tbody><tr><th>Annual report</th><td><a id="table-link" href="/annual.pdf">PDF</a></td></tr></tbody></table>
    `)]));
    assert.match(results.described.detail, /aria-describedby/);
    assert.match(results['table-link'].detail, /Annual report/);
    assert.match(results['table-link'].detail, /Format/);
});

test('file, download, and new-window metadata share one result per link', () => {
    const results = byId(scanLinkPurposes([fixture(`
        <a id="pdf" href="report.PDF?download=1" target="_blank">Report</a>
        <a id="download" href="/export" download="data.csv">Export</a>
    `)]));
    assert.equal(results.pdf.label, 'PDF');
    assert.equal(results.pdf.isFile, true);
    assert.equal(results.pdf.hasBehavior, true);
    assert.match(results.pdf.detail, /target="_blank"/);
    assert.equal(results.download.label, 'CSV');
    assert.equal(Object.keys(results).length, 2);
});
