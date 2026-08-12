# A11y Test Assist Bookmarklets

アクセシビリティ試験で、目視だけでは確認しにくい情報を可視化するブックマークレット集です。結果は自動的な合否判定ではなく、確認対象を見つけるための補助情報として利用してください。

## ブックマークレット

- [aria-reference-checker](aria-reference-checker/)：ARIA・HTMLのID参照と重複IDを検査
- [dialog-focus-checker](dialog-focus-checker/)：ダイアログの名前・モーダル状態・フォーカスを検査
- [image-alt-attribute-checker](image-alt-attribute-checker/)：画像の `alt` 属性を分類して表示
- [interactive-name-checker](interactive-name-checker/)：操作要素のアクセシブルな名前と取得元を検査
- [live-regions-checker](live-regions-checker/)：ライブリージョンの更新と `ariaNotify()` 呼び出しを記録
- [landmark-checker](landmark-checker/)：ランドマークの役割・名前・重複を表示
- [language-checker](language-checker/)：ページと部分的な言語指定を検査
- [focusable-element-checker](focusable-element-checker/)：Tabキーの移動順と、操作可能に見える非Tab要素を表示
- [hidden-focusable-checker](hidden-focusable-checker/)：`aria-hidden` 内のフォーカス可能要素を検出
- [show-heading-level](show-heading-level/)：ネイティブおよびARIA見出しのレベルを表示
- [text-spacing-checker](text-spacing-checker/)：WCAGの文字間隔を適用して文字切れ候補を表示
- [target-size-checker](target-size-checker/)：小さいポインターターゲットと間隔を検査
- [non-html-link-highlighter](non-html-link-highlighter/)：HTML以外のファイルへのリンクを表示
- [header-cell-scope-indicator](header-cell-scope-indicator/)：`th` 要素の `scope` を分類して表示
- [force-focus-outline](force-focus-outline/)：現在フォーカスされている要素を強調

## 共通仕様

- ページ上の対象要素を直接変更せず、独立したオーバーレイで囲みます。
- 右上のパネルに検出件数と選択中の詳細を表示します。
- DOMの追加・削除、属性変更、スクロール、リサイズへ追従します。
- open Shadow DOMと同一生成元iframeを検査します。
- もう一度実行するか、パネルの「終了」を押すと追加したDOM、監視、イベントを削除します。

cross-origin iframeとclosed Shadow DOMの内部はブラウザのセキュリティ境界により検査できません。cross-origin iframeを検出した場合はパネルに件数を表示します。

## 開発

Node.jsを用意し、依存関係をインストールします。

```sh
npm install
```

`src/bookmarklets/` が読みやすいソース、各ツールのディレクトリにある同名 `.js` が配布用の自己完結ファイルです。次のコマンドで配布ファイルと各READMEのコードを再生成します。

`docs/` のCSSは旧版をすでに登録している利用者との互換性のためだけに残しています。新しい配布ファイルからは読み込みません。

```sh
npm run build
npm test
```

手動確認用ページは次のコマンドで `http://127.0.0.1:4173/` に起動できます。

```sh
npm run serve:test
```
