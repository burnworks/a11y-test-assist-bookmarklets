javascript: (() => {
    const focusableElements = document.querySelectorAll('a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach(elem => {
        const existingStyle = elem.getAttribute('style') || '';
        elem.setAttribute('style', `${existingStyle}; outline: 2px dotted #B71C1C;`);
    });
})();
