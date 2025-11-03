import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import type {ChartData} from 'src/types';

import {ChartStory} from './ChartStory';

test.describe('Update chart', () => {
    test('Set new data with more categories on x-axis', async ({page, mount}) => {
        page.on('pageerror', (exception) => {
            throw exception;
        });

        const chartData: ChartData = {
            xAxis: {
                type: 'category',
                categories: ['1'],
            },
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [{x: 0, y: 10}],
                    },
                ],
            },
        };

        const updates: ChartData = {
            xAxis: {
                type: 'category',
                categories: new Array(10).fill(null).map((_, index) => String(index + 1)),
            },
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: new Array(10).fill(null).map((_, index) => ({x: index, y: 10})),
                    },
                ],
            },
        };

        const component = await mount(<ChartStory data={chartData} updates={updates} />);
        await expect(component.locator('svg')).toBeVisible();
        await component.locator('button').click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
