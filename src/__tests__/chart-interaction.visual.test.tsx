import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import {ClickTargetsExample} from '../../docs/examples/src/charts/interactions/click-targets';
import type {ChartData, ChartSeries, SeriesColor} from '../types';

import {ChartInteractionTestStory} from './components/ChartInteractionTestStory';
import {getLocatorBoundingBox} from './utils';

async function paintedPosition(locator: Locator) {
    await expect(locator).toBeAttached();
    return locator.evaluate((node) => {
        const element = node as SVGGeometryElement;
        const box = element.getBBox();
        const style = getComputedStyle(element);
        const matrix = element.getScreenCTM()!;
        if (style.fill !== 'none') {
            for (const x of [10, 8, 12, 6, 14, 4, 16, 2, 18]) {
                for (const y of [10, 8, 12, 6, 14, 4, 16, 2, 18]) {
                    const point = new DOMPoint(
                        box.x + (box.width * x) / 20,
                        box.y + (box.height * y) / 20,
                    );
                    if (element.isPointInFill(point)) {
                        const screen = point.matrixTransform(matrix);
                        screen.x = Math.round(screen.x);
                        screen.y = Math.round(screen.y);
                        if (element.isPointInFill(screen.matrixTransform(matrix.inverse()))) {
                            return {x: screen.x, y: screen.y};
                        }
                    }
                }
            }
        }
        const point = element
            .getPointAtLength(element.getTotalLength() / 2)
            .matrixTransform(matrix);
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const screen = new DOMPoint(Math.round(point.x) + dx, Math.round(point.y) + dy);
                if (element.isPointInStroke(screen.matrixTransform(matrix.inverse()))) {
                    return {x: screen.x, y: screen.y};
                }
            }
        }
        throw new Error('No painted position found');
    });
}

function chart(series: ChartSeries[], extra: Partial<ChartData> = {}): ChartData {
    return {
        chart: {events: {clickMode: 'plot'}},
        legend: {enabled: false},
        tooltip: {enabled: false},
        series: {data: series},
        ...extra,
    };
}

const custom = {issues: ['ISSUE-1']};

for (const clickMode of [undefined, 'tooltip'] as const) {
    test(`Legacy click mode (${clickMode ?? 'default'}) skips missing selections and preserves arguments`, async ({
        mount,
        page,
    }) => {
        const data = chart([{type: 'pie', data: [{name: 'Open', value: 10}]}], {
            chart: {events: {clickMode}},
        });
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const pie = component.locator('.gcharts-pie__segment');
        await expect(pie).toBeVisible();
        const corner = await component.locator('.gcharts-chart__content').evaluate((node) => {
            const p = new DOMPoint(2, 2).matrixTransform(
                (node as SVGGraphicsElement).getScreenCTM()!,
            );
            return {x: p.x, y: p.y};
        });
        await page.mouse.click(corner.x, corner.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('0');
        const position = await paintedPosition(pie);
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.legacy.point).toEqual({name: 'Open', value: 10});
        expect(result.hasLegacyEvent).toBe(true);

        await component.update(
            <ChartInteractionTestStory
                data={{
                    ...data,
                    series: {
                        data: [
                            {
                                type: 'pie',
                                tooltip: {enabled: false},
                                data: [{name: 'Open', value: 10}],
                            },
                        ],
                    },
                }}
            />,
        );
        await expect(pie).toBeVisible();
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
    });
}

for (const type of ['line', 'area', 'scatter'] as const) {
    test(`${type}: zero-mode interactions preserve source values and legacy selection`, async ({
        mount,
        page,
    }) => {
        const source = {x: 1, y: null, custom: 'null-source'};
        const data = chart(
            [
                {
                    type,
                    name: 'Values',
                    nullMode: 'zero',
                    ...(type === 'scatter' ? {} : {marker: {enabled: true, radius: 8}}),
                    data: [{x: 0, y: 5}, source, {x: 2, y: 5}],
                },
            ],
            {xAxis: {min: 0, max: 2}, yAxis: [{min: -1, max: 6}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} />);
        await expect(component.locator(`.gcharts-${type}`)).toBeVisible();
        const position = await component.locator('.gcharts-chart__content').evaluate((node) => {
            const plot = node as SVGGraphicsElement;
            const point = new DOMPoint(
                Number(plot.getAttribute('width')) / 2,
                (Number(plot.getAttribute('height')) * 6) / 7,
            ).matrixTransform(plot.getScreenCTM()!);
            return {x: point.x, y: point.y};
        });
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.chart.point).toEqual(source);
        expect(result.tooltip.point).toEqual(source);
        expect(result.targets).toEqual(
            expect.arrayContaining([expect.objectContaining({point: source})]),
        );
        for (const item of result.targets) {
            if (item.point.kind === 'shape') {
                expect(item.point.points).toContainEqual(source);
            }
        }
        expect(result.legacy.point).toEqual({...source, y: 0});
    });
}

