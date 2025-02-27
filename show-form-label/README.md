# show-heading-level

入力コントロールのラベルを表示するブックマークレットです。

ラベルのない入力コントロールを発見するのを補助します。

なお、placeholder 属性や title 属性はラベルとは見なさず、「ラベルなし」と表示します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const a=document.querySelectorAll(".show-form-label");if(a.length>0){a.forEach(b=>b.remove());const c=document.getElementById("show-form-label");c&&c.remove();return}const d=document.createElement("link");d.id="show-form-label",d.rel="stylesheet",d.href="https://burnworks.github.io/a11y-test-assist-bookmarklets/show-form-label.css",document.head.appendChild(d);const e=document.querySelectorAll("input, select, textarea, button, [role=\"button\"], [role=\"checkbox\"], [role=\"radio\"], [role=\"textbox\"], [role=\"combobox\"]");e.forEach(f=>{let g="",h=false;if(f.id){const i=document.querySelector(`label[for="${f.id}"]`);i&&(g=i.textContent.trim(),h=true)}if(!h&&f.closest("label")){const j=f.closest("label"),k=j.cloneNode(!0),l=k.querySelectorAll("input, select, textarea, button");l.forEach(m=>m.remove()),g=k.textContent.trim(),h=g.length>0}if(!h&&f.getAttribute("aria-label")){g=f.getAttribute("aria-label"),h=true}if(!h&&f.getAttribute("aria-labelledby")){const n=f.getAttribute("aria-labelledby"),o=document.getElementById(n);o&&(g=o.textContent.trim(),h=true)}if(!h&&f.placeholder){g=`(Placeholder: ${f.placeholder})`,h=false}if(!h&&(f.tagName==="BUTTON"||f.type==="button"||f.type==="submit")&&f.value){g=f.value,h=true}if(!h&&f.tagName==="BUTTON"&&f.textContent){g=f.textContent.trim(),h=true}if(!h||""===g){g="ラベルなし",h=false}const p=document.createElement("div");p.className="show-form-label"+(h?"": " no-label"),p.textContent=g;const q=f.getBoundingClientRect();p.style.left=`${window.scrollX+q.left}px`,p.style.top=`${window.scrollY+q.top-20}px`,document.body.appendChild(p)})})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。