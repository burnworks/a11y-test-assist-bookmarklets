javascript: (() => {
    // 既存のラベル表示がある場合は削除して終了
    const existingLabels = document.querySelectorAll('.show-form-label');
    if (existingLabels.length > 0) {
        existingLabels.forEach(label => label.remove());
        const existingStylesheet = document.getElementById('show-form-label');
        if (existingStylesheet) { existingStylesheet.remove(); }
        return;
    }

    // 外部CSSを追加
    const stylesheet = document.createElement('link');
    stylesheet.id = 'show-form-label';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://burnworks.github.io/a11y-test-assist-bookmarklets/show-form-label.css';
    document.head.appendChild(stylesheet);

    // 対象の入力要素を取得
    const inputElements = document.querySelectorAll('input, select, textarea, button, [role="button"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"]');

    inputElements.forEach(input => {
        let labelText = '';
        let hasLabel = false;

        // 1. id属性とfor属性で紐付くlabel要素をチェック
        if (input.id) {
            const labelElement = document.querySelector(`label[for="${input.id}"]`);
            if (labelElement) {
                labelText = labelElement.textContent.trim();
                hasLabel = true;
            }
        }

        // 2. 親要素がlabelの場合をチェック
        if (!hasLabel && input.closest('label')) {
            const parentLabel = input.closest('label');
            // 入力要素自体のテキストを除外するために複製
            const clonedLabel = parentLabel.cloneNode(true);
            const inputsInLabel = clonedLabel.querySelectorAll('input, select, textarea, button');
            inputsInLabel.forEach(el => el.remove());
            labelText = clonedLabel.textContent.trim();
            hasLabel = labelText.length > 0;
        }

        // 3. aria-label属性をチェック
        if (!hasLabel && input.getAttribute('aria-label')) {
            labelText = input.getAttribute('aria-label');
            hasLabel = true;
        }

        // 4. aria-labelledby属性をチェック（複数の関連付けがある場合を想定）
        if (!hasLabel && input.getAttribute('aria-labelledby')) {
            const ids = input.getAttribute('aria-labelledby').split(/\s+/);
            let combinedLabel = '';
            ids.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    combinedLabel += element.textContent.trim() + ' ';
                }
            });
            combinedLabel = combinedLabel.trim();
            if (combinedLabel) {
                labelText = combinedLabel;
                hasLabel = true;
            }
        }

        // 5. placeholder属性をチェック（一応チェックするけど「ラベルなし」扱い）
        if (!hasLabel && input.placeholder) {
            labelText = `(Placeholder: ${input.placeholder})`;
            hasLabel = false; // true にすればラベルとして表示される
        }

        // 6. title属性をチェック（一応チェックするけど「ラベルなし」扱い）
        if (!hasLabel && input.title) {
            labelText = `(Title: ${input.title})`;
            hasLabel = false; // true にすればラベルとして表示される
        }

        // 7. value属性をチェック（ボタン等の場合）
        if (!hasLabel && (input.tagName === 'BUTTON' || input.type === 'button' || input.type === 'submit') && input.value) {
            labelText = input.value;
            hasLabel = true;
        }

        // 8. ボタン要素のテキストコンテンツをチェック
        if (!hasLabel && input.tagName === 'BUTTON' && input.textContent) {
            labelText = input.textContent.trim();
            hasLabel = true;
        }

        if (!hasLabel || labelText === '') {
            labelText = 'ラベルなし';
            hasLabel = false;
        }

        // ラベル表示用要素の作成と配置
        const labelDisplay = document.createElement('div');
        labelDisplay.className = 'show-form-label' + (hasLabel ? '' : ' no-label');
        labelDisplay.textContent = labelText;
        const rect = input.getBoundingClientRect();
        labelDisplay.style.left = `${window.scrollX + rect.left}px`;
        labelDisplay.style.top = `${window.scrollY + rect.top - 20}px`;
        document.body.appendChild(labelDisplay);
    });
})();
