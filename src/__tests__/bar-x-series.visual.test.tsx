import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    barXBasicData,
    barXLinearData,
    barXStakingNormalData,
    barXWithYAxisPlotLinesData,
} from 'src/__stories__/__data__';
import type {BarXSeries, ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Bar-x series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear X-axis', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXLinearData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
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
});
