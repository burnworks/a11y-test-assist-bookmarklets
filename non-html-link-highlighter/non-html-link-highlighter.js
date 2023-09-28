javascript: (() => {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        const match = href.match(/\.(pdf|xls|xlsx|doc|docx|ppt|pptx|zip)$/i);
        if (match) {
            const extLabel = document.createElement('span');
            extLabel.innerText = match[0].toUpperCase();
            extLabel.style.position = 'absolute';
            extLabel.style.backgroundColor = '#B71C1C';
            extLabel.style.color = 'white';
            extLabel.style.padding = '0.125rem 0.25rem';
            extLabel.style.borderRadius = '0.125rem';
            extLabel.style.fontFamily = 'Arial, sans-serif';
            extLabel.style.fontSize = '0.875rem';
            extLabel.style.left = '0';
            extLabel.style.top = '0';
            extLabel.style.transform = 'translateY(-100%)';
            link.style.position = 'relative';
            link.appendChild(extLabel);
        }
    });
})();