for (const duplicateVertices of [false, true]) {
    test(`Stacked area returns source points without synthetic zeros or geometry duplicates (${duplicateVertices})`, async ({
        mount,
        page,
    }) => {
        const points = duplicateVertices
            ? [
                  {x: 0, y: 5, custom: 'a'},
                  {x: 1, y: 5, custom: 'b'},
                  {x: 2, y: 5, custom: 'c'},
              ]
            : [
                  {x: 0, y: 5, custom: 'a'},
                  {x: 2, y: 5, custom: 'c'},
              ];
        const data = chart(
            [
                {type: 'area', name: 'Top', stacking: 'normal', data: points},
                {
                    type: 'area',
                    name: 'Bottom',
                    stacking: 'normal',
                    data: [
                        {x: 0, y: duplicateVertices ? 5 : null},
                        {x: 1, y: 5, custom: 'real', tooltip: {enabled: false}},
                        {x: 2, y: null},
                    ],
                },
            ],
            {xAxis: {min: 0, max: 2}, yAxis: [{min: 0, max: 20}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const area = component.locator('.gcharts-area__region').last();
        const position = await paintedPosition(area);
        await page.mouse.click(position.x, position.y);
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(
            result.targets.find((item: {name: string}) => item.name === 'Top').point.points,
        ).toEqual(points);
        if (!duplicateVertices) {
            const gap = await component.locator('.gcharts-chart__content').evaluate((node) => {
                const plot = node as SVGGraphicsElement;
                const p = new DOMPoint(
                    Number(plot.getAttribute('width')) / 2,
                    Number(plot.getAttribute('height')) * 0.75,
                ).matrixTransform(plot.getScreenCTM()!);
                return {x: p.x, y: p.y};
            });
            await page.mouse.click(gap.x, gap.y);
            await expect(component.getByTestId('interaction-count')).toHaveText('2');
            const nearest = JSON.parse(
                (await component.getByTestId('interaction-result').textContent())!,
            );
            expect(nearest.chart.point).toEqual({
                x: 1,
                y: 5,
                custom: 'real',
                tooltip: {enabled: false},
            });
        }
    });
}

for (const color of ['transparent-gradient', 'color(srgb 1 0 0 / 0)', 'color(srgb 1 0 0 / 0.5)']) {
    test(`Exact hits respect paint alpha: ${color}`, async ({mount, page}) => {
        const points = [
            {x: 2, y: 10},
            {x: 8, y: 10},
        ];
        const fillColor: SeriesColor =
            color === 'transparent-gradient'
                ? {
                      type: 'linear-gradient',
                      stops: [
                          {offset: 0, color: 'rgba(255,0,0,0)'},
                          {offset: 1, color: 'rgba(0,0,255,0)'},
                      ],
                  }
                : color;
        const data = chart(
            [
                {type: 'area', name: 'Base', data: points},
                {type: 'area', name: 'Overlay', data: points, fillColor},
            ],
            {xAxis: {min: 0, max: 10}, yAxis: [{min: 0, max: 20}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const position = await paintedPosition(component.locator('.gcharts-area__region').last());
        await page.mouse.click(position.x, position.y);
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets.map((item: {name: string}) => item.name)).toEqual(
            color.endsWith('0.5)') ? ['Overlay', 'Base'] : ['Base'],
        );
    });
}

test('Transparent portions of a gradient do not mask underlying exact targets', async ({
    mount,
    page,
}) => {
    const points = [
        {x: 0, y: 10},
        {x: 10, y: 10},
    ];
    const data = chart(
        [
            {type: 'area', name: 'Base', data: points},
            {
                type: 'area',
                name: 'Overlay',
                data: points,
                fillColor: {
                    type: 'linear-gradient',
                    angle: 90,
                    stops: [
                        {offset: 0, color: 'transparent'},
                        {offset: 0.5, color: 'transparent'},
                        {offset: 1, color: '#f00'},
                    ],
                },
            },
        ],
        {xAxis: {min: 0, max: 10}, yAxis: [{min: 0, max: 20}]},
    );
    const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
    const area = component.locator('.gcharts-area__region').last();
    await expect(area).toBeVisible();
    const positions = await area.evaluate((node) => {
        const element = node as SVGGraphicsElement;
        const box = element.getBBox();
        return [0.25, 0.75].map((fraction) => {
            const p = new DOMPoint(
                box.x + box.width * fraction,
                box.y + box.height / 2,
            ).matrixTransform(element.getScreenCTM()!);
            return {x: p.x, y: p.y};
        });
    });
    for (const [index, position] of positions.entries()) {
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText(String(index + 1));
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets.map((item: {name: string}) => item.name)).toEqual(
            index ? ['Overlay', 'Base'] : ['Base'],
        );
    }
});

const cases: {type: ChartSeries['type']; selector: string; data: ChartData; shape?: boolean}[] = [
    {
        type: 'bar-x',
        selector: '.gcharts-bar-x__segment',
        data: chart([{type: 'bar-x', name: 'Issues', data: [{x: 0, y: 10, custom}]}]),
    },
    {
        type: 'bar-y',
        selector: '.gcharts-bar-y__segment',
        data: chart([{type: 'bar-y', name: 'Issues', data: [{x: 10, y: 0, custom}]}]),
    },
    {
        type: 'waterfall',
        selector: '.gcharts-waterfall__segment',
        data: chart([{type: 'waterfall', name: 'Issues', data: [{x: 0, y: 10, custom}]}], {
            xAxis: {type: 'category', categories: ['A']},
        }),
    },
    {
        type: 'x-range',
        selector: '.gcharts-x-range__segment',
        data: chart([{type: 'x-range', name: 'Issues', data: [{x0: 0, x1: 10, y: 0, custom}]}]),
    },
    {
        type: 'pie',
        selector: '.gcharts-pie__segment',
        data: chart([{type: 'pie', data: [{name: 'Open', value: 10, custom}]}]),
    },
    {
        type: 'funnel',
        selector: '.gcharts-funnel polygon',
        data: chart([{type: 'funnel', name: 'Issues', data: [{name: 'Open', value: 10, custom}]}]),
    },
    {
        type: 'treemap',
        selector: '.gcharts-treemap rect',
        data: chart([{type: 'treemap', name: 'Issues', data: [{name: 'Open', value: 10, custom}]}]),
    },
    {
        type: 'heatmap',
        selector: '.gcharts-heatmap rect',
        data: chart([{type: 'heatmap', name: 'Issues', data: [{x: 0, y: 0, value: 10, custom}]}], {
            xAxis: {type: 'category', categories: ['A']},
            yAxis: [{type: 'category', categories: ['B']}],
        }),
    },
    {
        type: 'scatter',
        selector: '.gcharts-scatter .gcharts-marker__symbol',
        data: chart([{type: 'scatter', name: 'Issues', data: [{x: 0, y: 10, custom}]}]),
    },
    {
        type: 'line',
        selector: '.gcharts-line > path',
        shape: true,
        data: chart([
            {
                type: 'line',
                name: 'Issues',
                data: [
                    {x: 0, y: 10, custom},
                    {x: 1, y: 20, custom},
                ],
            },
        ]),
    },
    {
        type: 'area',
        selector: '.gcharts-area__region',
        shape: true,
        data: chart([
            {
                type: 'area',
                name: 'Issues',
                data: [
                    {x: 0, y: 10, custom},
                    {x: 1, y: 20, custom},
                ],
            },
        ]),
    },
    {
        type: 'area-range',
        selector: '.gcharts-area-range__region',
        shape: true,
        data: chart([
            {
                type: 'area-range',
                name: 'Issues',
                data: [
                    {x: 0, y0: 10, y1: 20, custom},
                    {x: 1, y0: 10, y1: 20, custom},
                ],
            },
        ]),
    },
    {
        type: 'radar',
        selector: '.gcharts-radar__area > path',
        shape: true,
        data: chart([
            {
                type: 'radar',
                name: 'Issues',
                categories: [
                    {key: 'A', maxValue: 10},
                    {key: 'B', maxValue: 10},
                    {key: 'C', maxValue: 10},
                ],
                data: [
                    {value: 5, custom},
                    {value: 5, custom},
                    {value: 5, custom},
                ],
            },
        ]),
    },
    {
        type: 'sankey',
        selector: '.gcharts-sankey rect',
        data: chart([
            {
                type: 'sankey',
                name: 'Issues',
                data: [
                    {name: 'Open', links: [{name: 'Closed', value: 10}], custom},
                    {name: 'Closed', links: [], custom},
                ],
            },
        ]),
    },
];

test.describe('Chart interaction queries', () => {
    const fills: {name: string; color: SeriesColor; visible: boolean}[] = [
        {name: 'zero-alpha RGBA', color: 'rgba(0, 0, 0, 0)', visible: false},
        {name: 'transparent keyword', color: 'transparent', visible: false},
        {name: 'partial alpha', color: 'rgba(0, 0, 0, 0.25)', visible: true},
        {
            name: 'visible gradient',
            color: {
                type: 'linear-gradient',
                stops: [
                    {offset: 0, color: 'red'},
                    {offset: 1, color: 'blue'},
                ],
            },
            visible: true,
        },
    ];
    for (const fill of fills) {
        test(`Exact hits respect fill visibility (${fill.name})`, async ({mount, page}) => {
            const points = [
                {x: 2, y: 10},
                {x: 8, y: 10},
            ];
            const data = chart(
                [
                    {type: 'area', name: 'Base', data: points},
                    {type: 'area', name: 'Overlay', fillColor: fill.color, data: points},
                ],
                {xAxis: {min: 0, max: 10}, yAxis: [{min: 0, max: 20}]},
            );
            const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
            const shape = component.locator('.gcharts-area__region').last();
            await expect(shape).toBeAttached();
            const position = await shape.evaluate((node) => {
                const element = node as SVGGraphicsElement;
                const box = element.getBBox();
                const p = new DOMPoint(
                    box.x + box.width / 2,
                    box.y + box.height / 2,
                ).matrixTransform(element.getScreenCTM()!);
                return {x: p.x, y: p.y};
            });
            await page.mouse.click(position.x, position.y);
            await expect(component.getByTestId('interaction-count')).toHaveText('1');
            const result = JSON.parse(
                (await component.getByTestId('interaction-result').textContent())!,
            );
            expect(result.targets.map((item: {name: string}) => item.name)).toEqual(
                fill.visible ? ['Overlay', 'Base'] : ['Base'],
            );
        });
    }

    test('Transparent strokes do not obscure an area target', async ({mount, page}) => {
        const data = chart(
            [
                {
                    type: 'area',
                    name: 'Base',
                    data: [
                        {x: 2, y: 10},
                        {x: 8, y: 10},
                    ],
                },
                {
                    type: 'line',
                    name: 'Overlay',
                    color: 'rgba(0, 0, 0, 0)',
                    lineWidth: 4,
                    data: [
                        {x: 2, y: 5},
                        {x: 8, y: 5},
                    ],
                },
            ],
            {xAxis: {min: 0, max: 10}, yAxis: [{min: 0, max: 20}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const line = component.locator('.gcharts-line > path');
        await expect(line).toBeAttached();
        const position = await line.evaluate((node) => {
            const path = node as SVGGeometryElement;
            const p = path
                .getPointAtLength(path.getTotalLength() / 2)
                .matrixTransform(path.getScreenCTM()!);
            return {x: p.x, y: p.y};
        });
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets.map((item: {name: string}) => item.name)).toEqual(['Base']);
    });

    test('An opaque border remains clickable around a transparent fill', async ({mount, page}) => {
        const data = chart([
            {
                type: 'bar-x',
                name: 'Border',
                color: 'transparent',
                borderColor: 'blue',
                borderWidth: 4,
                data: [{x: 0, y: 10}],
            },
        ]);
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const bar = component.locator('.gcharts-bar-x__segment');
        await expect(bar).toBeAttached();
        const center = await bar.evaluate((node) => {
            const element = node as SVGGraphicsElement;
            const box = element.getBBox();
            const p = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(
                element.getScreenCTM()!,
            );
            return {x: p.x, y: p.y};
        });
        await page.mouse.click(center.x, center.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        let result = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
        expect(result.targets).toEqual([]);
        const border = await getLocatorBoundingBox(
            component.locator('.gcharts-bar-x__segment-border'),
        );
        await page.mouse.click(border.x + 1, border.y + border.height / 2);
        await expect(component.getByTestId('interaction-count')).toHaveText('2');
        result = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
        expect(result.targets.map((item: {name: string}) => item.name)).toEqual(['Border']);
    });

    for (const reverse of [false, true]) {
        test(`Mixed-series nearest lookup compares pixels across plugins (reverse: ${reverse})`, async ({
            mount,
            page,
        }) => {
            const series: ChartSeries[] = [
                {
                    type: 'line',
                    name: 'Near',
                    data: [
                        {x: 4, y: 2, custom: 'near'},
                        {x: 6, y: 2, custom: 'near'},
                    ],
                },
                {type: 'scatter', name: 'Far', data: [{x: 5, y: 8, custom: 'far'}]},
            ];
            const data = chart(reverse ? series.reverse() : series, {
                chart: {events: {}},
                xAxis: {min: 0, max: 10},
                yAxis: [{min: 0, max: 10}],
            });
            const component = await mount(<ChartInteractionTestStory data={data} />);
            const {x, y} = await paintedPosition(component.locator('.gcharts-line > path'));
            await page.mouse.click(x, y);
            const output = component.getByTestId('interaction-result');
            await expect(output).not.toHaveText('');
            const result = JSON.parse((await output.textContent())!);
            expect(result.chart.point.custom).toBe('near');
            expect(result.tooltip.point.custom).toBe('near');
            expect(result.legacy.point.custom).toBe('near');
        });
    }

    test('Tooltip queries and click payloads select the same topmost overlapping series', async ({
        mount,
        page,
    }) => {
        const data = chart(
            [
                {type: 'scatter', name: 'Scatter', data: [{x: 5, y: 5}]},
                {
                    type: 'line',
                    name: 'Line',
                    lineWidth: 10,
                    data: [
                        {x: 4, y: 5},
                        {x: 6, y: 5},
                    ],
                },
            ],
            {chart: {events: {}}, xAxis: {min: 0, max: 10}, yAxis: [{min: 0, max: 10}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const {x, y} = await paintedPosition(
            component.locator('.gcharts-scatter .gcharts-marker__symbol'),
        );
        await page.mouse.click(x, y);
        const output = component.getByTestId('interaction-result');
        await expect(output).not.toHaveText('');
        const result = JSON.parse((await output.textContent())!);
        expect(result.targets).toHaveLength(2);
        expect(result.tooltip.name).toBe(result.targets[0].name);
        expect(result.legacy.name).toBe(result.targets[0].name);
    });

    for (const sample of cases) {
        test(`Exact ${sample.type} hits carry series-specific data without tooltips`, async ({
            mount,
            page,
        }) => {
            const component = await mount(
                <ChartInteractionTestStory data={sample.data} query="none" />,
            );
            const shape = component.locator(sample.selector).first();
            await expect(shape).toBeVisible();
            const {x, y} = await paintedPosition(shape);
            await page.mouse.click(x, y);
            const output = component.getByTestId('interaction-result');
            await expect(output).not.toHaveText('');
            const result = JSON.parse((await output.textContent())!);
            expect(result.targets).toHaveLength(1);
            expect(result.targets[0].type).toBe(sample.type);
            const point = result.targets[0].point;
            if (sample.shape) {
                expect(point.kind).toBe('shape');
                expect(point.points[0].custom).toEqual(custom);
            } else {
                expect(point.custom).toEqual(custom);
            }
            expect(result.native).toBe(true);
            expect(result).not.toHaveProperty('chart');
            expect(result).not.toHaveProperty('tooltip');
            await component.getByRole('button', {name: 'Query saved chart'}).click();
            const nearest = JSON.parse(
                (await component.getByTestId('chart-query-result').textContent())!,
            );
            expect(nearest.type).toBe(sample.type);
            expect(nearest.point.custom).toEqual(custom);
        });
    }

    for (const level of ['series', 'point'] as const) {
        test(`Chart selection ignores ${level} tooltip filtering, legacy selection is preserved`, async ({
            mount,
            page,
        }) => {
            const disabled = {enabled: false};
            const data = chart([
                {
                    type: 'bar-y',
                    name: 'Issues',
                    tooltip: level === 'series' ? disabled : undefined,
                    data: [
                        {x: 10, y: 0, custom, tooltip: level === 'point' ? disabled : undefined},
                    ],
                },
            ]);
            const component = await mount(<ChartInteractionTestStory data={data} />);
            const bar = component.locator('.gcharts-bar-y__segment');
            await expect(bar).toBeVisible();
            const {x, y} = await paintedPosition(bar);
            await page.mouse.click(x, y);
            await expect(component.getByTestId('interaction-count')).toHaveText('1');
            const result = JSON.parse(
                (await component.getByTestId('interaction-result').textContent())!,
            );
            expect(result.chart.point.custom).toEqual(custom);
            expect(result.tooltip).toBeNull();
            expect(result.legacy).toBeNull();
            expect(result.hasLegacyEvent).toBe(true);
            expect(result.payloadKeys).toContain('point');
            expect(result.payloadKeys).toContain('series');
            expect(result.targets).toHaveLength(1);
        });
    }

    test('Empty plot clicks deliver an event with no exact hits and a nearest selection', async ({
        mount,
        page,
    }) => {
        const data = chart(
            [
                {
                    type: 'bar-x',
                    name: 'Issues',
                    data: [
                        {x: 0, y: 5},
                        {x: 1, y: 10},
                    ],
                },
            ],
            {yAxis: [{min: 0, max: 100}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} />);
        await expect(component.locator('.gcharts-bar-x__segment').last()).toBeVisible();
        const box = await getLocatorBoundingBox(component.locator('.gcharts-chart__content'));
        await page.mouse.click(box.x + box.width / 2, box.y + 5);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets).toEqual([]);
        expect(result.chart).not.toBeNull();
        expect(result.tooltip).not.toBeNull();
        expect(result.payloadKeys).toEqual([
            'chart',
            'event',
            'point',
            'position',
            'series',
            'targets',
        ]);
        expect(result.legacy.point).toEqual(result.tooltip.point);
        expect(result.hasLegacyEvent).toBe(true);
    });

    test('Chart and tooltip nearest modes can select different points', async ({mount, page}) => {
        const data = chart(
            [
                {
                    type: 'bar-y',
                    name: 'Issues',
                    data: [
                        {x: 10, y: 0, custom: 'A', tooltip: {enabled: false}},
                        {x: 10, y: 1, custom: 'B'},
                    ],
                },
            ],
            {yAxis: [{type: 'category', categories: ['A', 'B']}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const bar = component.locator('.gcharts-bar-y__segment').first();
        await expect(bar).toBeVisible();
        const {x, y} = await paintedPosition(bar);
        await page.mouse.click(x, y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent()) ?? '',
        );
        expect(result.targets[0].point.custom).toBe('A');
        expect(result.chart.point.custom).toBe('A');
        expect(result.tooltip.point.custom).toBe('B');
        expect(result.legacy.point.custom).toBe('B');
    });

    test('An empty pie region has a chart candidate while legacy selection stays empty', async ({
        mount,
        page,
    }) => {
        const component = await mount(
            <ChartInteractionTestStory
                data={cases.find((sample) => sample.type === 'pie')!.data}
            />,
        );
        const plot = component.locator('.gcharts-chart__content');
        await expect(component.locator('.gcharts-pie__segment')).toBeVisible();
        const {x, y} = await plot.evaluate((node) => {
            const position = new DOMPoint(2, 2).matrixTransform(
                (node as SVGGraphicsElement).getScreenCTM()!,
            );
            return {x: position.x, y: position.y};
        });
        await page.mouse.click(x, y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent()) ?? '',
        );
        expect(result.targets).toEqual([]);
        expect(result.chart.point.custom).toEqual(custom);
        expect(result.tooltip).toBeNull();
        expect(result.legacy).toBeNull();
    });

    test('A line above a bar is the first exact target', async ({mount, page}) => {
        const data = chart(
            [
                {
                    type: 'bar-x',
                    name: 'Issues',
                    data: [
                        {x: 0, y: 10},
                        {x: 1, y: 10},
                    ],
                },
                {
                    type: 'line',
                    name: 'Reference',
                    lineWidth: 6,
                    data: [
                        {x: 0, y: 5},
                        {x: 1, y: 5},
                    ],
                },
            ],
            {xAxis: {type: 'category', categories: ['A', 'B']}, yAxis: [{min: 0, max: 10}]},
        );
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const bar = component.locator('.gcharts-bar-x__segment').first();
        await expect(bar).toBeVisible();
        const box = await getLocatorBoundingBox(bar);
        const lineY = await component.locator('.gcharts-line > path').evaluate((node) => {
            const path = node as SVGGeometryElement;
            return path.getPointAtLength(0).matrixTransform(path.getScreenCTM()!).y;
        });
        await page.mouse.click(box.x + box.width / 2, lineY);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent()) ?? '',
        );
        expect(result.targets.map((item: {type: string}) => item.type)).toEqual(['line', 'bar-x']);
    });

    test('Donut holes have a chart candidate but no exact or tooltip selection', async ({
        mount,
        page,
    }) => {
        const data = chart([{type: 'pie', innerRadius: '70%', data: [{name: 'Open', value: 10}]}]);
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const pie = component.locator('.gcharts-pie__segment');
        await expect(pie).toBeVisible();
        const box = await getLocatorBoundingBox(pie);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets).toEqual([]);
        expect(result.chart).not.toBeNull();
        expect(result.tooltip).toBeNull();
    });

    test('Covered targets follow current paint order and preserve series metadata', async ({
        mount,
        page,
    }) => {
        const data = chart([
            {
                type: 'x-range',
                name: 'Lower',
                custom: {filter: 'lower'},
                data: [{x0: 0, x1: 10, y: 0}],
            },
            {
                type: 'x-range',
                name: 'Upper',
                custom: {filter: 'upper'},
                data: [{x0: 0, x1: 10, y: 0}],
            },
        ]);
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const shapes = component.locator('.gcharts-x-range__segment');
        await expect(shapes).toHaveCount(2);
        const {x, y} = await paintedPosition(shapes.last());
        await page.mouse.click(x, y);
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets.map((item: {name: string}) => item.name)).toEqual(['Upper', 'Lower']);
        expect(result.targets[0].custom).toEqual({filter: 'upper'});
        expect(result.targets[0].series).toEqual({
            type: 'x-range',
            id: expect.any(String),
            name: 'Upper',
            custom: {filter: 'upper'},
        });
    });

    test('Rounded corners and borders use paint contours and yield one logical hit', async ({
        mount,
        page,
    }) => {
        const data = chart([
            {
                type: 'bar-y',
                name: 'Issues',
                borderRadius: 20,
                borderWidth: 4,
                borderColor: '#000',
                data: [{x: 10, y: 0, custom}],
            },
        ]);
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const border = component.locator('.gcharts-bar-y__segment-border');
        await expect(border).toBeVisible();
        const box = await getLocatorBoundingBox(border);
        await page.mouse.click(box.x + box.width - 1, box.y + 1);
        let result = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
        expect(result.targets).toEqual([]);
        await page.mouse.click(box.x + box.width / 2, box.y + 1);
        await expect(component.getByTestId('interaction-count')).toHaveText('2');
        result = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].point.custom).toEqual(custom);
    });

    test('Sankey links return both endpoints and the link value', async ({mount, page}) => {
        const component = await mount(
            <ChartInteractionTestStory
                data={cases.find((sample) => sample.type === 'sankey')!.data}
            />,
        );
        const link = component.locator('.gcharts-sankey path').first();
        await expect(link).toHaveAttribute('d', /^M/);
        const {x, y} = await paintedPosition(link);
        await page.mouse.click(x, y);
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets[0].point).toMatchObject({
            kind: 'link',
            value: 10,
            source: {name: 'Open'},
            target: {name: 'Closed'},
        });
        expect(result.chart.point).toMatchObject({kind: 'link', value: 10});
        expect(result.tooltip.point.source).toEqual(result.targets[0].point.source);
    });

    test('Parallel Sankey links retain the selected link value in tooltip queries', async ({
        mount,
        page,
    }) => {
        const data = chart([
            {
                type: 'sankey',
                name: 'Flow',
                data: [
                    {
                        name: 'A',
                        links: [
                            {name: 'B', value: 10},
                            {name: 'B', value: 30},
                        ],
                    },
                    {name: 'B', links: []},
                ],
            },
        ]);
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const link = component.locator('.gcharts-sankey path').nth(1);
        await expect(link).toHaveAttribute('d', /^M/);
        const {x, y} = await paintedPosition(link);
        await page.mouse.click(x, y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent()) ?? '',
        );
        expect(result.targets[0].point.value).toBe(30);
        expect(result.tooltip.point.value).toBe(30);
    });

    test('Queries and exact targets use replacement data with a range-slider preview', async ({
        mount,
    }) => {
        const data = chart(
            [
                {
                    type: 'bar-x',
                    name: 'Issues',
                    data: [
                        {x: 0, y: 10, custom: 'old'},
                        {x: 1, y: 20},
                    ],
                },
            ],
            {
                xAxis: {rangeSlider: {enabled: true}},
            },
        );
        const component = await mount(<ChartInteractionTestStory data={data} query="all" />);
        const bar = component.locator('.gcharts-chart__content .gcharts-bar-x__segment').first();
        await expect(bar).toBeVisible();
        await bar.click();
        await expect(component.getByTestId('interaction-result')).toContainText('old');
        const updated = {
            ...data,
            series: {
                ...data.series,
                data: [
                    {
                        type: 'bar-x' as const,
                        name: 'Issues',
                        data: [
                            {x: 0, y: 10, custom: 'new'},
                            {x: 1, y: 20},
                        ],
                    },
                ],
            },
        };
        await component.update(<ChartInteractionTestStory data={updated} query="all" />);
        await expect
            .poll(async () => {
                await bar.click();
                return component.getByTestId('interaction-result').textContent();
            })
            .toContain('new');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets).toHaveLength(1);
        expect(result.chart.point.custom).toBe('new');
        await component.getByRole('button', {name: 'Query saved chart'}).click();
        const nearest = JSON.parse(
            (await component.getByTestId('chart-query-result').textContent())!,
        );
        expect(nearest.point.custom).toBe('new');
    });

    test('Documentation example supports exact clicks with disabled tooltips', async ({
        mount,
        page,
    }) => {
        const component = await mount(<ClickTargetsExample />);
        const bar = component.locator('.gcharts-bar-y__segment').first();
        await expect(bar).toBeVisible();
        const {x, y} = await paintedPosition(bar);
        await page.mouse.click(x, y);
        await expect(component.getByRole('status')).toHaveText('Selected: Open issues');
    });

    test('Tap delivers the same exact selection @desktop-touch', async ({mount, page}) => {
        const component = await mount(
            <ChartInteractionTestStory data={cases[0].data} query="none" />,
        );
        const bar = component.locator('.gcharts-bar-x__segment');
        await expect(bar).toBeVisible();
        const {x, y} = await paintedPosition(bar);
        await page.touchscreen.tap(x, y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent())!,
        );
        expect(result.targets[0].point.custom).toEqual(custom);
        expect(result.native).toBe(true);
    });
});

test('Exact hit testing skips paint resolution for distant shapes', async ({mount}) => {
    const data = chart(
        [
            {
                type: 'scatter',
                name: 'Scatter',
                data: Array.from({length: 100}, (_, index) => ({
                    x: 2 + (index % 5),
                    y: 2 + Math.floor(index / 5) / 5,
                })),
            },
        ],
        {xAxis: {min: 0, max: 10}, yAxis: [{min: 0, max: 10}]},
    );
    const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
    await expect(component.locator('.gcharts-scatter .gcharts-marker__symbol')).toHaveCount(100);
    const styleReads = await component.locator('.gcharts-chart__content').evaluate((node) => {
        const plot = node as SVGGraphicsElement;
        const point = new DOMPoint(5, 5).matrixTransform(plot.getScreenCTM()!);
        const original = window.getComputedStyle;
        let count = 0;
        window.getComputedStyle = (element, pseudoElement) => {
            if (element.matches('.gcharts-scatter .gcharts-marker__symbol')) count++;
            return original.call(window, element, pseudoElement);
        };
        try {
            plot.dispatchEvent(
                new MouseEvent('click', {bubbles: true, clientX: point.x, clientY: point.y}),
            );
        } finally {
            window.getComputedStyle = original;
        }
        return count;
    });
    expect(styleReads).toBe(0);
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    const result = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
    expect(result.targets).toEqual([]);
});

test('Normal line markers remain exact point targets with hover markers disabled', async ({
    mount,
    page,
}) => {
    const point = {x: 1, y: 5, custom};
    const data = chart(
        [
            {
                type: 'line',
                name: 'Line',
                marker: {enabled: true, radius: 8},
                lineWidth: 0,
                data: [point],
            },
        ],
        {
            xAxis: {min: 0, max: 2},
            yAxis: [{min: 0, max: 10}],
        },
    );
    data.series.options = {line: {states: {hover: {marker: {enabled: false}}}}};
    const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
    const marker = component.locator('.gcharts-marker__symbol');
    await expect(marker).toBeVisible();
    const position = await paintedPosition(marker);
    await page.mouse.move(position.x, position.y);
    await page.mouse.click(position.x, position.y);
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    const result = JSON.parse(
        (await component.getByTestId('interaction-result').textContent()) ?? '',
    );
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].point).toMatchObject(point);
});

