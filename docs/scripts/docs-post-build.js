const fs = require('node:fs');
const path = require('node:path');

const docsDir = path.resolve(process.cwd(), '../dist-docs');
const examplesJsPath = path.resolve(process.cwd(), '../docs/examples/dist/chart-examples.js');
const examplesCssPath = path.resolve(process.cwd(), '../docs/examples/dist/chart-examples.css');
const examplesOutDir = path.join(docsDir, '_examples');

const styleToAdd = `
    <style type="text/css">
        .yfm a code {
            color: inherit !important;
            background-color: unset !important;
        }
    </style>
`;

function buildExamplesAssets() {
    if (!fs.existsSync(examplesJsPath)) {
        console.warn('[docs-post-build] chart-examples.js not found, skipping examples injection');
        return {hasJs: false, hasCss: false};
    }

    fs.mkdirSync(examplesOutDir, {recursive: true});
    fs.copyFileSync(examplesJsPath, path.join(examplesOutDir, 'chart-examples.js'));

    const hasCss = fs.existsSync(examplesCssPath);
    if (hasCss) {
        fs.copyFileSync(examplesCssPath, path.join(examplesOutDir, 'chart-examples.css'));
    }

    return {hasJs: true, hasCss};
}

function buildExamplesTags({hasCss}) {
    const scriptTag = `    <script type="module" src="_examples/chart-examples.js"></script>`;
    if (!hasCss) {
        return {linkTag: null, scriptTag};
    }
    return {
        linkTag: `    <link rel="stylesheet" href="_examples/chart-examples.css" />`,
        scriptTag,
    };
}

function processHtmlFiles(dir, assets, tags) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processHtmlFiles(filePath, assets, tags);
        } else if (path.extname(file) === '.html') {
            let content = fs.readFileSync(filePath, 'utf8');
            content = content.replace('</head>', `${styleToAdd}\n</head>`);
            if (assets.hasJs && content.includes('data-chart-example')) {
                if (tags.linkTag) {
                    content = content.replace('</head>', `${tags.linkTag}\n</head>`);
                }
                content = content.replace('</body>', `${tags.scriptTag}\n</body>`);
            }
            fs.writeFileSync(filePath, content);
        }
    });
}

const assets = buildExamplesAssets();
const tags = assets.hasJs ? buildExamplesTags(assets) : {linkTag: null, scriptTag: null};
processHtmlFiles(docsDir, assets, tags);
