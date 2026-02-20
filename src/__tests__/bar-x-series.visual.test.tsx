import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    barXBasicData,
    barXLinearData,
    barXNullModeSkipCategoryXData,
    barXNullModeSkipLinearXData,
    barXNullModeZeroCategoryXData,
    barXNullModeZeroLinearXData,
    barXSplitData,
    barXStakingNormalData,
    barXWithYAxisPlotLinesData,
} from '../__stories__/__data__';
import type {BarXSeries, ChartData} from '../types';

import {generateSeriesData} from './__data__/utils';

test.describe('Bar-x series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear X-axis', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXLinearData} />);
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
        test('Linear X-axis ', async ({mount}) => {
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
    });

    test('With Y-axis plot lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithYAxisPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXStakingNormalData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal with zero y values', async ({mount}) => {
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
});