for (const type of ['line', 'area', 'area-range'] as const) {
    test(`${type}: a permanent marker remains an exact target while hovered`, async ({
        mount,
        page,
    }) => {
        const point = {x: 1, y: 5, y0: 3, y1: 5, custom};
        const data: ChartData = {
            chart: {events: {clickMode: 'plot'}},
            legend: {enabled: false},
            tooltip: {enabled: false},
            xAxis: {min: 0, max: 2},
            yAxis: [{min: 0, max: 10}],
            series: {
                data: [{type, name: 'Markers', marker: {enabled: true, radius: 8}, data: [point]}],
            },
        };
        const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
        const marker = component.locator('.gcharts-marker__symbol').first();
        await expect(marker).toBeVisible();
        const position = await paintedPosition(marker);
        await page.mouse.move(position.x, position.y);
        await expect(
            component.locator('.gcharts-marker__wrapper[visibility="hidden"]'),
        ).not.toHaveCount(0);
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const result = JSON.parse(
            (await component.getByTestId('interaction-result').textContent()) ?? '',
        );
        expect(result.targets[0]?.point).toMatchObject(point);

        await page.mouse.move(0, 0);
        const hoverOnlyData: ChartData = {
            ...data,
            series: {
                data: data.series.data.map((series) => ({...series, marker: {enabled: false}})),
            },
        };
        await component.update(<ChartInteractionTestStory data={hoverOnlyData} query="none" />);
        await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(0);
        await page.mouse.move(position.x, position.y);
        await expect(component.locator('.gcharts-marker__symbol').first()).toBeVisible();
        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('2');
        const hoverOnlyResult = JSON.parse(
            (await component.getByTestId('interaction-result').textContent()) ?? '',
        );
        expect(
            hoverOnlyResult.targets.filter(
                (item: {point: {kind?: string}}) => item.point.kind !== 'shape',
            ),
        ).toEqual([]);
    });
}

