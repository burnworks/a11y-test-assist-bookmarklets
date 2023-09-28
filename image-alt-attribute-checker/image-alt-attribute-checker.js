javascript: (() => {
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
        img.style.outline = '2px dotted #B71C1C';

        img.addEventListener('mouseenter', e => {
            const tooltip = document.createElement('div');
            const altText = img.alt;
            const hasAlt = img.hasAttribute('alt');

            if (!hasAlt) {
                tooltip.innerHTML = '<b style="color: #B71C1C;">alt属性が省略されています！</b>';
                tooltip.style.border = '1px solid #B71C1C';
            } else if (altText === '') {
                tooltip.innerText = 'alt属性値は空です';
                tooltip.style.border = '1px solid #B71C1C';
            } else {
                tooltip.innerText = altText;
                tooltip.style.border = '1px solid black';
            }

            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'white';
            tooltip.style.padding = '5px';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.transform = 'translate(-50%, -100%)';
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            tooltip.style.top = (e.clientY + scrollY) + 'px';
            tooltip.style.left = (e.clientX + scrollX) + 'px';
            tooltip.setAttribute('class', 'img-tooltip');
            document.body.appendChild(tooltip);
        });
        img.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.img-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
})();