import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const bookmarklets = [
    'focusable-element-checker',
    'force-focus-outline',
    'header-cell-scope-indicator',
    'image-alt-attribute-checker',
    'non-html-link-highlighter',
    'show-form-label',
    'show-heading-level',
];

for (const name of bookmarklets) {
    const result = await build({
        entryPoints: [`src/bookmarklets/${name}.js`],
        bundle: true,
        format: 'iife',
        minify: true,
        target: ['chrome100', 'firefox100', 'safari15.4'],
        write: false,
    });
    const code = result.outputFiles[0].text.trim();
    const outputPath = path.join(name, `${name}.js`);
    await writeFile(outputPath, `javascript:${code}\n`, 'utf8');
    console.log(`built ${outputPath}`);
}