test('radar hover-only markers do not become exact point targets', async ({mount, page}) => {
    const data: ChartData = {
        chart: {events: {clickMode: 'plot'}},
        legend: {enabled: false},
        tooltip: {enabled: false},
        series: {
            data: [
                {
                    type: 'radar',
                    name: 'Radar',
                    marker: {enabled: false},
                    categories: [
                        {key: 'A', maxValue: 10},
                        {key: 'B', maxValue: 10},
                        {key: 'C', maxValue: 10},
                    ],
                    data: [{value: 5}, {value: 5}, {value: 5}],
                },
            ],
        },
    };
    const component = await mount(<ChartInteractionTestStory data={data} query="none" />);
    const marker = component.locator('.gcharts-radar .gcharts-marker__symbol').first();
    await expect(marker).toBeAttached();
    const position = await marker.evaluate((node) => {
        const p = new DOMPoint(0, 0).matrixTransform((node as SVGGraphicsElement).getScreenCTM()!);
        return {x: p.x, y: p.y};
    });
    await page.mouse.move(position.x, position.y + 1);
    await expect(marker).toBeVisible();
    await page.mouse.click(position.x, position.y + 1);
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    const result = JSON.parse(
        (await component.getByTestId('interaction-result').textContent()) ?? '',
    );
    expect(result.targets.map((item: {point: {kind?: string}}) => item.point.kind)).toEqual([
        'shape',
    ]);
});

