import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator, Page} from '@playwright/test';

import type {ChartData} from '../types';

import {ClosestGeometryTestStory} from './components/ClosestGeometryTestStory';
import {getLocatorBoundingBox} from './utils';

interface Selection {
    series: string;
    point: object;
}

interface GeometryCase {
    name: string;
    series: ChartData['series']['data'];
    position: [number, number];
    expected: Selection;
}

function createData(series: ChartData['series']['data']): ChartData {
    const axis = {
        type: 'linear' as const,
        min: 0,
        max: 300,
        startOnTick: false,
        endOnTick: false,
        visible: false,
    };
    return {
        chart: {margin: {left: 50, right: 50, top: 50, bottom: 50}},
        legend: {enabled: false},
        xAxis: axis,
        yAxis: [axis],
        series: {data: series},
    };
}

async function expectSelection(
    page: Page,
    component: Locator,
    position: [number, number],
    expected: Selection,
    margin: [number, number] = [50, 50],
) {
    const svg = await getLocatorBoundingBox(component.locator('svg'));
    const x = svg.x + margin[0] + position[0];
    const y = svg.y + margin[1] + position[1];
    await page.mouse.move(x, y);
    const hovered = page.getByTestId('hovered-geometry');
    await expect(hovered).toBeVisible();
    await expect
        .poll(async () => JSON.parse((await hovered.textContent()) ?? '{}'))
        .toMatchObject({
            ...expected,
            distanceExposed: false,
        });
    await page.mouse.click(x, y);
    await expect
        .poll(async () =>
            JSON.parse((await component.getByTestId('clicked-geometry').textContent()) ?? '{}'),
        )
        .toMatchObject({...expected});
}

