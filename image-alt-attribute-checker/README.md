# image-alt-attribute-checker

画像の代替テキスト（alt属性値）の確認を支援するためのブックマークレットです。

このブックマークレットを実行すると、

1. 画面上の `img` 要素に赤い点線のアウトラインがつきます（画面上の画像をわかりやすくするため）
2. 画像にマウスオーバーすると、その画像の代替テキストがツールチップで表示されます。
    - この時、「`alt` 属性値が空」の場合は「alt属性値は空です」とツールチップ内に表示されます。
    - 一方で、「`alt` 属性自体が省略されている」場合は「alt属性が省略されています！」と表示されます。

なぜマウスオーバーで表示するようにしてあるのかというと、当初、全部表示するようにしてみたら画像が多いページでとっても見にくかったからです……

## 注意点

ブックマークレットを実行した時点で読み込まれていない画像は対象外となります。例えば何かの操作によって動的に読み込まれる部分に含まれる画像などです。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const imgs=document.querySelectorAll('img');imgs.forEach(img=>{img.style.outline='2px dotted #B71C1C';img.addEventListener('mouseenter',e=>{const tooltip=document.createElement('div');const altText=img.alt;const hasAlt=img.hasAttribute('alt');if(!hasAlt){tooltip.innerHTML='<b style="color:#B71C1C;">alt属性が省略されています！</b>';tooltip.style.border='1px solid #B71C1C';}else if(altText===''){tooltip.innerText='alt属性値は空です';tooltip.style.border='1px solid #B71C1C';}else{tooltip.innerText=altText;tooltip.style.border='1px solid black';}tooltip.style.position='absolute';tooltip.style.backgroundColor='white';tooltip.style.padding='0.25rem 0.5rem';tooltip.style.borderRadius='0.125rem';tooltip.style.fontSize='1rem';tooltip.style.pointerEvents='none';tooltip.style.transform='translate(-50%,-100%)';const scrollX=window.scrollX;const scrollY=window.scrollY;tooltip.style.top=(e.clientY+scrollY)+'px';tooltip.style.left=(e.clientX+scrollX)+'px';tooltip.setAttribute('class','__img-tooltip');document.body.appendChild(tooltip);});img.addEventListener('mouseleave',()=>{const tooltip=document.querySelector('.__img-tooltip');if(tooltip){tooltip.remove();}});});})();
```

表示を消したい場合はページを再読み込みします。