test('preserving Sankey custom does not change legacy tooltip eligibility', async ({
    mount,
    page,
}) => {
    const data: ChartData = {
        legend: {enabled: false},
        tooltip: {enabled: false},
        series: {
            data: [
                {
                    type: 'sankey',
                    name: 'Flow',
                    data: [
                        {
                            name: 'A',
                            links: [{name: 'B', value: 10}],
                            custom: 'source',
                            tooltip: {enabled: false},
                        },
                        {name: 'B', links: [], custom: 'target'},
                    ],
                },
            ],
        },
    };
    const component = await mount(<ChartInteractionTestStory data={data} />);
    const link = component.locator('.gcharts-sankey path').first();
    await expect(link).toHaveAttribute('d', /^M/);
    const position = await link.evaluate((node) => {
        const path = node as SVGGeometryElement;
        const p = path
            .getPointAtLength(path.getTotalLength() / 2)
            .matrixTransform(path.getScreenCTM()!);
        return {x: p.x, y: p.y};
    });
    await page.mouse.click(position.x, position.y);
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    const result = JSON.parse(
        (await component.getByTestId('interaction-result').textContent()) ?? '',
    );
    expect(result.targets[0].point.source.custom).toBe('source');
    expect(result.targets[0].point.source).toEqual(data.series.data[0].data[0]);
    expect(result.targets[0].point.target).toEqual(data.series.data[0].data[1]);
    expect(result.tooltip.point).toEqual(result.targets[0].point);
    expect(result.legacy?.point.name).toBe('A');
});

