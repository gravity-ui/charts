import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {scatterBasicData, scatterContinuousLegendData} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe('Scatter series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Continues legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With x null values', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [{y: 0, x: 1}],
                        name: '2022',
                        type: 'scatter',
                    },
                    {
                        data: [{y: 0, x: 2}],
                        name: '2023',
                        type: 'scatter',
                    },
                    {
                        // TODO: https://github.com/gravity-ui/charts/issues/28
                        // @ts-expect-error
                        data: [{y: 0, x: null}],
                        name: '2024',
                        type: 'scatter',
                    },
                ],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category with null values'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
        const legendItem = component.getByText('2024');
        await legendItem.click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With y null values', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [{y: 1, x: 0}],
                        name: '2022',
                        type: 'scatter',
                    },
                    {
                        data: [{y: 2, x: 0}],
                        name: '2023',
                        type: 'scatter',
                    },
                    {
                        // TODO: https://github.com/gravity-ui/charts/issues/28
                        // @ts-expect-error
                        data: [{y: null, x: 0}],
                        name: '2024',
                        type: 'scatter',
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['Category with null values'],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
        const legendItem = component.getByText('2024');
        await legendItem.click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
