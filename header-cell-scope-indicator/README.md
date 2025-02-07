# header-cell-scope-indicator

見だしセル（th 要素）の scope 属性値を表示するブックマークレットです。

- 見出しセルに scope 属性が付与されていない
- 見出しセルに付与された scope 属性の値が妥当ではない

といった問題点を検出するのを補助します。

なお、scope 属性が付与されていればその値を、scope 属性が付与されていない場合は「×」をラベルとして表示します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const cssId="header-cell-scope-indicator",cssUrl="https://burnworks.github.io/a11y-test-assist-bookmarklets/header-cell-scope-indicator.css",existingLink=document.getElementById(cssId);if(existingLink){existingLink.remove()}else{const link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=cssUrl;link.media="all";document.head.appendChild(link)}})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。