test('Retained queries follow range changes and exclude preview points', async ({mount}) => {
    const data = chart(
        [
            {
                type: 'bar-x',
                name: 'Values',
                data: [
                    {x: 0, y: 10, custom: 'preview-only'},
                    {x: 5, y: 10, custom: 'middle'},
                    {x: 10, y: 10, custom: 'last'},
                ],
            },
        ],
        {xAxis: {min: 0, max: 10, rangeSlider: {enabled: true}}},
    );
    const component = await mount(<ChartInteractionTestStory data={data} queryPosition={[0, 1]} />);
    const mainBars = component.locator('.gcharts-chart__content .gcharts-bar-x__segment');
    await expect(mainBars).toHaveCount(3);
    await mainBars.first().click();
    await component.getByRole('button', {name: 'Query saved chart'}).click();
    await expect(component.getByTestId('chart-query-result')).toContainText('preview-only');

    await component.update(
        <ChartInteractionTestStory
            data={{
                ...data,
                xAxis: {...data.xAxis, rangeSlider: {enabled: true, defaultRange: {size: 2}}},
            }}
            queryPosition={[0, 1]}
        />,
    );
    await expect(mainBars).toHaveCount(1);
    // Query the API retained before the range update, without a new plot click.
    await component.getByRole('button', {name: 'Query saved chart'}).click();
    const result = JSON.parse((await component.getByTestId('chart-query-result').textContent())!);
    expect(result.point.custom).toBe('last');
});

