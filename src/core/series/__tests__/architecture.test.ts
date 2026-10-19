import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import {SERIES_TYPE} from '../../constants/chart-types';

const sourceRoot = path.resolve(__dirname, '../../..');
const seriesNames = new Set<string>(Object.values(SERIES_TYPE));

function getRuntimeFiles(directory: string): string[] {
    return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return entry.name.startsWith('__') ? [] : getRuntimeFiles(file);
        }
        return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [file] : [];
    });
}

function getSeriesDependencies(source: string, includeTypes = false): string[] {
    const file = ts.createSourceFile('runtime.tsx', source, ts.ScriptTarget.Latest, true);
    const dependencies: string[] = [];
    const visit = (node: ts.Node) => {
        if (
            !includeTypes &&
            (ts.isTypeNode(node) ||
                (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) ||
                (ts.isExportDeclaration(node) && node.isTypeOnly))
        ) {
            return;
        }
        if (ts.isStringLiteralLike(node)) {
            const value = node.text;
            const shapeDirectory = value.match(/(?:^|\/)shapes\/([^/]+)/)?.[1];
            const moduleName = value.split('/').pop();
            if (
                seriesNames.has(value) ||
                /(?:^|\/)plugins(?:\/|$)/.test(value) ||
                (shapeDirectory && seriesNames.has(shapeDirectory)) ||
                (moduleName && seriesNames.has(moduleName))
            ) {
                dependencies.push(value);
            }
        }
        if (ts.isIdentifier(node) && node.text === 'SERIES_TYPE') {
            dependencies.push(node.text);
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    return dependencies;
}

function getPluginDependencies(source: string): string[] {
    return ts
        .preProcessFile(source, true, true)
        .importedFiles.map(({fileName}) => fileName)
        .filter((fileName) => /(?:^|\/)plugins(?:\/|$)/.test(fileName));
}

it('keeps shared code and public types independent of plugin internals', () => {
    const files = ['core', 'components', 'hooks', 'types'].flatMap((directory) =>
        getRuntimeFiles(path.join(sourceRoot, directory)),
    );
    const violations = files.flatMap((file) => {
        const relativePath = path.relative(sourceRoot, file);
        return (
            getPluginDependencies(readFileSync(file, 'utf8'))
                // The public component entrypoint initializes the built-in registry.
                .filter(
                    (dependency) =>
                        !(relativePath === 'components/index.tsx' && dependency === '../plugins'),
                )
                .map((dependency) => `${relativePath}: ${dependency}`)
        );
    });
    expect(violations).toEqual([]);
});

it.each([
    "import type {LineInteractionItem} from '../../../plugins/line/interaction-types';",
    "export type {ChartSankeyLinkPoint} from '../../../plugins/sankey/interaction-types';",
    "type Item = {point: import('../../../plugins/line/interaction-types').LineInteractionItem};",
    "import {linePlugin} from '../../../plugins/line';",
    "const plugin = require('../../../plugins/line');",
])('detects plugin internals, including type-only dependencies: %s', (source) => {
    expect(getPluginDependencies(source)).toHaveLength(1);
});

it('keeps interaction contracts generic, including type-only dependencies', () => {
    const source = readFileSync(path.join(sourceRoot, 'core/types/chart/interaction.ts'), 'utf8');
    expect(getSeriesDependencies(source, true)).toEqual([]);
    expect(getSeriesDependencies("type Item = {series: {type: 'bar-y'}};", true)).toEqual([
        'bar-y',
    ]);
    expect(getSeriesDependencies("import type {BarYSeriesData} from './bar-y';", true)).toEqual([
        './bar-y',
    ]);
});

it('keeps the migrated tooltip runtime independent of built-in series implementations', () => {
    const files = [
        ...getRuntimeFiles(path.join(sourceRoot, 'components/Tooltip')),
        ...getRuntimeFiles(path.join(sourceRoot, 'core/tooltip')),
        ...getRuntimeFiles(path.join(sourceRoot, 'hooks/useTooltip')),
        path.join(sourceRoot, 'core/utils/tooltip.ts'),
        path.join(sourceRoot, 'core/utils/tooltip-helpers.ts'),
        path.join(sourceRoot, 'components/ChartInner/utils/tooltip.ts'),
    ];
    const violations = files.flatMap((file) =>
        getSeriesDependencies(readFileSync(file, 'utf8')).map(
            (dependency) => `${path.relative(sourceRoot, file)}: ${dependency}`,
        ),
    );
    expect(violations).toEqual([]);
});

it('keeps migrated grouping and clipping independent of built-in series implementations', () => {
    const files = [
        'core/series/layers.ts',
        'core/series/prepareSeries.ts',
        'core/shapes/utils.ts',
        'hooks/useShapes/index.tsx',
        'hooks/useRangeSlider/index.ts',
        'components/ChartInner/useChartInnerProps.ts',
    ];
    const violations = files.flatMap((file) =>
        getSeriesDependencies(readFileSync(path.join(sourceRoot, file), 'utf8')).map(
            (dependency) => `${file}: ${dependency}`,
        ),
    );
    expect(violations).toEqual([]);
});

it('keeps chart interaction coordination independent of built-in series implementations', () => {
    const files = [
        'core/utils/chart-interaction.ts',
        'core/utils/nearest-point.ts',
        'core/utils/svg-hit-test.ts',
        'core/utils/get-closest-data.ts',
        'core/types/chart/interaction.ts',
        'components/ChartInner/index.tsx',
        'components/ChartInner/useChartInnerHandlers.ts',
        'hooks/useShapes/SeriesShapes.tsx',
        'hooks/useShapes/MarkerLayer.tsx',
    ];
    const violations = files.flatMap((file) =>
        getSeriesDependencies(readFileSync(path.join(sourceRoot, file), 'utf8')).map(
            (dependency) => `${file}: ${dependency}`,
        ),
    );
    expect(violations).toEqual([]);
});

it.each([
    "switch (series.type) { case 'line': break; }",
    "const types = new Set(['radar', 'bar-y']);",
    'const types = [SERIES_TYPE.Line];',
    "import {linePlugin} from '../../../plugins/line';",
    "const renderer = require('~core/shapes/line/renderer');",
])('detects a series dependency: %s', (source) => {
    expect(getSeriesDependencies(source).length).toBeGreaterThan(0);
});

it('allows core-owned types and reusable shape primitives', () => {
    expect(
        getSeriesDependencies(`
            import type {LineSeries} from '~core/types/chart/line';
            export type {LineSeries} from '~core/types/chart/line';
            import {getRectPath} from '~core/shapes/utils';
            type SeriesName = 'line' | 'radar';
        `),
    ).toEqual([]);
});
