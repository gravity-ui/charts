const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {verifyExamples} = require('./verify-examples');

describe('documentation example catalog', () => {
    let buildDir;
    const html = '<h2 id="labels">Labels</h2><div data-chart-example="line/labels"></div>';
    const meta = {
        'line/labels': {
            title: 'Labels',
            description: 'Place labels above points.',
            seriesType: 'Line',
            docsUrl: 'line.html#labels',
        },
    };

    beforeEach(() => {
        buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charts-examples-'));
        fs.writeFileSync(path.join(buildDir, 'line.html'), html);
    });

    afterEach(() => fs.rmSync(buildDir, {recursive: true, force: true}));

    it('accepts the same example embedded on multiple pages with one catalog entry', () => {
        expect(() => verifyExamples(meta, [html, html], buildDir)).not.toThrow();
    });

    it('ignores escaped embed snippets in development instructions', () => {
        expect(() =>
            verifyExamples(
                {},
                ['<code>&lt;div data-chart-example="placeholder"&gt;</code>'],
                buildDir,
            ),
        ).not.toThrow();
    });

    it('rejects a documented example omitted from the catalog', () => {
        expect(() => verifyExamples({}, [html], buildDir)).toThrow('missing gallery metadata');
    });

    it('rejects examples without descriptions', () => {
        expect(() =>
            verifyExamples(
                {'line/labels': {...meta['line/labels'], description: ''}},
                [html],
                buildDir,
            ),
        ).toThrow('missing description');
    });

    it('rejects broken documentation anchors', () => {
        fs.writeFileSync(
            path.join(buildDir, 'line.html'),
            html.replace('id="labels"', 'id="renamed"'),
        );
        expect(() => verifyExamples(meta, [html], buildDir)).toThrow(
            'missing documentation anchor',
        );
    });

    it.each([{group: 'unknown'}, {group: 1}, {order: -1}, {order: '0'}])(
        'rejects invalid gallery options %j',
        (gallery) => {
            expect(() =>
                verifyExamples(
                    {'line/labels': {...meta['line/labels'], gallery}},
                    [html],
                    buildDir,
                ),
            ).toThrow('invalid gallery.');
        },
    );

    it('allows catalog examples linking to the section that explains their feature', () => {
        fs.writeFileSync(path.join(buildDir, 'line.html'), '<h2 id="labels">Labels</h2>');
        expect(() => verifyExamples(meta, [], buildDir)).not.toThrow();
    });
});
