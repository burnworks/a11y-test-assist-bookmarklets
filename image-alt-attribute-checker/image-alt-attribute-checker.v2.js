javascript: (function () {
    const cssId = "image-alt-attribute-checker";
    const cssUrl = "https://burnworks.github.io/a11y-test-assist-bookmarklets/image-alt-attribute-checker.css";
    if (!document.getElementById(cssId)) {
        const linkElement = document.createElement("link");
        linkElement.id = cssId;
        linkElement.rel = "stylesheet";
        linkElement.href = cssUrl;
        document.head.appendChild(linkElement);
    }

    // マウスオーバー時の処理（ツールチップ生成）
    function onEnter(e) {
        const img = e.currentTarget;
        const tooltip = document.createElement("div");
        const altText = img.alt;
        const hasAlt = img.hasAttribute("alt");

        if (!hasAlt) {
            tooltip.innerHTML = '<b style="color: #B71C1C;">alt属性が省略されています！</b>';
            tooltip.style.border = "1px solid #B71C1C";
        } else if (altText === "") {
            tooltip.innerText = "alt属性値は空です";
            tooltip.style.border = "1px solid #B71C1C";
        } else {
            tooltip.innerText = altText;
            tooltip.style.border = "1px solid black";
        }

        tooltip.style.position = "absolute";
        tooltip.style.zIndex = "9999";
        tooltip.style.backgroundColor = "white";
        tooltip.style.padding = "0.25rem 0.5rem";
        tooltip.style.borderRadius = "0.125rem";
        tooltip.style.fontSize = "1rem";
        tooltip.style.pointerEvents = "none";
        tooltip.style.transform = "translate(-50%, -100%)";
        tooltip.style.top = (e.clientY + window.scrollY) + "px";
        tooltip.style.left = (e.clientX + window.scrollX) + "px";
        tooltip.className = "__img-tooltip";
        document.body.appendChild(tooltip);
    }

    // マウスアウト時の処理（ツールチップ削除）
    function onLeave() {
        const tooltip = document.querySelector(".__img-tooltip");
        if (tooltip) {
            tooltip.remove();
        }
    }

    // すべての img 要素に対してイベントリスナーを設定
    const imgs = document.querySelectorAll("img");
    imgs.forEach(img => {
        img.addEventListener("mouseenter", onEnter);
        img.addEventListener("mouseleave", onLeave);
    });

    // 既にリセットボタンが存在していなければ作成する
    if (!document.getElementById("__img-reset-btn")) {
        const btn = document.createElement("button");
        btn.textContent = "Reset Image Alt Checker";
        btn.id = "__img-reset-btn";
        btn.style.position = "fixed";
        btn.style.top = "10px";
        btn.style.right = "10px";
        btn.style.zIndex = "10000";
        btn.style.padding = "0.5rem 1rem";
        btn.style.backgroundColor = "#B71C1C";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.borderRadius = "0.25rem";
        btn.style.cursor = "pointer";
        document.body.appendChild(btn);

        // リセットボタン押下時の処理
        btn.addEventListener("click", function () {
            imgs.forEach(img => {
                img.removeEventListener("mouseenter", onEnter);
                img.removeEventListener("mouseleave", onLeave);
            });
            const tooltip = document.querySelector(".__img-tooltip");
            if (tooltip) {
                tooltip.remove();
            }
            const cssEl = document.getElementById(cssId);
            if (cssEl) {
                cssEl.remove();
            }
            btn.remove();
        });
    }
})();
