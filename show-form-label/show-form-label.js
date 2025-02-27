javascript: (() => {
    // 既存のスタイルシートがあれば削除
    const existingStylesheet = document.getElementById('show-form-label');
    if (existingStylesheet) {
        existingStylesheet.remove();
    }

    // 既存のラベル表示を削除（再実行時のため）
    const existingLabels = document.querySelectorAll('.show-form-label');
    existingLabels.forEach(label => label.remove());

    // 外部CSSをユーザースタイルシートとして追加
    const stylesheet = document.createElement('link');
    stylesheet.id = 'show-form-label';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://burnworks.github.io/a11y-test-assist-bookmarklets/show-form-label.css';
    document.head.appendChild(stylesheet);

    // 入力コントロールを取得
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
            // 入力要素自体のテキストを除外
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

        // 4. aria-labelledby属性をチェック
        if (!hasLabel && input.getAttribute('aria-labelledby')) {
            const labelledbyId = input.getAttribute('aria-labelledby');
            const labelledbyElement = document.getElementById(labelledbyId);
            if (labelledbyElement) {
                labelText = labelledbyElement.textContent.trim();
                hasLabel = true;
            }
        }

        // 5. 一応、placeholder属性をチェック（代替ラベルとして機能することがあるが、WAI-ARIAではラベルと見なされない）
        if (!hasLabel && input.placeholder) {
            labelText = `(Placeholder: ${input.placeholder})`;
            hasLabel = false; // placeholderはラベルとして不十分なので、hasLabelはfalseのまま
        }

        // 6. value属性をチェック（ボタン等で使用される場合）
        if (!hasLabel && (input.tagName === 'BUTTON' || input.type === 'button' || input.type === 'submit') && input.value) {
            labelText = input.value;
            hasLabel = true;
        }

        // 7. テキストコンテンツをチェック（ボタン要素）
        if (!hasLabel && input.tagName === 'BUTTON' && input.textContent) {
            labelText = input.textContent.trim();
            hasLabel = true;
        }

        // ラベルがない場合
        if (!hasLabel || labelText === '') {
            labelText = 'ラベルなし';
            hasLabel = false;
        }

        // ラベル表示要素を作成
        const labelDisplay = document.createElement('div');
        labelDisplay.className = 'show-form-label' + (hasLabel ? '' : ' no-label');
        labelDisplay.textContent = labelText;

        // 入力要素の位置に合わせて配置
        const rect = input.getBoundingClientRect();
        labelDisplay.style.left = `${window.scrollX + rect.left}px`;
        labelDisplay.style.top = `${window.scrollY + rect.top - 20}px`;

        document.body.appendChild(labelDisplay);
    });
})();