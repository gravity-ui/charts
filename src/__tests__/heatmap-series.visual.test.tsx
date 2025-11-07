import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {heatmapBasicData} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe('Heatmap series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={heatmapBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Different null modes', () => {
        const heatmapData = [
            {x: 0, y: 0, value: 10},
            {x: 1, y: 0, value: null},
            {x: 2, y: 0, value: 30},
            {x: 0, y: 1, value: 25},
            {x: 1, y: 1, value: 35},
            {x: 2, y: 1, value: null},
            {x: 0, y: 2, value: null},
            {x: 1, y: 2, value: 40},
            {x: 2, y: 2, value: 20},
        ];

        test('Skip mode', async ({mount}) => {
            const data: ChartData = {
                title: {text: 'Skip mode (default)'},
                series: {
                    data: [
                        {
                            type: 'heatmap',
                            name: 'Series 1',
                            data: heatmapData,
                            nullMode: 'skip',
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: ['A', 'B', 'C'],
                },
                yAxis: [
                    {
                        type: 'category',
                        categories: ['Row 1', 'Row 2', 'Row 3'],
                    },
                ],
            };

            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Zero mode', async ({mount}) => {
            const data: ChartData = {
                title: {text: 'Zero mode'},
                series: {
                    data: [
                        {
                            type: 'heatmap',
                            name: 'Series 1',
                            data: heatmapData,
                            nullMode: 'zero',
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: ['A', 'B', 'C'],
                },
                yAxis: [
                    {
                        type: 'category',
                        categories: ['Row 1', 'Row 2', 'Row 3'],
                    },
                ],
            };

            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
