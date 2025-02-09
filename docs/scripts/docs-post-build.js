const fs = require('node:fs');
const path = require('node:path');

const docsDir = path.resolve(process.cwd(), '../dist-docs');
const styleToAdd = `
    <style type="text/css">
        .yfm a code {
            color: inherit !important;
            background-color: unset !important;
        }
    </style>
`;

function addStylesToHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            addStylesToHtmlFiles(filePath);
        } else if (path.extname(file) === '.html') {
            let content = fs.readFileSync(filePath, 'utf8');
            content = content.replace('</head>', `${styleToAdd}\n</head>`);
            fs.writeFileSync(filePath, content);
        }
    });
}

addStylesToHtmlFiles(docsDir);
