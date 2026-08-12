import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bookmarklets = [
    'aria-reference-checker',
    'dialog-focus-checker',
    'focusable-element-checker',
    'hidden-focusable-checker',
    'force-focus-outline',
    'header-cell-scope-indicator',
    'image-alt-attribute-checker',
    'landmark-checker',
    'live-regions-checker',
    'non-html-link-highlighter',
    'show-form-label',
    'show-heading-level',
    'text-spacing-checker',
];

for (const name of bookmarklets) {
    test(`${name} distribution is self-contained and documented`, async () => {
        const code = (await readFile(`${name}/${name}.js`, 'utf8')).trim();
        const readme = await readFile(`${name}/README.md`, 'utf8');
        assert.match(code, /^javascript:/);
        assert.equal(code.includes('\n'), false);
        assert.equal(code.includes('github.io'), false);
        assert.ok(readme.includes(`\`\`\`text\n${code}\n\`\`\``));
    });
}