const geometryCases: GeometryCase[] = [
    {
        name: 'lookup chunks retain the series whose drawn line won across different X grids',
        series: [
            {
                type: 'area',
                name: 'Distant area',
                data: [
                    {x: 100, y: 50},
                    {x: 150, y: 50},
                    {x: 200, y: 50},
                ],
            },
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 150, y: 250, radius: 6}],
            },
            {
                type: 'line',
                name: 'Top line',
                marker: {enabled: false},
                data: [
                    {x: 0, y: 250, custom: {id: 'left'}},
                    {x: 300, y: 250, custom: {id: 'right'}},
                ],
            },
        ],
        position: [150, 50],
        expected: {series: 'Top line', point: {x: 300, y: 250, custom: {id: 'right'}}},
    },
    {
        name: 'a containing scatter marker beats a nearer but smaller center',
        series: [
            {
                type: 'line',
                name: 'Line',
                marker: {enabled: false},
                data: [
                    {x: 0, y: 150},
                    {x: 300, y: 150},
                ],
            },
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [
                    {x: 150, y: 152, radius: 1, custom: {id: 'small'}},
                    {x: 155, y: 150, radius: 10, custom: {id: 'large'}},
                ],
            },
        ],
        position: [150, 150],
        expected: {series: 'Scatter', point: {x: 155, y: 150, custom: {id: 'large'}}},
    },
    {
        name: 'butt caps do not paint beyond a thick line endpoint',
        series: [
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 205, y: 150, radius: 1}],
            },
            {
                type: 'line',
                name: 'Flat line',
                lineWidth: 20,
                linecap: 'butt',
                marker: {enabled: false},
                data: [
                    {x: 100, y: 150},
                    {x: 200, y: 150},
                ],
            },
        ],
        position: [205, 150],
        expected: {series: 'Scatter', point: {x: 205, y: 150}},
    },
    {
        name: 'a dash gap does not hide the scatter marker below the line',
        series: [
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 107, y: 150, radius: 0.5}],
            },
            {
                type: 'line',
                name: 'Dashed line',
                lineWidth: 2,
                dashStyle: 'ShortDash',
                linecap: 'butt',
                marker: {enabled: false},
                data: [
                    {x: 100, y: 150},
                    {x: 200, y: 150},
                ],
            },
        ],
        position: [107, 150],
        expected: {series: 'Scatter', point: {x: 107, y: 150}},
    },
    {
        name: 'an area side is not expanded by its upper line stroke',
        series: [
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 95, y: 50, radius: 1}],
            },
            {
                type: 'area',
                name: 'Area',
                lineWidth: 20,
                marker: {enabled: false},
                data: [
                    {x: 100, y: 150},
                    {x: 200, y: 150},
                ],
            },
        ],
        position: [95, 250],
        expected: {series: 'Scatter', point: {x: 95, y: 50}},
    },
    {
        name: 'an area-range side is not expanded by its boundary strokes',
        series: [
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 95, y: 100, radius: 1}],
            },
            {
                type: 'area-range',
                name: 'Range',
                lineWidth: 20,
                marker: {enabled: false},
                data: [
                    {x: 100, y0: 50, y1: 150},
                    {x: 200, y0: 50, y1: 150},
                ],
            },
        ],
        position: [95, 200],
        expected: {series: 'Scatter', point: {x: 95, y: 100}},
    },
    {
        name: 'a donut does not cover a scatter marker visible through its hole',
        series: [
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 150, y: 150, radius: 6}],
            },
            {
                type: 'pie',
                radius: 100,
                innerRadius: 70,
                dataLabels: {enabled: false},
                data: [{name: 'Slice', value: 1}],
            },
        ],
        position: [150, 150],
        expected: {series: 'Scatter', point: {x: 150, y: 150}},
    },
    {
        name: 'a square scatter marker does not use its circumscribed cluster bounds',
        series: [
            {
                type: 'line',
                name: 'Line',
                marker: {enabled: false},
                data: [
                    {x: 0, y: 150, custom: {id: 'left'}},
                    {x: 300, y: 150},
                ],
            },
            {
                type: 'scatter',
                name: 'Square',
                symbolType: 'square',
                data: [{x: 150, y: 150, radius: 10}],
            },
        ],
        position: [161, 150],
        expected: {series: 'Line', point: {x: 300, y: 150}},
    },
    {
        name: 'line markers include the renderer symbol expansion and border',
        series: [
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 164, y: 150, radius: 1}],
            },
            {
                type: 'line',
                name: 'Marker',
                marker: {enabled: true, radius: 10, borderWidth: 4},
                data: [{x: 150, y: 150, custom: {id: 'marker'}}],
            },
        ],
        position: [164, 150],
        expected: {series: 'Marker', point: {x: 150, y: 150, custom: {id: 'marker'}}},
    },
    ...(['bar-x', 'bar-y'] as const).map(
        (type): GeometryCase => ({
            name: `${type} rounded corners leave the scatter marker selectable`,
            series: [
                {
                    type: 'scatter',
                    name: 'Scatter',
                    symbolType: 'circle',
                    data: [
                        {
                            x: type === 'bar-x' ? 126 : 149,
                            y: type === 'bar-x' ? 149 : 174,
                            radius: 1,
                        },
                    ],
                },
                {type, name: 'Bar', borderRadius: 20, borderWidth: 0, data: [{x: 150, y: 150}]},
            ],
            position: type === 'bar-x' ? [126, 151] : [149, 126],
            expected: {
                series: 'Scatter',
                point: {x: type === 'bar-x' ? 126 : 149, y: type === 'bar-x' ? 149 : 174},
            },
        }),
    ),
];

