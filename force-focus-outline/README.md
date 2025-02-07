# force-focus-outline

フォーカスインジケータを強制的に表示するためのブックマークレットです。

このブックマークレットを実行すると、サイト側で `:focus` に対して `outline: none;` が指定されている場合でも、強制的にフォーカスインジケータを表示します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const cssId="force-focus-outline",cssUrl="https://burnworks.github.io/a11y-test-assist-bookmarklets/force-focus-outline.css",existingLink=document.getElementById(cssId);if(existingLink){existingLink.remove()}else{const link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=cssUrl;link.media="all";document.head.appendChild(link)}})();
```

下記のリンクをブックマークにドラッグドロップしてもよいです。

[フォーカス可視化](javascript%3A%28%28%29%3D%3E%7Bconst+cssId%3D%22force-focus-outline%22%2CcssUrl%3D%22https%3A%2F%2Fburnworks.github.io%2Fa11y-test-assist-bookmarklets%2Fforce-focus-outline.css%22%2CexistingLink%3Ddocument.getElementById%28cssId%29%3Bif%28existingLink%29%7BexistingLink.remove%28%29%7Delse%7Bconst+link%3Ddocument.createElement%28%22link%22%29%3Blink.id%3DcssId%3Blink.rel%3D%22stylesheet%22%3Blink.type%3D%22text%2Fcss%22%3Blink.href%3DcssUrl%3Blink.media%3D%22all%22%3Bdocument.head.appendChild%28link%29%7D%7D%29%28%29%3B)

表示を消したい場合はもう一度ブックマークレットを実行します。