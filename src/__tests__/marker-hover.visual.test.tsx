import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

import {getLocatorBoundingBox} from './utils';

interface MarkerHoverOptions {
    radius?: number;
    borderWidth?: number;
    hoverEnabled?: boolean;
    markerEnabled?: boolean;
}

function createData(
    type: 'line' | 'area' | 'area-range',
    {
        radius = 8,
        borderWidth = 2,
        hoverEnabled = true,
        markerEnabled = true,
    }: MarkerHoverOptions = {},
): ChartData {
    return {
        legend: {enabled: false},
        tooltip: {enabled: false},
        xAxis: {type: 'linear', min: -0.2, max: 2.2},
        yAxis: [{min: 0, max: 10}],
        series: {
            options: {
                [type]: {
                    marker: {enabled: true, radius: 5, borderWidth: 0},
                    states: {
                        hover: {
                            enabled: hoverEnabled,
                            brightness: 0,
                            marker: {
                                enabled: markerEnabled,
                                radius,
                                borderWidth,
                                borderColor: '#ffffff',
                                halo: {enabled: false},
                            },
                        },
                    },
                },
            },
            data: [
                {name: 'A', color: '#FF3D64', y: 7},
                {name: 'B', color: '#8AD554', y: 3},
            ].map(({name, color, y}) =>
                type === 'area-range'
                    ? {
                          type,
                          name,
                          color,
                          data: [0, 1, 2].map((x) => ({x, y0: y - 1, y1: y})),
                      }
                    : {type, name, color, data: [0, 1, 2].map((x) => ({x, y}))},
            ),
        },
    };
}

