const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {readExample, readExamples} = require('../examples/read-examples');

const metadata = {
    title: 'Basic line chart',
    description: 'A categorical X axis.',
    seriesType: 'Line',
    docsUrl: 'pages/line.html#example',
    gallery: {order: 0, group: 'axes'},
};

describe('example file registration', () => {
    let dir;
    let file;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'charts-example-source-'));
        fs.mkdirSync(path.join(dir, 'line'));
        file = path.join(dir, 'line/basic.tsx');
    });
    afterEach(() => fs.rmSync(dir, {recursive: true, force: true}));

    it('discovers files and reads literal metadata without executing the component module', () => {
        fs.writeFileSync(
            file,
            `
            throw new Error('Must not execute');
            export default function Example() { return <div />; }
            export const meta = ${JSON.stringify(metadata)} satisfies ExampleMeta;
        `,
        );
        expect(readExamples(dir)).toEqual({'line/basic': metadata});
    });

    it('omits metadata from displayed code while preserving the component and later declarations', () => {
        fs.writeFileSync(
            file,
            `import React from 'react';
import type {ExampleMeta} from '../gallery';
import {Chart} from '@gravity-ui/charts';
export const meta = ${JSON.stringify(metadata)} satisfies ExampleMeta;
const data = {series: {data: []}};
export default function Example() { return <Chart data={data} />; }
`,
        );
        const {code} = readExample(file);
        expect(code).toBe(`import React from 'react';
import {Chart} from '@gravity-ui/charts';
const data = {series: {data: []}};
export default function Example() { return <Chart data={data} />; }`);
    });

    it('rejects a component without exported metadata', () => {
        fs.writeFileSync(file, 'export default function Example() { return <div />; }');
        expect(() => readExamples(dir)).toThrow('missing exported meta');
    });

    it('rejects computed metadata instead of executing arbitrary expressions during validation', () => {
        fs.writeFileSync(file, 'export const meta = {title: getTitle()};');
        expect(() => readExample(file)).toThrow('metadata must use literal');
    });

    it('rejects shared declarations so hiding metadata cannot remove example code', () => {
        fs.writeFileSync(file, 'export const meta = {}, data = {};');
        expect(() => readExample(file)).toThrow('must declare meta separately');
    });
});
