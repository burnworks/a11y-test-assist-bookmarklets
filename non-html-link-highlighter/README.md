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
javascript:(()=>{const links=document.querySelectorAll('a[href]');links.forEach(link=>{const href=link.getAttribute('href');const match=href.match(/\.(pdf|xls|xlsx|doc|docx|ppt|pptx|zip)$/i);if(match){const extLabel=document.createElement('span');extLabel.innerText=match[0].toUpperCase();extLabel.style.position='absolute';extLabel.style.backgroundColor='#B71C1C';extLabel.style.color='white';extLabel.style.padding='0.125rem 0.25rem';extLabel.style.borderRadius='0.125rem';extLabel.style.fontFamily='Arial,sans-serif';extLabel.style.fontSize='0.875rem';extLabel.style.left='0';extLabel.style.top='0';extLabel.style.transform='translateY(-100%)';link.style.position='relative';link.appendChild(extLabel);}});})();
```

表示を消したい場合はページを再読み込みします。