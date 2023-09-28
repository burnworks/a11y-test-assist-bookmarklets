# focusable-element-checker

フォーカス可能な要素の確認を支援するためのブックマークレットです。

このブックマークレットを実行すると、画面上にあるフォーカス可能な要素に赤い点線のアウトラインがつきます。見た目上はフォーカス可能なように見えて（例えば見た目上は何らかの操作ボタンなど）、実際にはフォーカスできない要素を探し出すことを支援します。

## 注意点

このブックマークレットの目的は、「マウスでは操作できるにもかかわらず、キーボードで操作できない」ボタンなど、キーボードの達成基準に問題がある UI の発見を補助することですので、必ずしもすべてのフォーカス可能な要素を検出するわけではありません（例えば `iframe` 要素や `contenteditable` 属性が付いた要素などは対象外にしています）。

- `href` 属性を持たない `a`` 要素
- `disabled` 属性が指定された `input`, `textarea`, `select` 要素

などはフォーカスできないことが妥当なのでアウトラインはつきません。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const focusableElements=document.querySelectorAll('a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');focusableElements.forEach(elem=>{const existingStyle=elem.getAttribute('style')||'';elem.setAttribute('style',`${existingStyle};outline:2px dotted #B71C1C;`);});})();
```