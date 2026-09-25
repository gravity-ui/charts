import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    barXBasicData,
    barXGroupedColumnsData,
    barXLinearData,
    barXNullModeSkipCategoryXData,
    barXNullModeSkipLinearXData,
    barXNullModeZeroCategoryXData,
    barXNullModeZeroLinearXData,
    barXSplitData,
    barXStackingPercentSplitData,
    barXStakingNormalData,
    barXWithYAxisPlotLinesData,
} from '../__stories__/__data__';
import {barXBordersData} from '../__stories__/__data__/bar-x/borders';
import type {BarXSeries, ChartData} from '../types';

import {generateSeriesData} from './__data__/utils';
import {getLocatorBoundingBox} from './utils';

test.describe('Bar-x series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear X-axis', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXLinearData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Logarithmic Y-axis', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'orders',
                        type: 'bar-x',
                        data: [
                            {
                                y: 2537,
                                x: 0,
                            },
                            {
                                y: 1491,
                                x: 1,
                            },
                            {
                                y: 894,
                                x: 2,
                            },
                        ],
                    },
                ],
            },
            xAxis: {
                lineColor: 'var(--g-color-line-generic)',
                type: 'category',
                categories: ['Consumer', 'Corporate', 'Home Office'],
            },
            yAxis: [
                {
                    type: 'logarithmic',
                    lineColor: 'transparent',
                    startOnTick: true,
                    endOnTick: true,
                    maxPadding: 0,
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Same data with different x-axis type', async ({mount}) => {
        const points = [
            {x: 0, y: 1},
            {x: 1, y: 3},
            {x: 2, y: 2},
        ];
        // linear x-axis
        const component = await mount(
            <ChartTestStory
                data={{
                    title: {text: 'linear x-axis'},
                    series: {
                        data: [{type: 'bar-x', name: '', data: points}],
                    },
                    xAxis: {type: 'linear'},
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();

        // datetime x-axis
        const startDate = new Date('2000-10-10T00:00:00Z').getTime();
        const day = 1000 * 60 * 60 * 24;
        await component.update(
            <ChartTestStory
                data={{
                    title: {text: 'datetime x-axis'},
                    series: {
                        data: [
                            {
                                type: 'bar-x',
                                name: '',
                                data: points.map((d) => ({x: d.x * day + startDate, y: d.y})),
                            },
                        ],
                    },
                    xAxis: {type: 'datetime'},
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();

        // categorical x-axis
        await component.update(
            <ChartTestStory
                data={{
                    title: {text: 'categorical x-axis'},
                    series: {
                        data: [{type: 'bar-x', name: '', data: points}],
                    },
                    xAxis: {type: 'category', categories: ['0', '1', '2']},
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Stacking percent', () => {
        test('Linear X-axis', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            stacking: 'percent',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: 10},
                                {x: 200, y: 70},
                            ],
                            dataLabels: {enabled: true},
                        },
                        {
                            type: 'bar-x',
                            stacking: 'percent',
                            name: 'Series 2',
                            data: [
                                {x: 1, y: 15},
                                {x: 200, y: 20},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                xAxis: {
                    type: 'linear',
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Initial height of the bars is less than 1px', async ({mount}) => {
            const chartData: ChartData = {
                legend: {enabled: false},
                series: {
                    data: [
                        {
                            name: 's2',
                            type: 'bar-x',
                            stacking: 'percent',
                            data: [
                                {
                                    y: 3,
                                    x: 1,
                                },
                            ],
                        },
                    ],
                },
                chart: {
                    margin: {
                        top: 50,
                    },
                },
            };
            const component = await mount(
                <ChartTestStory data={chartData} styles={{height: 100}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('With Y-axis plot lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithYAxisPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXStakingNormalData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal with logarithmic Y-axis', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 100},
                            {x: 2, y: 1000},
                        ],
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 5},
                            {x: 1, y: 50},
                            {x: 2, y: 500},
                        ],
                    },
                    {
                        name: 'Series 3',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 2},
                            {x: 1, y: 20},
                            {x: 2, y: 200},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['A', 'B', 'C'],
            },
            yAxis: [
                {
                    type: 'logarithmic',
                    startOnTick: true,
                    endOnTick: true,
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Logarithmic Y-axis with zero values in data', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 0},
                            {x: 1, y: 0},
                            {x: 2, y: 1},
                            {x: 3, y: 0},
                            {x: 4, y: 24},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    type: 'logarithmic',
                    startOnTick: true,
                    endOnTick: true,
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal with reverse data order', async ({mount}) => {
        const chartData = cloneDeep(barXStakingNormalData);
        set(chartData, 'series.options.bar-x.dataSorting.direction', 'desc');

        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal with zero y values', async ({mount}) => {
        // Leading zero segments intentionally leave a gap between the visible bar and
        // the axis. Preserve this separation for now; do not update the snapshot to remove it.
        const stacks = new Array(10).fill(null).map((_, index) => String(index));
        const chartData: ChartData = {
            title: {text: 'Chart title'},
            series: {
                data: stacks.map((stack, index) => {
                    return {
                        name: stack,
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                x: 0,
                                y: index === stacks.length - 1 ? 10 : 0,
                            },
                        ],
                    };
                }),
            },
            xAxis: {
                type: 'category',
                categories: ['Category'],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking small y values with and without stack gap', async ({mount}) => {
        const smallValuesSeriesData: BarXSeries[] = new Array(100).fill(null).map((_, index) => {
            return {
                name: String(index),
                type: 'bar-x',
                stacking: 'normal',
                data: [
                    {
                        x: 0,
                        y: 0.1,
                    },
                ],
            };
        });
        const chartData: ChartData = {
            series: {
                data: [
                    ...smallValuesSeriesData,
                    {
                        name: 'Series 1',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                x: 0,
                                y: 50,
                            },
                        ],
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                x: 0,
                                y: 50,
                            },
                        ],
                    },
                ],
                options: {
                    'bar-x': {
                        stackGap: 2,
                    },
                },
            },
            xAxis: {
                type: 'category',
                categories: ['Category'],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        await component.update(
            <ChartTestStory
                data={{
                    ...chartData,
                    series: {
                        ...chartData.series,
                        options: {
                            'bar-x': {
                                stackGap: 0,
                            },
                        },
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking positive and negative values', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Positive 1',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                y: 5,
                                x: 1,
                            },
                        ],
                    },
                    {
                        name: 'Positive 2',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                y: 5,
                                x: 1,
                            },
                        ],
                    },
                    {
                        name: 'Negative 1',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                y: -5,
                                x: 1,
                            },
                        ],
                    },
                    {
                        name: 'Negative 2',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {
                                y: -5,
                                x: 1,
                            },
                        ],
                    },
                ],
            },
        };

        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max-category', async ({mount}) => {
        const data = cloneDeep(barXStakingNormalData);
        set(data, 'xAxis.min', 5);
        set(data, 'xAxis.max', 10);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Data labels', () => {
        test('Labels for out-of-bounds points are hidden when min/max set on axes', async ({
            mount,
        }) => {
            const yValues = [
                12, 18, 9, 25, 31, 22, 14, 28, 35, 20, 16, 40, 33, 27, 19, 38, 29, 44, 36, 42,
            ];
            const chartData: ChartData = {
                series: {
                    data: [
                        generateSeriesData({
                            type: 'bar-x',
                            pointCount: 20,
                            generateY: (_x: number | string, i: number) => yValues[i],
                            overrides: {dataLabels: {enabled: true}},
                        }),
                    ],
                },
                xAxis: {type: 'linear', min: 4, max: 14},
                yAxis: [{min: 15, max: 35}],
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Overlapping html labels should not be displayed (by default)', async ({mount}) => {
            const longLabel = 'On seashore far a green oak towers ...';
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'bar-x',
                            data: [
                                {x: 1, y: 1, label: ''},
                                {x: 1.9, y: 2, label: longLabel},
                                {x: 2.1, y: 2, label: longLabel},
                                {x: 3, y: 3, label: ''},
                            ],
                            dataLabels: {enabled: true, html: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Null modes', () => {
        test.describe('Linear X-axis', () => {
            test('nullMode=skip', async ({mount}) => {
                const data = cloneDeep(barXNullModeSkipLinearXData);
                set(data, 'series.data[0].dataLabels', {enabled: true, inside: true});
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=zero', async ({mount}) => {
                const data = cloneDeep(barXNullModeZeroLinearXData);
                set(data, 'series.data[0].dataLabels', {enabled: true, inside: true});
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });

        test.describe('Category X-axis', () => {
            test('nullMode=skip', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={barXNullModeSkipCategoryXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=zero', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={barXNullModeZeroCategoryXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });

    test('Basic split', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXSplitData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking percent split', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXStackingPercentSplitData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Split with unevenly distributed data - the bar width should be the same for all plots', async ({
        page,
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-x',
                        data: [
                            {x: 2, y: 15},
                            {x: 3, y: 5},
                            {x: 4, y: 50},
                            {x: 5, y: 25},
                            {x: 10, y: 5},
                        ],
                        yAxis: 0,
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-x',
                        data: [{x: 1, y: 100}],
                        yAxis: 1,
                    },
                ],
            },
            split: {
                enable: true,
                gap: '40px',
                plots: [{title: {text: 'Plot title 1'}}, {title: {text: 'Plot title 2'}}],
            },
            yAxis: [
                {
                    plotIndex: 0,
                },
                {
                    plotIndex: 1,
                },
            ],
        };
        await page.setViewportSize({width: 200, height: 280});
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Single point', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-x',
                        data: [{y: 10, x: 10}],
                    },
                ],
            },
            yAxis: [{maxPadding: 0}],
            xAxis: {maxPadding: 0},
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Empty string category value should be displayed', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 100},
                            {x: 1, y: 150},
                            {x: 2, y: 50},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['', 'Category 2', 'Category 3'],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Tooltip', () => {
        test('Grouped series tooltip', async ({mount, page}) => {
            const component = await mount(<ChartTestStory data={barXGroupedColumnsData} />);
            const bars = component.locator('.gcharts-bar-x__segment');
            const tooltip = page.locator('.gcharts-tooltip');

            const box0 = await getLocatorBoundingBox(bars.nth(0));
            await page.mouse.move(
                Math.round(box0.x + box0.width / 2),
                Math.round(box0.y + box0.height / 2),
            );
            await expect(tooltip).toHaveScreenshot();

            const box1 = await getLocatorBoundingBox(bars.nth(1));
            await page.mouse.move(
                Math.round(box1.x + box1.width / 2),
                Math.round(box1.y + box1.height / 2),
            );
            await expect(tooltip).toHaveScreenshot();

            const box2 = await getLocatorBoundingBox(bars.nth(2));
            await page.mouse.move(
                Math.round(box2.x + box2.width / 2),
                Math.round(box2.y + box2.height / 2),
            );
            await expect(tooltip).toHaveScreenshot();
        });
    });

    test.describe('Annotations', () => {
        test('Basic placement', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series',
                            type: 'bar-x',
                            data: [
                                {
                                    x: 0,
                                    y: 20,
                                    annotation: {label: {text: 'Low'}},
                                },
                                {
                                    x: 1,
                                    y: 35,
                                    annotation: {label: {text: 'High'}},
                                },
                            ],
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: ['A', 'B'],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Custom styles', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series',
                            type: 'bar-x',
                            data: [
                                {x: 0, y: 10},
                                {
                                    x: 1,
                                    y: 25,
                                    annotation: {
                                        label: {
                                            text: 'Styled',
                                            style: {
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                fontColor: '#ffffff',
                                            },
                                        },
                                        popup: {
                                            backgroundColor: '#e74c3c',
                                            borderRadius: 12,
                                            offset: 10,
                                            padding: [8, 16],
                                        },
                                    },
                                },
                                {x: 2, y: 15},
                            ],
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: ['A', 'B', 'C'],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Annotation is not duplicated in range slider', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series',
                            type: 'bar-x',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 20},
                                {
                                    x: 2,
                                    y: 30,
                                    annotation: {label: {text: 'Annotated'}},
                                },
                                {x: 3, y: 25},
                                {x: 4, y: 15},
                            ],
                        },
                    ],
                },
                xAxis: {
                    rangeSlider: {enabled: true, defaultRange: {size: 3}},
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.getByText('Annotated')).toHaveCount(1);
        });
    });

    test.describe('Per-point tooltip.enabled', () => {
        test('hidden point in one series leaves only the other in the tooltip', async ({
            page,
            mount,
        }) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: 7},
                                {x: 2, y: 30, tooltip: {enabled: false}},
                            ],
                        },
                        {
                            type: 'bar-x',
                            name: 'Series 2',
                            data: [
                                {x: 1, y: 5},
                                {x: 2, y: 20},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            const bars = component.locator('.gcharts-bar-x__segment');
            const targetBar = bars.last();
            const position = await getLocatorBoundingBox(targetBar);
            await page.mouse.move(
                Math.round(position.x + position.width / 2),
                Math.round(position.y + position.height / 2),
            );
            const rows = page.locator('.gcharts-tooltip__content-row');
            await expect(rows).toHaveCount(1);
            await expect(rows.first()).toContainText('Series 2');
        });
    });

    test.describe('Per-point dataLabels.enabled', () => {
        test('hidden point in one series omits only that label', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: 7},
                                {x: 2, y: 30, dataLabels: {enabled: false}},
                                {x: 3, y: 12},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            const labels = component.locator('.gcharts-bar-x__label');
            await expect(labels).toHaveCount(2);
            const texts = await labels.allTextContents();
            expect(texts.slice().sort()).toEqual(['12', '7']);
        });
    });

    test.describe('Borders', () => {
        test('Grouped and per-series overrides', async ({mount}) => {
            const component = await mount(<ChartTestStory data={barXBordersData} />);
            await expect(component.locator('.gcharts-bar-x__segment-border')).toHaveCount(6);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        for (const stacking of ['normal', 'percent'] as const) {
            for (const stackGap of [0, 4]) {
                test(`${stacking} stacking with gap ${stackGap}`, async ({mount}) => {
                    const data = cloneDeep(barXBordersData);
                    Object.assign(data.series.data[2], {name: 'Top segment', borderWidth: 3});
                    data.series.data.forEach((series) => {
                        (series as BarXSeries).stacking = stacking;
                        (series as BarXSeries).stackLabels = {enabled: true};
                    });
                    data.series.options = {
                        'bar-x': {...data.series.options?.['bar-x'], stackGap},
                    };
                    const component = await mount(<ChartTestStory data={data} />);
                    const borders = component.locator('.gcharts-bar-x__segment-border');
                    await expect(borders).toHaveCount(9);
                    const bounds = await borders.evaluateAll((elements) =>
                        elements.map((element) => {
                            const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                            return {x, y, width, height};
                        }),
                    );
                    const firstStack = bounds.filter((box) => box.x === bounds[0].x);
                    for (let i = 1; i < firstStack.length; i++) {
                        expect(
                            firstStack[i - 1].y - firstStack[i].y - firstStack[i].height,
                        ).toBeCloseTo(stackGap);
                    }
                    if (stacking === 'percent') expect(firstStack[2].y).toBeCloseTo(0);
                    await expect(component.locator('svg')).toHaveScreenshot();
                });
            }
        }

        test('Negative and short segments preserve bounds', async ({mount}) => {
            const data: ChartData = {
                series: {
                    options: {
                        'bar-x': {
                            borderWidth: 3,
                            borderColor: '#283593',
                            borderRadius: 8,
                            stackGap: 4,
                        },
                    },
                    data: [
                        {
                            type: 'bar-x',
                            name: 'A',
                            stacking: 'normal',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: -10},
                                {x: 2, y: 0.05},
                                {x: 3, y: 0},
                                {x: 4, y: 8},
                            ],
                        },
                        {
                            type: 'bar-x',
                            name: 'B',
                            stacking: 'normal',
                            data: [
                                {x: 0, y: 5},
                                {x: 1, y: -5},
                                {x: 2, y: 0.1},
                                {x: 3, y: -0.1},
                                {x: 4, y: -6},
                            ],
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: ['Positive', 'Negative', 'Short', 'Zero', 'Mixed'],
                },
                yAxis: [{min: -15, max: 15, maxPadding: 0}],
            };
            const plain = cloneDeep(data);
            plain.series.options = {'bar-x': {...plain.series.options?.['bar-x'], borderWidth: 0}};
            const component = await mount(<ChartTestStory data={plain} />);
            const segments = component.locator('.gcharts-bar-x__segment');
            await expect(segments).toHaveCount(10);
            const bounds = await segments.evaluateAll((elements) =>
                elements.map((element) => {
                    const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                    return {x, y, width, height};
                }),
            );
            await component.update(<ChartTestStory data={data} />);
            const borders = component.locator('.gcharts-bar-x__segment-border');
            await expect(borders).toHaveCount(6);
            const borderedBounds = await borders.evaluateAll((elements) =>
                elements.map((element) => {
                    const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                    return {x, y, width, height};
                }),
            );
            expect(borderedBounds).toEqual(bounds.filter((box) => box.height > 6));
            const shortBounds = await segments.evaluateAll((elements) =>
                elements
                    .map((element) => {
                        const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                        return {x, y, width, height};
                    })
                    .filter((box) => box.height <= 6),
            );
            expect(shortBounds).toEqual(bounds.filter((box) => box.height <= 6));
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Dense bars ignore borders', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Dense',
                            borderWidth: 3,
                            data: Array.from({length: 100}, (_, x) => ({x, y: x + 1})),
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('.gcharts-bar-x__segment')).toHaveCount(100);
            await expect(component.locator('.gcharts-bar-x__segment-border')).toHaveCount(0);
        });

        test('Hover and inactive states restore point opacity', async ({mount, page}) => {
            const data = cloneDeep(barXBordersData);
            data.series.data = data.series.data.slice(0, 2);
            data.series.data[1].tooltip = {enabled: false};
            (data.series.data[0] as BarXSeries).data.forEach((point) => {
                point.opacity = 0.6;
            });
            data.series.options = {
                'bar-x': {
                    ...data.series.options?.['bar-x'],
                    states: {
                        hover: {enabled: true, brightness: 0.5},
                        inactive: {enabled: true, opacity: 0.2},
                    },
                },
            };
            data.tooltip = {enabled: true};
            const component = await mount(<ChartTestStory data={data} />);
            const fill = component.locator('.gcharts-bar-x__segment').first();
            const border = component.locator('.gcharts-bar-x__segment-border').first();
            await expect(border).toHaveAttribute('opacity', '0.6');
            const box = await fill.boundingBox();
            if (!box) throw new Error('Missing bar bounds');
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await expect(fill).not.toHaveAttribute('fill', '#90caf9');
            await expect(page.locator('.gcharts-tooltip')).toBeVisible();
            await expect(border).toHaveAttribute('fill', '#283593');
            await expect(border).toHaveAttribute('opacity', '0.6');
            await expect(
                component.locator('.gcharts-bar-x__segment-border').nth(1),
            ).toHaveAttribute('opacity', '0.2');
            await page.mouse.move(0, 0);
            await expect(fill).toHaveAttribute('fill', '#90caf9');
            await expect(fill).toHaveAttribute('opacity', '0.6');
            await expect(border).toHaveAttribute('opacity', '0.6');
        });

        test('Range slider preserves short bars without borders', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'A',
                            color: '#90caf9',
                            borderWidth: 3,
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 100},
                            ],
                        },
                    ],
                },
                xAxis: {type: 'linear', rangeSlider: {enabled: true}},
                yAxis: [{min: 0, max: 100}],
            };
            const component = await mount(<ChartTestStory data={data} />);
            const preview = component.locator('.gcharts-range-slider');
            await expect(component.locator('.gcharts-bar-x__segment-border')).toHaveCount(2);
            await expect(preview.locator('.gcharts-bar-x__segment-border')).toHaveCount(0);
            const previewBars = preview.locator('.gcharts-bar-x__segment');
            await expect(previewBars).toHaveCount(2);
            const shortBar = previewBars.first();
            await expect(shortBar).toHaveCSS('fill', 'rgb(144, 202, 249)');
            const height = await shortBar.evaluate(
                (element) => (element as SVGGraphicsElement).getBBox().height,
            );
            expect(height).toBeGreaterThan(0);
            expect(height).toBeLessThanOrEqual(6);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Cursor, tooltip and hover cover borders and short bars', async ({mount, page}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'A',
                            color: '#90caf9',
                            cursor: 'pointer',
                            borderWidth: 3,
                            data: [
                                {x: 0, y: 1},
                                {x: 1, y: 50},
                            ],
                        },
                    ],
                },
                xAxis: {type: 'category', categories: ['Short', 'Tall']},
                yAxis: [{min: 0, max: 100}],
            };
            const component = await mount(<ChartTestStory data={data} />);
            const borders = component.locator('.gcharts-bar-x__segment-border');
            await expect(borders).toHaveCount(1);
            const shortBar = component.locator('.gcharts-bar-x__segment').first();
            await expect(shortBar).toHaveCSS('fill', 'rgb(144, 202, 249)');
            const shortBox = await shortBar.boundingBox();
            if (!shortBox) throw new Error('Missing short bar bounds');
            await page.mouse.move(
                shortBox.x + shortBox.width / 2,
                shortBox.y + shortBox.height / 2,
            );
            await expect(shortBar).not.toHaveCSS('fill', 'rgb(144, 202, 249)');
            await page.mouse.move(0, 0);
            await expect(shortBar).toHaveCSS('fill', 'rgb(144, 202, 249)');
            for (const shape of [shortBar, borders.first()]) {
                const box = await shape.boundingBox();
                if (!box) throw new Error('Missing border bounds');
                const point = {x: box.x + box.width / 2, y: box.y + Math.min(1, box.height / 2)};
                await page.mouse.move(point.x, point.y);
                const cursor = await page.evaluate(({x, y}) => {
                    const target = document.elementFromPoint(x, y);
                    return target && getComputedStyle(target).cursor;
                }, point);
                expect(cursor).toBe('pointer');
                await expect(page.locator('.gcharts-tooltip')).toBeVisible();
            }
        });

        for (const reversed of [false, true]) {
            test(`Rounded ends of mixed stacks, reversed=${reversed}`, async ({mount}) => {
                const data: ChartData = {
                    series: {
                        options: {
                            'bar-x': {
                                borderWidth: 3,
                                borderRadius: 10,
                                borderColor: '#283593',
                                stackGap: 4,
                                stackLabels: {enabled: true},
                            },
                        },
                        data: [8, -6, 4, -3, 0, null].map((y, i) => ({
                            type: 'bar-x',
                            name: String(i),
                            stacking: 'normal',
                            data: [{x: 0, y}],
                        })),
                    },
                    xAxis: {type: 'category', categories: ['Mixed']},
                    yAxis: [{min: -15, max: 15, order: reversed ? 'reverse' : undefined}],
                };
                const component = await mount(<ChartTestStory data={data} />);
                const borders = component.locator('.gcharts-bar-x__segment-border');
                await expect(borders).toHaveCount(4);
                const corners = await borders.evaluateAll((elements) =>
                    elements.map((element) => {
                        const path = element as SVGPathElement;
                        const {x, y, height} = path.getBBox();
                        return {
                            top: path.isPointInFill(new DOMPoint(x + 0.5, y + 0.5)),
                            bottom: path.isPointInFill(new DOMPoint(x + 0.5, y + height - 0.5)),
                        };
                    }),
                );
                expect(corners.slice(0, 2)).toEqual([
                    {top: true, bottom: true},
                    {top: true, bottom: true},
                ]);
                expect(corners[2]).toEqual({top: reversed, bottom: !reversed});
                expect(corners[3]).toEqual({top: !reversed, bottom: reversed});
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        }
    });
});
