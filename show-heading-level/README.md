# show-heading-level

見だし要素のレベルを表示するブックマークレットです。

- 見出しのように見えて見だし要素が使用されていない
- 見出しのレベルが適切な順番で使用されていない

といった問題点を検出するのを補助します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const cssId="show-heading-level",cssUrl="https://burnworks.github.io/a11y-test-assist-bookmarklets/show-heading-level.css",existingLink=document.getElementById(cssId);if(existingLink){existingLink.remove()}else{const link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=cssUrl;link.media="all";document.head.appendChild(link)}})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。