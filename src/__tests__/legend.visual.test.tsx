import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import range from 'lodash/range';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {pieHtmlLegendData} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe('Legend', () => {
    test.describe('Discrete', () => {
        test('Pagination svg', async ({mount}) => {
            const data: ChartData = {
                legend: {
                    enabled: true,
                    type: 'discrete',
                },
                series: {
                    data: [
                        {
                            type: 'pie',
                            dataLabels: {enabled: false},
                            data: range(1, 40).map((i) => ({
                                name: `Label ${i + 1}`,
                                value: i,
                            })),
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} styles={{width: '150px'}} />);
            await expect(component.locator('svg')).toHaveScreenshot();
            const arrowNext = component.getByText('▼');
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Pagination html', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={pieHtmlLegendData} styles={{width: '225px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
            const arrowNext = component.getByText('▼');
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
