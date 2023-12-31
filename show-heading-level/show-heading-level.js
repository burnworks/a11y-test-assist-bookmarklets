javascript: (() => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        const label = document.createElement('div');
        label.innerText = heading.tagName;
        label.style.position = 'absolute';
        label.style.zIndex = '9999';
        label.style.backgroundColor = '#B71C1C';
        label.style.color = 'white';
        label.style.padding = '0.125rem 0.25rem';
        label.style.borderRadius = '0.125rem';
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontSize = '0.875rem';
        label.style.left = '0';
        label.style.top = '0';
        label.style.transform = 'translateY(-100%)';
        heading.style.position = 'relative';
        heading.appendChild(label);
    });
})();
