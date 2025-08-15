import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Sankey series', () => {
    test('Basic', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'sankey',
                        data: [
                            {
                                name: 'Source1',
                                links: [
                                    {
                                        name: 'Value1',
                                        value: 20,
                                    },
                                    {
                                        name: 'Value2',
                                        value: 30,
                                    },
                                ],
                            },
                            {
                                name: 'Source2',
                                links: [
                                    {
                                        name: 'Value2',
                                        value: 40,
                                    },
                                ],
                            },
                            {
                                name: 'Value1',
                                links: [],
                            },
                            {
                                name: 'Value2',
                                links: [],
                            },
                        ],
                        name: 'Sankey',
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
