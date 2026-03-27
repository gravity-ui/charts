import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

test.describe('Sankey series', () => {
    test('Basic', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'sankey',
                        name: 'Series 1',
                        data: [
                            {
                                name: 'A',
                                links: [
                                    {name: 'C', value: 10},
                                    {name: 'D', value: 5},
                                ],
                            },
                            {
                                name: 'B',
                                links: [
                                    {name: 'C', value: 3},
                                    {name: 'D', value: 8},
                                ],
                            },
                            {name: 'C', links: []},
                            {name: 'D', links: []},
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{height: 300, width: 500}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
