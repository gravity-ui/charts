import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {lineBasicData, lineTwoYAxisData} from 'src/__stories__/__data__';
import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

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

    test('Multiple series with different null modes', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Skip mode',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 20},
                            {x: 2, y: null},
                            {x: 3, y: 30},
                            {x: 4, y: null},
                            {x: 5, y: 15},
                            {x: 6, y: 25},
                        ],
                        nullMode: 'skip',
                    },
                    {
                        type: 'line',
                        name: 'Connect mode',
                        data: [
                            {x: 0, y: 15},
                            {x: 1, y: null},
                            {x: 2, y: 20},
                            {x: 3, y: 35},
                            {x: 4, y: 15},
                            {x: 5, y: null},
                            {x: 6, y: 30},
                        ],
                        nullMode: 'connect',
                    },
                    {
                        type: 'line',
                        name: 'Zero mode',
                        data: [
                            {x: 0, y: 20},
                            {x: 1, y: 30},
                            {x: 2, y: null},
                            {x: 3, y: 40},
                            {x: 4, y: null},
                            {x: 5, y: 25},
                            {x: 6, y: 35},
                        ],
                        nullMode: 'zero',
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        const skipModeLegend = component.getByText('Skip mode');
        await skipModeLegend.click();
        await expect(component.locator('svg')).toHaveScreenshot();

        const connectModeLegend = component.getByText('Connect mode');
        await connectModeLegend.click();
        await expect(component.locator('svg')).toHaveScreenshot();

        const zeroModeLegend = component.getByText('Zero mode');
        await zeroModeLegend.click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
