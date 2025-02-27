# show-heading-level

入力コントロールのラベルを表示するブックマークレットです。

ラベルのない入力コントロールを発見するのを補助します。

## 使用方法

下記のブックマークレットをブラウザのブックマークツールバーなどに登録してください。チェック対象 Web ページでブックマークレットを実行します。

```
javascript:(()=>{const e=document.getElementById("show-form-label");e&&e.remove();const t=document.querySelectorAll(".show-form-label");t.forEach(e=>e.remove());const l=document.createElement("link");l.id="show-form-label",l.rel="stylesheet",l.href="https://burnworks.github.io/a11y-test-assist-bookmarklets/show-form-label.css",document.head.appendChild(l);const a=document.querySelectorAll("input, select, textarea, button, [role=\"button\"], [role=\"checkbox\"], [role=\"radio\"], [role=\"textbox\"], [role=\"combobox\"]");a.forEach(e=>{let t="",l=!1;if(e.id){const a=document.querySelector(`label[for="${e.id}"]`);a&&(t=a.textContent.trim(),l=!0)}if(!l&&e.closest("label")){const a=e.closest("label"),n=a.cloneNode(!0),r=n.querySelectorAll("input, select, textarea, button");r.forEach(e=>e.remove()),t=n.textContent.trim(),l=t.length>0}if(!l&&e.getAttribute("aria-label")&&(t=e.getAttribute("aria-label"),l=!0),!l&&e.getAttribute("aria-labelledby")){const a=e.getAttribute("aria-labelledby"),n=document.getElementById(a);n&&(t=n.textContent.trim(),l=!0)}if(!l&&e.placeholder&&(t=`(Placeholder: ${e.placeholder})`,l=!1),!l&&("BUTTON"===e.tagName||"button"===e.type||"submit"===e.type)&&e.value&&(t=e.value,l=!0),!l&&"BUTTON"===e.tagName&&e.textContent&&(t=e.textContent.trim(),l=!0),!l||""===t&&(t="ラベルなし",l=!1),t){const a=document.createElement("div");a.className="show-form-label"+(l?"":" no-label"),a.textContent=t;const n=e.getBoundingClientRect();a.style.left=`${window.scrollX+n.left}px`,a.style.top=`${window.scrollY+n.top-20}px`,document.body.appendChild(a)}})})();
```

表示を消したい場合はもう一度ブックマークレットを実行します。