test('Component ref exposes resizing separately from the event query API', async ({mount}) => {
    const component = await mount(<ChartInteractionTestStory data={cases[0].data} />);
    const bar = component.locator('.gcharts-bar-x__segment').first();
    await expect(bar).toBeVisible();
    await bar.click();
    const result = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
    expect(result.refMethods).toEqual(['reflow']);
    expect(result.apiMethods).toEqual(['getClosest']);
    await component.getByRole('button', {name: 'Reflow chart'}).click();
    await bar.click();
    await expect(component.getByTestId('interaction-count')).toHaveText('2');
    const next = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
    expect(next.sameApi).toBe(true);
    expect(next.chart.point.custom).toEqual(custom);
});

test('API retained from a click uses current data after replacement', async ({mount}) => {
    const data = cases[0].data;
    const component = await mount(<ChartInteractionTestStory data={data} />);
    const bar = component.locator('.gcharts-bar-x__segment').first();
    await expect(bar).toBeVisible();
    await bar.click();
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    const snapshot = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
    const updated: ChartData = {
        ...data,
        series: {
            data: [{type: 'bar-x', name: 'Issues', data: [{x: 0, y: 10, custom: 'replacement'}]}],
        },
    };
    await component.update(<ChartInteractionTestStory data={updated} />);
    await expect
        .poll(async () => {
            await component.getByRole('button', {name: 'Query saved chart', exact: true}).click();
            return component.getByTestId('chart-query-result').textContent();
        })
        .toContain('replacement');
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    expect(snapshot.chart.point.custom).toEqual(custom);
    await bar.click();
    const next = JSON.parse((await component.getByTestId('interaction-result').textContent())!);
    expect(next.sameApi).toBe(true);
    await component.update(<ChartInteractionTestStory data={updated} showChart={false} />);
    await component.getByRole('button', {name: 'Query saved chart', exact: true}).click();
    await expect(component.getByTestId('chart-query-result')).toHaveText('null');
});

