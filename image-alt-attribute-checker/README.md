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
javascript:(function(){const cssId="image-alt-attribute-checker",cssUrl="https://burnworks.github.io/a11y-test-assist-bookmarklets/image-alt-attribute-checker.css";if(!document.getElementById(cssId)){const linkElement=document.createElement("link");linkElement.id=cssId;linkElement.rel="stylesheet";linkElement.href=cssUrl;document.head.appendChild(linkElement);}function onEnter(e){const img=e.currentTarget,tooltip=document.createElement("div"),altText=img.alt,hasAlt=img.hasAttribute("alt");if(!hasAlt){tooltip.innerHTML='<b style="color: #B71C1C;">alt属性が省略されています！</b>';tooltip.style.border="1px solid #B71C1C";}else if(altText===""){tooltip.innerText="alt属性値は空です";tooltip.style.border="1px solid #B71C1C";}else{tooltip.innerText=altText;tooltip.style.border="1px solid black";}tooltip.style.position="absolute";tooltip.style.zIndex="9999";tooltip.style.backgroundColor="white";tooltip.style.padding="0.25rem 0.5rem";tooltip.style.borderRadius="0.125rem";tooltip.style.fontSize="1rem";tooltip.style.pointerEvents="none";tooltip.style.transform="translate(-50%, -100%)";tooltip.style.top=(e.clientY+window.scrollY)+"px";tooltip.style.left=(e.clientX+window.scrollX)+"px";tooltip.className="__img-tooltip";document.body.appendChild(tooltip);}function onLeave(){const tooltip=document.querySelector(".__img-tooltip");tooltip&&tooltip.remove();}const imgs=document.querySelectorAll("img");imgs.forEach(img=>{img.addEventListener("mouseenter",onEnter);img.addEventListener("mouseleave",onLeave);});if(!document.getElementById("__img-reset-btn")){const btn=document.createElement("button");btn.textContent="Reset Image Alt Checker";btn.id="__img-reset-btn";btn.style.position="fixed";btn.style.top="10px";btn.style.right="10px";btn.style.zIndex="10000";btn.style.padding="0.5rem 1rem";btn.style.backgroundColor="#B71C1C";btn.style.color="white";btn.style.border="none";btn.style.borderRadius="0.25rem";btn.style.cursor="pointer";document.body.appendChild(btn);btn.addEventListener("click",function(){imgs.forEach(img=>{img.removeEventListener("mouseenter",onEnter);img.removeEventListener("mouseleave",onLeave);});const tooltip=document.querySelector(".__img-tooltip");tooltip&&tooltip.remove();const cssEl=document.getElementById(cssId);cssEl&&cssEl.remove();btn.remove();});}})();
```

表示を消したい場合はページの右上に表示される「Reset Image Alt Checker」ボタンをクリックします。