test.describe('Marker hover styles', () => {
    for (const type of ['line', 'area', 'area-range'] as const) {
        test(`${type}: permanent markers use hover styles and restore on movement and exit`, async ({
            mount,
            page,
        }) => {
            const component = await mount(<ChartTestStory data={createData(type)} />);
            const symbols = component.locator('.gcharts-marker__wrapper:visible > path');
            const normalCount = type === 'area-range' ? 12 : 6;
            const hoverCount = type === 'area-range' ? 4 : 2;
            await expect(symbols).toHaveCount(normalCount);

            const red = component.locator('.gcharts-marker__symbol[fill="#FF3D64"]');
            const middle = red.nth(1);
            const normalPath = (await middle.getAttribute('d')) ?? '';
            const middleBox = await getLocatorBoundingBox(middle);
            const firstBox = await getLocatorBoundingBox(red.first());
            const svgBox = await getLocatorBoundingBox(component.locator('svg'));
            const active = component.locator(
                '.gcharts-marker__wrapper:visible > path[stroke="#ffffff"][stroke-width="2"]',
            );

            await page.mouse.move(
                middleBox.x + middleBox.width / 2,
                middleBox.y + middleBox.height / 2,
            );
            await expect(active).toHaveCount(hoverCount);
            await expect(symbols).toHaveCount(normalCount);
            expect((await getLocatorBoundingBox(active.first())).width).toBeGreaterThan(
                middleBox.width,
            );
            await expect(component.locator('svg')).toHaveScreenshot();

            await page.mouse.move(
                firstBox.x + firstBox.width / 2,
                firstBox.y + firstBox.height / 2,
            );
            await expect(middle).toBeVisible();
            await expect(middle).toHaveAttribute('d', normalPath);
            await expect(active).toHaveCount(hoverCount);
            expect((await getLocatorBoundingBox(active.first())).x).toBeLessThan(middleBox.x);

            await page.mouse.move(svgBox.x + svgBox.width + 10, svgBox.y + svgBox.height + 10);
            await expect(active).toHaveCount(0);
            await expect(symbols).toHaveCount(normalCount);

            // A smaller hover marker must replace the normal symbol, including a zero radius.
            for (const radius of [2, 0]) {
                await component.update(
                    <ChartTestStory data={createData(type, {radius, borderWidth: 0})} />,
                );
                const target = component.locator('.gcharts-marker__symbol[fill="#FF3D64"]').nth(1);
                await expect(target).toHaveAttribute('d', normalPath);
                await page.mouse.move(
                    middleBox.x + middleBox.width / 2,
                    middleBox.y + middleBox.height / 2,
                );
                const hovered = component.locator(
                    '.gcharts-marker__symbol[stroke="#ffffff"][stroke-width="0"]',
                );
                await expect(hovered).toHaveCount(hoverCount);
                await expect(target).toBeHidden();
                const box = await hovered
                    .first()
                    .evaluate((element) => (element as SVGGraphicsElement).getBBox().width);
                expect(box).toBeCloseTo(radius * 2, 1);
                await page.mouse.move(svgBox.x + svgBox.width + 10, svgBox.y + svgBox.height + 10);
                await expect(target).toBeVisible();
            }

            await page.mouse.move(
                middleBox.x + middleBox.width / 2,
                middleBox.y + middleBox.height / 2,
            );
            const hidden = component.locator('.gcharts-marker__wrapper[visibility="hidden"]');
            await expect(hidden).toHaveCount(hoverCount);
            await component.update(<ChartTestStory data={createData(type)} />);
            await expect(hidden).toHaveCount(0);
            await expect(
                component.locator('.gcharts-marker__symbol[stroke="#ffffff"]'),
            ).toHaveCount(0);
            await expect(symbols).toHaveCount(normalCount);
        });

        for (const disabled of ['hover', 'marker'] as const) {
            test(`${type}: disabled ${disabled} preserves permanent markers`, async ({
                mount,
                page,
            }) => {
                const component = await mount(
                    <ChartTestStory
                        data={{
                            ...createData(type, {
                                hoverEnabled: disabled !== 'hover',
                                markerEnabled: disabled !== 'marker',
                            }),
                            tooltip: {enabled: true},
                        }}
                    />,
                );
                const symbols = component.locator('.gcharts-marker__symbol');
                await expect(symbols).toHaveCount(type === 'area-range' ? 12 : 6);
                const initial = await symbols.evaluateAll((elements) =>
                    elements.map((element) => element.getAttribute('d')),
                );
                const box = await getLocatorBoundingBox(symbols.nth(1));
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await expect(page.locator('.gcharts-tooltip')).toBeVisible();
                await expect(
                    component.locator('.gcharts-marker__wrapper[visibility="hidden"]'),
                ).toHaveCount(0);
                expect(
                    await symbols.evaluateAll((elements) =>
                        elements.map((element) => element.getAttribute('d')),
                    ),
                ).toEqual(initial);
            });
        }
    }

    for (const type of ['line', 'area'] as const) {
        test(`${type}: hover keeps out-of-bounds markers clipped`, async ({mount, page}) => {
            const data = createData(type);
            data.yAxis = [{min: 0, max: 5}];
            data.series.data = [
                {
                    type,
                    name: 'Clipped',
                    color: '#FF3D64',
                    data: [
                        {x: 0, y: 4},
                        {x: 1, y: 6},
                        {x: 2, y: 4},
                    ],
                },
                {
                    type,
                    name: 'Visible',
                    color: '#8AD554',
                    data: [
                        {x: 0, y: 3},
                        {x: 1, y: 3},
                        {x: 2, y: 3},
                    ],
                },
            ];
            const component = await mount(<ChartTestStory data={data} />);
            const target = component.locator('.gcharts-marker__symbol[fill="#8AD554"]').nth(1);
            const box = await getLocatorBoundingBox(target);
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await expect(
                component.locator('.gcharts-marker__symbol[stroke="#ffffff"]'),
            ).toHaveCount(1);
            await expect(
                component.locator('.gcharts-marker__symbol[fill="#FF3D64"][stroke="#ffffff"]'),
            ).toHaveCount(0);
        });
    }

    test('point-enabled square marker keeps its color and replaces its normal symbol', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            ...createData('line'),
            series: {
                options: {
                    line: {
                        marker: {enabled: false, symbol: 'square', radius: 6},
                        states: {
                            hover: {marker: {radius: 2, borderWidth: 0, halo: {enabled: false}}},
                        },
                    },
                },
                data: [
                    {
                        type: 'line',
                        name: 'Line',
                        data: [
                            {x: 0, y: 5},
                            {
                                x: 1,
                                y: 5,
                                marker: {color: '#123456', states: {normal: {enabled: true}}},
                            },
                            {x: 2, y: 5},
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const symbols = component.locator('.gcharts-marker__symbol');
        await expect(symbols).toHaveCount(1);
        const normal = symbols.first();
        const box = await getLocatorBoundingBox(normal);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(normal).toBeHidden();
        const hovered = component.locator('.gcharts-marker__wrapper:visible > path');
        await expect(hovered).toHaveCount(1);
        await expect(hovered).toHaveAttribute('fill', '#123456');
        await expect(hovered).toHaveAttribute('d', /[HhVv]/);
        expect((await getLocatorBoundingBox(hovered)).width).toBeLessThan(box.width);
        const svgBox = await getLocatorBoundingBox(component.locator('svg'));
        await page.mouse.move(svgBox.x + svgBox.width + 10, svgBox.y + svgBox.height + 10);
        await expect(normal).toBeVisible();
        await expect(symbols).toHaveCount(1);
    });

    for (const type of ['scatter', 'radar'] as const) {
        test(`${type}: permanent marker radius and border respond to hover`, async ({
            mount,
            page,
        }) => {
            const data: ChartData = {
                legend: {enabled: false},
                series: {
                    options: {
                        [type]: {
                            states: {
                                hover: {
                                    marker: {
                                        radius: 8,
                                        borderWidth: 2,
                                        borderColor: '#ffffff',
                                        halo: {enabled: false},
                                    },
                                },
                            },
                        },
                    },
                    data:
                        type === 'radar'
                            ? [
                                  {
                                      type,
                                      name: 'Radar',
                                      marker: {enabled: true, radius: 3, borderWidth: 0},
                                      dataLabels: {enabled: false},
                                      categories: ['A', 'B', 'C'].map((key) => ({
                                          key,
                                          maxValue: 10,
                                      })),
                                      data: [{value: 5}, {value: 6}, {value: 7}],
                                  },
                              ]
                            : [
                                  {
                                      type,
                                      name: 'Scatter',
                                      data: [
                                          {x: 0, y: 1},
                                          {x: 1, y: 2, color: '#FF3D64'},
                                          {x: 2, y: 1},
                                      ],
                                  },
                              ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            const symbol =
                type === 'scatter'
                    ? component.locator('.gcharts-marker__symbol[fill="#FF3D64"]')
                    : component.locator('.gcharts-marker__symbol').nth(1);
            const box = await getLocatorBoundingBox(symbol);
            const initial = (await symbol.getAttribute('d')) ?? '';
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await expect(symbol).toHaveAttribute('stroke', '#ffffff');
            await expect(symbol).toHaveAttribute('stroke-width', '2');
            expect((await getLocatorBoundingBox(symbol)).width).toBeGreaterThan(box.width);
            const svgBox = await getLocatorBoundingBox(component.locator('svg'));
            await page.mouse.move(svgBox.x + svgBox.width + 10, svgBox.y + svgBox.height + 10);
            await expect(symbol).toHaveAttribute('d', initial);
        });
    }
});
