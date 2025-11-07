import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {areaBasicData, areaStakingNormalData} from '../__stories__/__data__';

test.describe('Area series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max-category', async ({mount}) => {
        const data = cloneDeep(areaStakingNormalData);
        set(data, 'xAxis.min', 5);
        set(data, 'xAxis.max', 10);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Multiple series with different null modes', async ({mount}) => {
        const data = {
            series: {
                data: [
                    {
                        type: 'area' as const,
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
                        nullMode: 'skip' as const,
                    },
                    {
                        type: 'area' as const,
                        name: 'Connect mode',
                        data: [
                            {x: 0, y: 15},
                            {x: 1, y: null},
                            {x: 2, y: 15},
                            {x: 3, y: 35},
                            {x: 4, y: 30},
                            {x: 5, y: null},
                            {x: 6, y: 30},
                        ],
                        nullMode: 'connect' as const,
                    },
                    {
                        type: 'area' as const,
                        name: 'Zero mode',
                        data: [
                            {x: 0, y: null},
                            {x: 1, y: 30},
                            {x: 2, y: 10},
                            {x: 3, y: null},
                            {x: 4, y: 30},
                            {x: 5, y: 25},
                            {x: 6, y: null},
                        ],
                        nullMode: 'zero' as const,
                    },
                ],
            },
            xAxis: {
                type: 'category' as const,
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
