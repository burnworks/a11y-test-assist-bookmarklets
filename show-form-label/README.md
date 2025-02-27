# show-heading-level

入力コントロールのラベルを表示するブックマークレットです。

ラベルのない入力コントロールを発見するのを補助します。

なお、placeholder 属性や title 属性はラベルとは見なさず、「ラベルなし」と表示します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const a=document.querySelectorAll(".show-form-label");if(a.length>0){a.forEach(b=>b.remove());const c=document.getElementById("show-form-label");c&&c.remove();return}const d=document.createElement("link");d.id="show-form-label",d.rel="stylesheet",d.href="https://burnworks.github.io/a11y-test-assist-bookmarklets/show-form-label.css",document.head.appendChild(d);const e=document.querySelectorAll("input, select, textarea, button, [role=\"button\"], [role=\"checkbox\"], [role=\"radio\"], [role=\"textbox\"], [role=\"combobox\"]");e.forEach(f=>{let g="",h=!1;if(f.id){const i=document.querySelector(`label[for="${f.id}"]`);i&&(g=i.textContent.trim(),h=!0)}if(!h&&f.closest("label")){const i=f.closest("label"),j=i.cloneNode(!0),k=j.querySelectorAll("input, select, textarea, button");k.forEach(a=>a.remove()),g=j.textContent.trim(),h=g.length>0}if(!h&&f.getAttribute("aria-label")){g=f.getAttribute("aria-label"),h=!0}if(!h&&f.getAttribute("aria-labelledby")){const i=f.getAttribute("aria-labelledby").split(/\s+/);let j="";i.forEach(a=>{const i=document.getElementById(a);i&&(j+=i.textContent.trim()+" ") }),j=j.trim(),j&&(g=j,h=!0)}if(!h&&f.placeholder){g=`(Placeholder: ${f.placeholder})`,h=!1}if(!h&&f.title){g=`(Title: ${f.title})`,h=!1}if(!h&&(f.tagName==="BUTTON"||f.type==="button"||f.type==="submit")&&f.value){g=f.value,h=!0}if(!h&&f.tagName==="BUTTON"&&f.textContent){g=f.textContent.trim(),h=!0}if(!h||""===g){g="ラベルなし",h=!1}const l=document.createElement("div");l.className="show-form-label"+(h?"": " no-label"),l.textContent=g;const m=f.getBoundingClientRect();l.style.left=`${window.scrollX+m.left}px`,l.style.top=`${window.scrollY+m.top-20}px`,document.body.appendChild(l)});})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。