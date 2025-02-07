# force-focus-outline

フォーカスインジケータを強制的に表示するためのブックマークレットです。

このブックマークレットを実行すると、サイト側で `:focus` に対して `outline: none;` が指定されている場合でも、強制的にフォーカスインジケータを表示します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const cssId="force-focus-outline",cssUrl="https://burnworks.github.io/a11y-test-assist-bookmarklets/force-focus-outline.css",existingLink=document.getElementById(cssId);if(existingLink){existingLink.remove()}else{const link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=cssUrl;link.media="all";document.head.appendChild(link)}})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。