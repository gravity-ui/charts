import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    lineBasicData,
    lineNullModeConnectLinearXData,
    lineNullModeSkipLinearXData,
    lineNullModeZeroLinearXData,
    lineTwoYAxisData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe('Line series', () => {
    test.beforeEach(async ({page}) => {
        // Cancel test with error when an uncaught exception happens within the page
        page.on('pageerror', (exception) => {
            throw exception;
        });
    });

    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Logarithmic Y axis', async ({mount}) => {
        const data: ChartData = {
            yAxis: [
                {
                    type: 'logarithmic',
                },
            ],
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line series',
                        data: [
                            {x: 10, y: 10},
                            {x: 20, y: 50},
                            {x: 30, y: 90},
                        ],
                    },
                ],
            },
        };

        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('The second Y-axis', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineTwoYAxisData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Vertical line tooltip', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line series',
                        data: [
                            {x: 10, y: 10},
                            {x: 10, y: 50},
                        ],
                    },
                ],
            },
        };

        const component = await mount(<ChartTestStory data={data} />);
        const line = component.locator('.gcharts-line');
        await line.hover({force: true, position: {x: 0, y: 0}});
        await expect(component.locator('svg')).toHaveScreenshot();
        const boundingBox = await line.boundingBox();
        // 20 - reserved space for point with marker
        const y = typeof boundingBox?.height === 'number' ? boundingBox.height - 20 : 0;
        await line.hover({force: true, position: {x: 0, y}});
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=connect', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineNullModeConnectLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineNullModeSkipLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineNullModeZeroLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Single point', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'line',
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

    test.describe('Data labels', () => {
        test('Positioning of extreme point dataLabels', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [
                                {x: 0, y: 0, label: 'left-bottom'},
                                {y: 10, x: 0, label: 'left-top'},
                                {y: 10, x: 10, label: 'right-top'},
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
    });
});
