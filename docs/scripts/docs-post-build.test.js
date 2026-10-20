const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {runInNewContext} = require('node:vm');

describe('documentation example assets', () => {
    let rootDir;

    beforeEach(() => {
        rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charts-docs-assets-'));
        const assetsDir = path.join(rootDir, 'docs/examples/dist');
        fs.mkdirSync(assetsDir, {recursive: true});
        fs.mkdirSync(path.join(rootDir, 'dist-docs'));
        fs.writeFileSync(path.join(assetsDir, 'chart-examples.js'), '');
        fs.writeFileSync(path.join(assetsDir, 'chart-examples.css'), '');
    });

    afterEach(() => fs.rmSync(rootDir, {recursive: true, force: true}));

    it('loads assets for embeds but not escaped documentation snippets', () => {
        const pages = {
            guide: '<div data-chart-example="line/basic"></div>',
            catalog: '<div data-chart-examples></div>',
            overview: '<div data-chart-dashboard></div>',
            development:
                '<code>&lt;div data-chart-example="your/example-id"&gt;&lt;/div&gt;</code>',
        };
        for (const [name, body] of Object.entries(pages)) {
            fs.writeFileSync(
                path.join(rootDir, 'dist-docs', `${name}.html`),
                `<html><head></head><body>${body}</body></html>`,
            );
        }

        execFileSync(process.execPath, [path.join(__dirname, 'docs-post-build.js')], {
            cwd: path.join(rootDir, 'docs'),
        });

        for (const name of Object.keys(pages)) {
            const html = fs.readFileSync(path.join(rootDir, 'dist-docs', `${name}.html`), 'utf8');
            expect(html.includes('src="_examples/chart-examples.js"')).toBe(name !== 'development');
            expect(html.includes('href="_examples/chart-examples.css"')).toBe(
                name !== 'development',
            );
        }
        expect(
            fs.existsSync(path.join(rootDir, 'dist-docs/pages/guides/axes/axis-labels.html')),
        ).toBe(false);
    });

    it('redirects the old axes guide while preserving the query and section anchor', () => {
        const axesDir = path.join(rootDir, 'dist-docs/pages/guides/axes');
        fs.mkdirSync(axesDir, {recursive: true});
        fs.writeFileSync(
            path.join(axesDir, 'index.html'),
            '<html><head></head><body>Axes</body></html>',
        );

        execFileSync(process.execPath, [path.join(__dirname, 'docs-post-build.js')], {
            cwd: path.join(rootDir, 'docs'),
        });

        const html = fs.readFileSync(path.join(axesDir, 'axis-labels.html'), 'utf8');
        const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
        expect(script).toBeDefined();
        const replace = jest.fn();
        runInNewContext(script, {location: {search: '?theme=dark', hash: '#html-labels', replace}});
        expect(replace).toHaveBeenCalledWith('index.html?theme=dark#html-labels');
    });
});
