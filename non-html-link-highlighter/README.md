# non-html-link-highlighter

PDFファイルなど、HTMLではないファイルへのリンクを検出し、そのリンク先の拡張子を表示するブックマークレットです。

- 検出するのは `(pdf|xls|xlsx|doc|docx|ppt|pptx|zip)` 形式の拡張子が付いたファイルへのリンクのみです
- 検出された場合、リンクの上に拡張子がラベルとして表示されます

リンクの目的の達成基準に関連して、リンク先がHTML以外だった場合に、そのことがリンクテキストとして明示されているかを確認するのを補助します。

## 注意点

あくまで `href` 属性に指定されたリンク先URLの拡張子だけを確認していますので、例えば短縮URLが使用されていたり、オンラインストレージやファイル共有サービスへのリンクの場合は正しく検出できない場合があります。

また、対象としている拡張子以外のものは検出できませんので、必要に応じてソースコードを改変してください。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const cssId="non-html-link-highlighter",cssUrl="https://burnworks.github.io/a11y-test-assist-bookmarklets/non-html-link-highlighter.css",existingLink=document.getElementById(cssId);if(existingLink){existingLink.remove()}else{const link=document.createElement("link");link.id=cssId;link.rel="stylesheet";link.type="text/css";link.href=cssUrl;link.media="all";document.head.appendChild(link)}})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。