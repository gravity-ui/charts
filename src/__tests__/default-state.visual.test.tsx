import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

test.describe('Default state', () => {
    test.describe('hoveredPosition', () => {
        test('number (pixels)', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series 1',
                            type: 'line',
                            data: [
                                {x: 1, y: 10},
                                {x: 2, y: 20},
                                {x: 3, y: 15},
                                {x: 4, y: 25},
                            ],
                        },
                    ],
                },
                defaultState: {
                    hoveredPosition: {x: 150, y: 150},
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        });

        test('string (percentages)', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series 1',
                            type: 'area',
                            data: [
                                {x: 1, y: 10},
                                {x: 2, y: 20},
                                {x: 3, y: 15},
                                {x: 4, y: 25},
                            ],
                        },
                    ],
                },
                defaultState: {
                    hoveredPosition: {x: '50%', y: '75%'},
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        });
    });
});
