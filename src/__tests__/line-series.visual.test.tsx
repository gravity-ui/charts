import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Line series with logarithmic Y axis', () => {
    test('Basic', async ({page, mount}) => {
        page.on('pageerror', (exception) => {
            throw exception;
        });

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
});
