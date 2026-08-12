import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const bookmarklets = [
    'aria-reference-checker',
    'dialog-focus-checker',
    'focusable-element-checker',
    'hidden-focusable-checker',
    'force-focus-outline',
    'header-cell-scope-indicator',
    'image-alt-attribute-checker',
    'interactive-name-checker',
    'landmark-checker',
    'language-checker',
    'link-purpose-checker',
    'live-regions-checker',
    'show-heading-level',
    'text-spacing-checker',
    'target-size-checker',
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
    const bookmarklet = `javascript:${code}`;
    await writeFile(outputPath, `${bookmarklet}\n`, 'utf8');
    const readmePath = path.join(name, 'README.md');
    const readme = await readFile(readmePath, 'utf8');
    const startMarker = '<!-- bookmarklet:start -->';
    const endMarker = '<!-- bookmarklet:end -->';
    if (!readme.includes(startMarker) || !readme.includes(endMarker)) {
        throw new Error(`${readmePath} is missing bookmarklet markers`);
    }
    const block = `${startMarker}\n\n\`\`\`text\n${bookmarklet}\n\`\`\`\n\n${endMarker}`;
    const nextReadme = readme.replace(
        new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
        () => block,
    );
    await writeFile(readmePath, `${nextReadme.trimEnd()}\n`, 'utf8');
    console.log(`built ${outputPath}`);
}