test('Event queries validate plot boundaries and finite coordinates', async ({mount}) => {
    const component = await mount(<ChartInteractionTestStory data={cases[0].data} />);
    const bar = component.locator('.gcharts-bar-x__segment').first();
    await expect(bar).toBeVisible();
    await bar.click();
    for (const position of [
        [-1, 0],
        [0, -1],
        [10000, 0],
        [0, 10000],
        [NaN, 0],
        [0, Infinity],
    ] as [number, number][]) {
        await component.update(
            <ChartInteractionTestStory data={cases[0].data} queryPosition={position} />,
        );
        await component.getByRole('button', {name: 'Query saved chart', exact: true}).click();
        await expect(component.getByTestId('chart-query-result')).toHaveText('null');
    }
});

test('Retained event API handles a missing plot and recovers after resize', async ({mount}) => {
    const data = cases[0].data;
    const component = await mount(<ChartInteractionTestStory data={data} />);
    const bar = component.locator('.gcharts-bar-x__segment').first();
    await expect(bar).toBeVisible();
    await bar.click();
    for (const size of [0, 1]) {
        await component.update(
            <ChartInteractionTestStory data={data} chartSize={{width: size, height: size}} />,
        );
        await component.getByRole('button', {name: 'Reflow chart'}).click();
        await expect
            .poll(async () => {
                await component
                    .getByRole('button', {name: 'Query saved chart', exact: true})
                    .click();
                return component.getByTestId('chart-query-result').textContent();
            })
            .toBe('null');
    }
    await component.update(<ChartInteractionTestStory data={data} />);
    await component.getByRole('button', {name: 'Reflow chart'}).click();
    await expect
        .poll(async () => {
            await component.getByRole('button', {name: 'Query saved chart', exact: true}).click();
            return component.getByTestId('chart-query-result').textContent();
        })
        .toContain('ISSUE-1');
});