test.describe('Mixed-series rendered geometry selection', () => {
    for (const {name, series, position, expected} of geometryCases) {
        test(name, async ({mount, page}) => {
            const component = await mount(<ClosestGeometryTestStory data={createData(series)} />);
            await expectSelection(page, component, position, expected);
        });
    }

    test('a tap selects the painted marker and preserves its public payload @desktop-touch', async ({
        mount,
        page,
    }) => {
        const {series, position, expected} = geometryCases[1];
        const component = await mount(<ClosestGeometryTestStory data={createData(series)} />);
        const svg = await getLocatorBoundingBox(component.locator('svg'));
        await page.touchscreen.tap(svg.x + 50 + position[0], svg.y + 50 + position[1]);
        await expect
            .poll(async () =>
                JSON.parse((await component.getByTestId('clicked-geometry').textContent()) ?? '{}'),
            )
            .toMatchObject({...expected});
    });

    test('shifted clusters compete using rendered size and retain original members in both callbacks', async ({
        mount,
        page,
    }) => {
        const data = createData([
            {
                type: 'line',
                name: 'Line',
                marker: {enabled: false},
                data: [
                    {x: 0, y: 150},
                    {x: 300, y: 150},
                ],
            },
            {
                type: 'scatter',
                name: 'Clusters',
                symbolType: 'circle',
                cluster: {
                    enabled: true,
                    layoutAlgorithm: {gridSize: '50%'},
                    overlapMode: 'shift',
                    marker: {radius: 12, borderWidth: 0},
                },
                data: [
                    {x: 147, y: 150, custom: {id: 'a'}},
                    {x: 148, y: 150, custom: {id: 'b'}},
                    {x: 151, y: 150, custom: {id: 'c'}},
                    {x: 152, y: 150, custom: {id: 'd'}},
                ],
            },
        ]);
        const component = await mount(<ClosestGeometryTestStory data={data} />);
        const labels = component.locator('.gcharts-scatter__cluster-label');
        await expect(labels).toHaveCount(2);
        const first = await getLocatorBoundingBox(
            component.locator('.gcharts-marker__symbol').first(),
        );
        expect(first.width).toBeCloseTo(24, 1);
        const svg = await getLocatorBoundingBox(component.locator('svg'));
        const position: [number, number] = [
            first.x + first.width / 2 - svg.x - 50,
            first.y + first.height / 2 - svg.y - 50,
        ];
        expect(Math.hypot(position[0] - 147.5, position[1] - 150)).toBeGreaterThan(1);
        const expected = {
            series: 'Clusters',
            point: {
                x: 147.5,
                y: 150,
                cluster: {
                    size: 2,
                    points: [
                        {x: 147, y: 150, custom: {id: 'a'}},
                        {x: 148, y: 150, custom: {id: 'b'}},
                    ],
                },
            },
            originalMembers: [true, true],
        };
        await expectSelection(page, component, [position[0] + 10, position[1]], expected);
        const hovered = JSON.parse(
            (await page.getByTestId('hovered-geometry').textContent()) ?? '{}',
        );
        expect(hovered.displayPosition[0]).toBeCloseTo(position[0], 0);
        expect(hovered.displayPosition[1]).toBeCloseTo(position[1], 0);
    });

    test('percent stacked bars measure the value-end padding that is actually painted in split plots', async ({
        mount,
        page,
    }) => {
        const data = createData([
            {
                type: 'scatter',
                name: 'Scatter',
                symbolType: 'circle',
                data: [{x: 150, y: 0, radius: 20}],
            },
            {
                type: 'bar-x',
                name: 'Bar',
                yAxis: 1,
                stacking: 'percent',
                borderRadius: 0,
                borderWidth: 0,
                data: [{x: 150, y: 100, custom: {id: 'padded'}}],
            },
        ]);
        data.chart = {margin: {left: 50, right: 50, top: 50.25, bottom: 49.75}};
        data.split = {enable: true, gap: 10, plots: [{}, {}]};
        data.yAxis = [
            {
                type: 'linear',
                min: 0,
                max: 300,
                startOnTick: false,
                endOnTick: false,
                visible: false,
                plotIndex: 0,
            },
            {
                type: 'linear',
                min: 0,
                max: 100,
                startOnTick: false,
                endOnTick: false,
                visible: true,
                plotIndex: 1,
                labels: {enabled: false},
            },
        ];
        const component = await mount(<ClosestGeometryTestStory data={data} />);
        await expectSelection(
            page,
            component,
            [150, 154.75],
            {
                series: 'Bar',
                point: {x: 150, y: 100, custom: {id: 'padded'}},
            },
            [50, 50.25],
        );
    });
});
