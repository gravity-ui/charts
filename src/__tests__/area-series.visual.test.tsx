import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    areaBasicData,
    areaNullModeConnectCategoryXData,
    areaNullModeConnectLinearXData,
    areaNullModeSkipCategoryXData,
    areaNullModeSkipLinearXData,
    areaNullModeZeroCategoryXData,
    areaNullModeZeroLinearXData,
    areaSplitData,
    areaStakingNormalData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

import {generateSeriesData} from './__data__/utils';

test.describe('Area series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max-category', async ({mount}) => {
        const data = cloneDeep(areaStakingNormalData);
        set(data, 'xAxis.min', 5);
        set(data, 'xAxis.max', 10);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Null modes', () => {
        test.describe('Linear X-axis', () => {
            test('nullMode=connect', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={areaNullModeConnectLinearXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=skip', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={areaNullModeSkipLinearXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=zero', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={areaNullModeZeroLinearXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });

        test.describe('Category X-axis', () => {
            test('nullMode=connect', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={areaNullModeConnectCategoryXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=skip', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={areaNullModeSkipCategoryXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=zero', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={areaNullModeZeroCategoryXData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });

    test('Basic split', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaSplitData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Data labels', () => {
        const basicStackingData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {y: 10, x: 1},
                            {y: 20, x: 2},
                            {y: 15, x: 3},
                        ],
                        dataLabels: {enabled: true},
                    },
                    {
                        name: 'Series 2',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {y: 20, x: 1},
                            {y: 40, x: 2},
                            {y: 30, x: 3},
                        ],
                        dataLabels: {enabled: true},
                    },
                    {
                        name: 'Series 3',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {y: 50, x: 1},
                            {y: 60, x: 2},
                            {y: 70, x: 3},
                        ],
                        dataLabels: {enabled: true},
                    },
                ],
            },
        };

        test('Positioning of extreme point dataLabels', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series 1',
                            type: 'area',
                            data: [
                                {x: 0, y: 0, label: 'left-bottom'},
                                {y: 10, x: 10, label: 'right-top'},
                            ],
                            dataLabels: {enabled: true},
                        },
                        {
                            name: 'Series 2',
                            type: 'area',
                            data: [
                                {y: 10, x: 0, label: 'left-top'},
                                {y: 0, x: 10, label: 'right-bottom'},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
                xAxis: {maxPadding: 0},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Positioning in normal stacking', async ({mount}) => {
            const component = await mount(<ChartTestStory data={basicStackingData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Positioning in percent stacking', async ({mount}) => {
            const data = cloneDeep(basicStackingData);
            set(data, 'series.data[0].stacking', 'percent');
            set(data, 'series.data[1].stacking', 'percent');
            set(data, 'series.data[2].stacking', 'percent');
            const component = await mount(<ChartTestStory data={data} styles={{height: 300}} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

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
                            type: 'area',
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
                            type: 'area',
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

    test('Single point (with marker enabled)', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'area',
                        data: [{y: 10, x: 10, marker: {states: {normal: {enabled: true}}}}],
                    },
                ],
            },
            yAxis: [{maxPadding: 0}],
            xAxis: {maxPadding: 0},
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Two points with the same y value', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'area',
                        data: [
                            {x: 0, y: 10},
                            {y: 10, x: 10},
                        ],
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
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 0},
                            {
                                y: 5,
                                x: 1,
                            },
                        ],
                    },
                    {
                        name: 'Positive 2',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 0},
                            {
                                y: 5,
                                x: 1,
                            },
                        ],
                    },
                    {
                        name: 'Negative 1',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 0},
                            {
                                y: -5,
                                x: 1,
                            },
                        ],
                    },
                    {
                        name: 'Negative 2',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 0},
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

    test('Stacking with null values', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series1',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {
                                y: 10,
                                x: 1,
                            },
                            {
                                y: 5,
                                x: 2,
                            },
                            {
                                y: 10,
                                x: 3,
                            },
                            {
                                y: 7,
                                x: 4,
                            },
                        ],
                    },
                    {
                        name: 'Series2',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {
                                y: 10,
                                x: 1,
                            },
                            {
                                y: null,
                                x: 2,
                            },
                            {
                                y: 10,
                                x: 3,
                            },
                            {
                                y: 7,
                                x: 4,
                            },
                        ],
                    },
                    {
                        name: 'Series3',
                        type: 'area',
                        stacking: 'normal',
                        data: [
                            {
                                y: 10,
                                x: 1,
                            },
                            {
                                y: 5,
                                x: 2,
                            },
                            {
                                y: 10,
                                x: 3,
                            },
                            {
                                y: 7,
                                x: 4,
                            },
                        ],
                    },
                ],
            },
        };

        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
