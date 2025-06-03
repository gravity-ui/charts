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
        const data = {
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
        } as ChartData;

        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('The second Y-axis', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineTwoYAxisData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    // TODO: take a screenshot and unskip the test
    test.skip('Vertical line tooltip', async ({mount}) => {
        const data = {
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
        } as ChartData;

        const component = await mount(<ChartTestStory data={data} />);
        component.hover();
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
