import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import {median} from 'd3-array';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {DAY} from '~core/constants';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYBasicData} from '../__stories__/__data__';
import type {ChartData, ChartMargin} from '../types';

import {generateHourlyDatetimeSeries} from './__data__/utils';
import {getOverlappingLabelPairs} from './utils';

const CHART_MARGIN: ChartMargin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
};
const HTML_CATEGORIES = [
    '<div style="height: 18px; background-color: #4fc4b7; border-radius: 4px; color: #fff; padding: 4px; display: flex; align-items: center;">1</div>',
    '<div style="height: 32px; background-color: #4fc4b7; border-radius: 4px; color: #fff; padding: 4px; display: flex; align-items: center;">1000</div>',
];

test.describe('X-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.max', 120);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'xAxis.max', 120);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('formatted labels', async ({mount}) => {
        const chartData: ChartData = {
            ...barYBasicData,
            xAxis: {
                labels: {
                    numberFormat: {
                        unit: 'k',
                    },
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('explicit values define the X and Y ticks', async ({mount}) => {
        const chartData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 0},
                            {x: 4, y: 40},
                            {x: 10, y: 100},
                        ],
                    },
                ],
            },
            xAxis: {
                min: 0,
                max: 10,
                ticks: {values: [-5, 0, 4, 10, 15]},
            },
            yAxis: [
                {
                    min: 0,
                    max: 100,
                    ticks: {values: [-10, 0, 40, 100, 120]},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);

        await expect(component.locator('.gcharts-x-axis__tick text')).toHaveText(['0', '4', '10']);
        await expect(component.locator('.gcharts-y-axis__tick text')).toHaveText([
            '0',
            '40',
            '100',
        ]);
    });

    test('nearby explicit ticks keep distant X labels visible', async ({mount}) => {
        const chartData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 0},
                            {x: 100, y: 100},
                        ],
                    },
                ],
            },
            xAxis: {
                min: 0,
                max: 100,
                ticks: {values: [0, 50, 51, 100]},
                labels: {autoRotation: false},
            },
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{width: 600, height: 350}} />,
        );
        const ticks = component.locator('.gcharts-x-axis__tick');
        const firstLabel = ticks.nth(0).locator('text tspan');
        const lastLabel = ticks.nth(3).locator('text tspan');

        await expect(ticks).toHaveCount(4);
        await expect(firstLabel).toHaveText('0');
        await expect(lastLabel).toHaveText('100');
        expect((await firstLabel.boundingBox())?.width).toBeGreaterThan(0);
        expect((await lastLabel.boundingBox())?.width).toBeGreaterThan(0);
    });

    test('rotated explicit datetime labels keep separate text visible', async ({mount}) => {
        const start = Date.UTC(2024, 0, 1);
        const dates = Array.from({length: 14}, (_, index) => start + index * 60 * DAY);
        const expectedLabels = dates.map((value) => {
            const date = new Date(value);
            const month = date.toLocaleString('en-US', {month: 'long', timeZone: 'UTC'});

            return `${date.getUTCDate()} ${month}`;
        });
        const chartData: ChartData = {
            chart: {margin: CHART_MARGIN},
            legend: {enabled: false},
            tooltip: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: dates.map((x, index) => ({x, y: index + 1})),
                    },
                ],
            },
            xAxis: {
                type: 'datetime',
                min: dates[0],
                max: dates[dates.length - 1],
                startOnTick: false,
                endOnTick: false,
                ticks: {values: dates},
                labels: {
                    dateFormat: 'D MMMM',
                    autoRotation: false,
                    rotation: -45,
                    style: {fontSize: '11px'},
                },
            },
            yAxis: [
                {
                    title: {text: 'Value', margin: 10, style: {fontSize: '12px'}},
                    labels: {margin: 15, style: {fontSize: '11px'}},
                },
            ],
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{width: 575, height: 320}} />,
        );
        const ticks = component.locator('.gcharts-x-axis__tick');
        const labels = ticks.locator('text tspan');

        await expect(ticks).toHaveCount(dates.length);
        await expect(labels).toHaveText(expectedLabels);
        expect(await getOverlappingLabelPairs(labels)).not.toEqual([]);
        const separation = await labels.evaluateAll((elements) => {
            const intervals = elements
                .map((element) => {
                    const label = element as SVGGraphicsElement;
                    const box = label.getBBox();
                    const matrix = label.getScreenCTM();
                    if (!matrix) throw new Error('Label transform is unavailable');
                    const projections = [
                        [box.x, box.y],
                        [box.x + box.width, box.y],
                        [box.x + box.width, box.y + box.height],
                        [box.x, box.y + box.height],
                    ].map(([x, y]) => {
                        const point = new DOMPoint(x, y).matrixTransform(matrix);

                        return (point.x + point.y) / Math.SQRT2;
                    });

                    return {min: Math.min(...projections), max: Math.max(...projections)};
                })
                .sort((first, second) => first.min - second.min);

            return intervals.slice(1).map((interval, index) => interval.min - intervals[index].max);
        });
        expect(Math.min(...separation)).toBeGreaterThanOrEqual(0);

        await component.update(
            <ChartTestStory
                data={{
                    ...chartData,
                    xAxis: {
                        ...chartData.xAxis,
                        ticks: {
                            values: [...dates.slice(0, 7), dates[6] + DAY, ...dates.slice(7)],
                        },
                    },
                }}
                styles={{width: 575, height: 320}}
            />,
        );

        await expect(ticks).toHaveCount(dates.length + 1);
        await expect(labels).toHaveText(expectedLabels);
    });

    test('nearby explicit ticks do not overlap with automatic X rotation', async ({mount}) => {
        const chartData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 0},
                            {x: 100, y: 100},
                        ],
                    },
                ],
            },
            xAxis: {
                min: 0,
                max: 100,
                ticks: {values: [0, 50, 51, 100]},
                tickMarks: {enabled: true},
            },
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{width: 600, height: 350}} />,
        );
        const ticks = component.locator('.gcharts-x-axis__tick');

        await expect(ticks).toHaveCount(4);
        await expect(ticks.first().locator('text tspan')).toHaveText('0');
        await expect(ticks.last().locator('text tspan')).toHaveText('100');
        await expect(ticks.locator('text tspan')).toHaveCount(3);
        await expect(ticks.locator('.gcharts-x-axis__mark')).toHaveCount(4);
        await expect(ticks.nth(1).locator('path')).toHaveCount(2);
        await expect(ticks.nth(2).locator('path')).toHaveCount(2);
        expect(await ticks.locator('text tspan').allTextContents()).not.toContain('');
        expect(await getOverlappingLabelPairs(ticks.locator('text tspan'))).toEqual([]);
    });

    test('explicit values select category indices', async ({mount}) => {
        const chartData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 20},
                            {x: 2, y: 30},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['January', 'February', 'March'],
                ticks: {values: [0, 2]},
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);

        await expect(component.locator('.gcharts-x-axis__tick text')).toHaveText([
            'January',
            'March',
        ]);
    });

    test('nearby explicit category ticks do not overlap HTML X labels', async ({mount}) => {
        const chartData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: Array.from({length: 101}, (_, index) => ({
                            x: index,
                            y: index,
                        })),
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: Array.from({length: 101}, (_, index) => String(index)),
                min: 0,
                max: 100,
                ticks: {values: [0, 50, 51, 100]},
                labels: {html: true},
            },
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{width: 600, height: 350}} />,
        );
        const ticks = component.locator('.gcharts-x-axis__tick');
        const labels = component.locator('.gcharts-chart__html-layer-item');

        await expect(ticks).toHaveCount(4);
        await expect(labels).toHaveCount(3);
        await expect(labels.first()).toHaveText('0');
        await expect(labels.last()).toHaveText('100');
        expect(await getOverlappingLabelPairs(labels)).toEqual([]);
    });

    test.describe('Html in categories', () => {
        const baseData: ChartData = {
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 2.5},
                            {x: 1, y: 5},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: HTML_CATEGORIES,
                labels: {
                    html: true,
                },
            },
        };

        test('default settings', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('chart.margin=20', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'chart.margin', CHART_MARGIN);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('labels.margin=0', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'xAxis.labels.margin', 0);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('max-indexed-category', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        data: [{x: 0, y: 10}],
                        name: 'Series 1',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 1, y: 20}],
                        name: 'Series 2',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 3, y: 30}],
                        name: 'Series 3',
                    },
                ],
            },
            xAxis: {
                categories: ['Category 1', 'Category 2', 'Category 3'],
                max: 1,
                type: 'category',
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Axis tick labels', () => {
        test('Custom font size', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    type: 'category',
                    categories: ['January', 'February', 'March'],
                    labels: {
                        style: {
                            fontSize: '18px',
                        },
                    },
                },
                yAxis: [{visible: false}],
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Sales',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 15},
                                {x: 2, y: 12},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Rotated labels (-45 deg)', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    type: 'category',
                    categories: ['Long text (with ellipsis)', 'Short text'],
                    labels: {
                        rotation: -45,
                    },
                },

                yAxis: [{visible: false}],
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 5},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Rotated labels (45 deg)', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    type: 'category',
                    categories: ['Long text (with ellipsis)', 'Short text'],
                    labels: {
                        rotation: 45,
                    },
                },

                yAxis: [{visible: false}],
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 5},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Dense categorical labels with long second category (-45 deg): even spacing, no left shift', async ({
            mount,
        }) => {
            const categories = [
                'Ox',
                "Humuhumunukunukuapua'a",
                'Dog',
                'Fox',
                'Elephant',
                'Bear',
                'Wolf',
                'Lion',
                'Tiger',
                'Snake',
                'Hawk',
                'Deer',
                'Moose',
                'Rabbit',
            ];
            const data: ChartData = {
                yAxis: [{visible: false}],
                xAxis: {
                    type: 'category',
                    categories,
                    labels: {
                        rotation: -45,
                        padding: 0,
                    },
                },
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: categories.map((_, i) => ({x: i, y: (i + 1) * 10})),
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Axis title', () => {
        test('With labels.enabled = false', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    title: {text: 'X-axis title'},
                    labels: {
                        enabled: false,
                    },
                },
                series: {
                    data: [
                        {
                            type: 'bar-y',
                            name: 'Series 1',
                            data: [{x: 1, y: 1}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Multiline title (3 rows)', async ({mount}) => {
            const text = `On seashore far a green oak towers, And to it with a gold chain bound, A learned cat whiles away the hours By walking slowly round and round. To right he walks, and sings a ditty; To left he walks, and tells a tale… A strange place! There a mermaid sits in A tree; there prowls a sprite; on trails Unknown to man move beasts unseen by His eyes; there stands on chicken feet, Without a door or e’en a window, A tiny hut, a hag’s retreat. Both wood and valley there are teeming With wondrous things…`;
            const data: ChartData = {
                xAxis: {
                    title: {text, maxRowCount: 3},
                },
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [{x: 1, y: 10}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('The font weight and color can be changed in the svg axis title @webkit', async ({
            mount,
        }) => {
            const data: ChartData = {
                xAxis: {
                    title: {text: 'Bold text', style: {fontWeight: 'bold', fontColor: 'red'}},
                },

                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [{x: 1, y: 10}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('.gcharts-x-axis__title')).toHaveScreenshot();
        });
    });

    test('Invisible axis (with labels, grid and title enabled)', async ({mount}) => {
        const data: ChartData = {
            xAxis: {
                visible: false,
                grid: {enabled: true},
                labels: {
                    enabled: true,
                },
                title: {text: 'X-axis'},
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [{x: 1, y: 1}],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('For the datetime axis, week ticks should start on monday', async ({mount}) => {
        const data: ChartData = {
            xAxis: {
                type: 'datetime',
            },
            yAxis: [{visible: false}],
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: new Date('2022-06-20T00:00:00Z').getTime(), y: 10},
                            {x: new Date('2022-07-04T00:00:00Z').getTime(), y: 5},
                            {x: new Date('2022-07-11T00:00:00Z').getTime(), y: 5},
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    // TODO: remove skip after https://github.com/gravity-ui/charts/issues/395
    test.describe.skip('startOnTick / endOnTick', () => {
        test.describe('linear', () => {
            const baseData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 17, y: 10},
                                {x: 50, y: 20},
                                {x: 83, y: 15},
                            ],
                        },
                    ],
                },
                xAxis: {
                    type: 'linear',
                },
                chart: {
                    margin: CHART_MARGIN,
                },
            };

            test('default (startOnTick=true, endOnTick=true)', async ({mount}) => {
                const component = await mount(<ChartTestStory data={baseData} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('startOnTick=false, endOnTick=false', async ({mount}) => {
                const data = cloneDeep(baseData);
                set(data, 'xAxis.startOnTick', false);
                set(data, 'xAxis.endOnTick', false);
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });

        test.describe('datetime', () => {
            const baseData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 1704067200000, y: 10}, // 2024-01-01
                                {x: 1706745600000, y: 20}, // 2024-02-01
                                {x: 1709251200000, y: 15}, // 2024-03-01
                            ],
                        },
                    ],
                },
                xAxis: {
                    type: 'datetime',
                },
                chart: {
                    margin: CHART_MARGIN,
                },
            };

            test('default (startOnTick=true, endOnTick=true)', async ({mount}) => {
                const component = await mount(<ChartTestStory data={baseData} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('startOnTick=false, endOnTick=false', async ({mount}) => {
                const data = cloneDeep(baseData);
                set(data, 'xAxis.startOnTick', false);
                set(data, 'xAxis.endOnTick', false);
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });

    test.describe('Performance @perf', () => {
        test('Long category labels', async ({mount}) => {
            test.setTimeout(120_000);

            const CATEGORY_LENGTH = 35_000;
            const CATEGORY_COUNT = 100;

            const createLongCategory = (prefix: string, index: number) =>
                (prefix + index).padEnd(CATEGORY_LENGTH, 'x');

            const categories = Array.from({length: CATEGORY_COUNT}, (_, i) =>
                createLongCategory('Category ', i + 1),
            );
            const dataItems = categories.map((_, i) => ({
                x: i,
                y: Math.floor(Math.random() * 300),
            }));
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series',
                            data: dataItems,
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories,
                },
                yAxis: [{title: {text: ''}}],
            };

            const widgetRenderTimes: number[] = [];

            for (let i = 0; i < 10; i++) {
                let widgetRenderTime: number | undefined;
                const handleRender = (renderTime?: number) => {
                    widgetRenderTime = renderTime;
                };

                const component = await mount(
                    <ChartTestStory
                        data={data}
                        styles={{height: 1000, width: 1000}}
                        onRender={handleRender}
                    />,
                );
                await component.locator('svg').waitFor({state: 'visible'});
                await expect.poll(() => widgetRenderTime).toBeTruthy();

                if (widgetRenderTime !== undefined) {
                    widgetRenderTimes.push(widgetRenderTime);
                }

                await component.unmount();
            }

            expect(median(widgetRenderTimes)).toBeLessThan(3000);
        });
    });

    test.describe('Datetime sub-day labels', () => {
        // 2024-01-15 00:00:00 UTC — starts at midnight so midnight ticks render as DD.MM.YY
        const MIDNIGHT_JAN15 = 1705276800000;

        const baseData: ChartData = {
            series: {
                data: [generateHourlyDatetimeSeries({startMs: MIDNIGHT_JAN15, hours: 49})],
            },
            xAxis: {type: 'datetime'},
            chart: {margin: CHART_MARGIN},
        };

        test('hourly ticks spanning 2 days — midnight as date, others as time', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('custom dateFormat bypasses smart formatting', async ({mount}) => {
            const data = cloneDeep(baseData);
            set(data, 'xAxis.labels.dateFormat', 'DD.MM.YY HH:mm');
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Tick marks', () => {
        const baseTickMarksData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 20},
                            {x: 2, y: 15},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'linear',
                tickMarks: {enabled: true},
            },
            chart: {margin: CHART_MARGIN},
        };

        test('enabled (default settings)', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseTickMarksData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('custom length', async ({mount}) => {
            const data = cloneDeep(baseTickMarksData);
            set(data, 'xAxis.tickMarks.length', 12);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('with grid disabled (domain color)', async ({mount}) => {
            const data = cloneDeep(baseTickMarksData);
            set(data, 'xAxis.grid.enabled', false);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('hidden when axis visible=false', async ({mount}) => {
            const data = cloneDeep(baseTickMarksData);
            set(data, 'xAxis.visible', false);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Crosshair', () => {
        const baseData: ChartData = {
            legend: {enabled: false},
            tooltip: {enabled: false},
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [{x: 0, y: 10}],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['A'],
                crosshair: {enabled: true},
            },
            yAxis: [{visible: false}],
            defaultState: {
                hoveredPosition: {x: '50%', y: '50%'},
            },
        };

        test('category axis with numeric index in data', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Edge tick labels with chart margin', () => {
        const baseDate = new Date('2024-01-01T00:00:00Z').getTime();
        const edgeTickData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: Array.from({length: 6}, (_, i) => ({
                            x: baseDate + i * 30 * 24 * 60 * 60 * 1000,
                            y: 10 + i * 5,
                        })),
                    },
                ],
            },
            xAxis: {type: 'datetime'},
            yAxis: [{visible: false}],
            chart: {margin: {top: 20, bottom: 20, left: 60, right: 60}},
        };

        test('horizontal labels do not overflow into left/right margins', async ({mount}) => {
            const component = await mount(<ChartTestStory data={edgeTickData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('rotated labels (-45 deg) do not overflow into left margin', async ({mount}) => {
            const data: ChartData = {
                ...edgeTickData,
                xAxis: {type: 'datetime', labels: {rotation: -45}},
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Axis type change', () => {
        // When the range slider initialises with a defaultRange, switching to a category axis must
        // not use those stale timestamps to filter the new categorical series.
        test('datetime → category: series render correctly after range slider default range was set', async ({
            mount,
        }) => {
            const startDate = new Date('2024-01-01T00:00:00Z').getTime();
            const datetimeData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: Array.from({length: 10}, (_, i) => ({
                                x: startDate + i * DAY,
                                y: i + 1,
                            })),
                        },
                    ],
                },
                xAxis: {
                    type: 'datetime',
                    rangeSlider: {enabled: true, defaultRange: {size: 'P3D'}},
                },
            };

            const component = await mount(<ChartTestStory data={datetimeData} />);
            await expect(component.locator('.gcharts-bar-x__segment').first()).toBeVisible();

            await component.update(
                <ChartTestStory
                    data={{
                        series: {
                            data: [
                                {
                                    type: 'bar-x',
                                    name: 'Series 1',
                                    data: [
                                        {x: 0, y: 10},
                                        {x: 1, y: 20},
                                        {x: 2, y: 30},
                                    ],
                                },
                            ],
                        },
                        xAxis: {
                            type: 'category',
                            categories: ['Alpha', 'Beta', 'Gamma'],
                        },
                    }}
                />,
            );

            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Datetime dateTimeLabelFormats', () => {
        const QUARTERLY_TIMESTAMPS = [
            new Date('2024-01-01T00:00:00.000Z').getTime(),
            new Date('2024-04-01T00:00:00.000Z').getTime(),
            new Date('2024-07-01T00:00:00.000Z').getTime(),
            new Date('2024-10-01T00:00:00.000Z').getTime(),
            new Date('2025-01-01T00:00:00.000Z').getTime(),
        ];

        const YEARLY_TIMESTAMPS = [
            new Date('2010-01-01T00:00:00.000Z').getTime(),
            new Date('2011-01-01T00:00:00.000Z').getTime(),
            new Date('2012-01-01T00:00:00.000Z').getTime(),
            new Date('2013-01-01T00:00:00.000Z').getTime(),
            new Date('2014-01-01T00:00:00.000Z').getTime(),
            new Date('2015-01-01T00:00:00.000Z').getTime(),
            new Date('2016-01-01T00:00:00.000Z').getTime(),
        ];

        const HALF_YEAR_TIMESTAMPS = [
            new Date('2022-01-01T00:00:00.000Z').getTime(),
            new Date('2022-07-01T00:00:00.000Z').getTime(),
            new Date('2023-01-01T00:00:00.000Z').getTime(),
            new Date('2023-07-01T00:00:00.000Z').getTime(),
            new Date('2024-01-01T00:00:00.000Z').getTime(),
        ];

        const makeLineSeries = (timestamps: number[]) => ({
            type: 'line' as const,
            name: 'Series 1',
            data: timestamps.map((x, i) => ({x, y: i + 1})),
        });

        test('quarterly data — default format unchanged', async ({mount}) => {
            const chartData: ChartData = {
                series: {data: [makeLineSeries(QUARTERLY_TIMESTAMPS)]},
                xAxis: {type: 'datetime'},
                chart: {margin: CHART_MARGIN},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('quarterly data with Q token format', async ({mount}) => {
            const chartData: ChartData = {
                series: {data: [makeLineSeries(QUARTERLY_TIMESTAMPS)]},
                xAxis: {
                    type: 'datetime',
                    labels: {dateTimeLabelFormats: {quarter: 'YYYY [Q]Q'}},
                },
                chart: {margin: CHART_MARGIN},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('half-yearly data with H token format', async ({mount}) => {
            const chartData: ChartData = {
                series: {data: [makeLineSeries(HALF_YEAR_TIMESTAMPS)]},
                xAxis: {
                    type: 'datetime',
                    labels: {dateTimeLabelFormats: {halfYear: 'YYYY [H]B'}},
                },
                chart: {margin: CHART_MARGIN},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('yearly data — default format shows year only', async ({mount}) => {
            const chartData: ChartData = {
                series: {data: [makeLineSeries(YEARLY_TIMESTAMPS)]},
                xAxis: {type: 'datetime'},
                chart: {margin: CHART_MARGIN},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('yearly data with custom year format', async ({mount}) => {
            const chartData: ChartData = {
                series: {data: [makeLineSeries(YEARLY_TIMESTAMPS)]},
                xAxis: {
                    type: 'datetime',
                    labels: {dateTimeLabelFormats: {year: "'YY"}},
                },
                chart: {margin: CHART_MARGIN},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('custom month format overrides default', async ({mount}) => {
            const monthlyTimestamps = [
                new Date('2024-01-01T00:00:00.000Z').getTime(),
                new Date('2024-02-01T00:00:00.000Z').getTime(),
                new Date('2024-03-01T00:00:00.000Z').getTime(),
                new Date('2024-04-01T00:00:00.000Z').getTime(),
            ];
            const chartData: ChartData = {
                series: {data: [makeLineSeries(monthlyTimestamps)]},
                xAxis: {
                    type: 'datetime',
                    labels: {dateTimeLabelFormats: {month: 'MM.YYYY'}},
                },
                chart: {margin: CHART_MARGIN},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
