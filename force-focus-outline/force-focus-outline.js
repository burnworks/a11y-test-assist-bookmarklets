javascript: (() => {
    const cssId = 'force-focus-outline';
    const cssUrl = 'https://burnworks.github.io/a11y-test-assist-bookmarklets/force-focus-outline.css';
    const existingLink = document.getElementById(cssId);
    if (existingLink) {
        existingLink.remove();
    } else {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssUrl;
        link.media = 'all';
        document.head.appendChild(link);
    }
})();