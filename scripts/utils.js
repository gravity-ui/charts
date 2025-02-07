const fs = require('node:fs');
const path = require('node:path');

const FILE_CONFIG_NAME = 'docs-gen.json';

function getConfig() {
    const filePath = path.resolve(process.cwd(), `./${FILE_CONFIG_NAME}`);
    const file = fs.readFileSync(filePath, {encoding: 'utf8'});
    let config;

    try {
        config = JSON.parse(file);
    } catch {
        config = {
            pathToTocFile: './toc.yaml',
            pathToDocsFolder: './',
            typedocOptions: {
                out: './pages/api',
                entryFileName: 'overview.md',
            },
        };
    }

    return config;
}

module.exports = {
    getConfig,
};
