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
        return /\.tsx?$/.test(entry.name) ? [file] : [];
    });
}

function getSeriesDependencies(source: string): string[] {
    const file = ts.createSourceFile('tooltip.tsx', source, ts.ScriptTarget.Latest, true);
    const dependencies: string[] = [];
    const visit = (node: ts.Node) => {
        if (
            ts.isTypeNode(node) ||
            (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly)
        ) {
            return;
        }
        if (ts.isStringLiteralLike(node)) {
            const value = node.text;
            const shapeDirectory = value.match(/(?:^|\/)shapes\/([^/]+)/)?.[1];
            if (
                seriesNames.has(value) ||
                /(?:^|\/)plugins(?:\/|$)/.test(value) ||
                (shapeDirectory && seriesNames.has(shapeDirectory))
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

it.each([
    "switch (series.type) { case 'line': break; }",
    "const types = new Set(['radar', 'bar-y']);",
    'const types = [SERIES_TYPE.Line];',
    "import {linePlugin} from '../../../plugins/line';",
    "const renderer = require('~core/shapes/line/renderer');",
])('detects a series dependency: %s', (source) => {
    expect(getSeriesDependencies(source).length).toBeGreaterThan(0);
});

it('allows type-only dependencies and reusable shape primitives', () => {
    expect(
        getSeriesDependencies(`
            import type {LineSeries} from '../../../plugins/line/types';
            import {getRectPath} from '~core/shapes/utils';
            type SeriesName = 'line' | 'radar';
        `),
    ).toEqual([]);
});
