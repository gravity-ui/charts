import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    areaBasicData,
    areaNullModeConnectLinearXData,
    areaNullModeSkipLinearXData,
    areaNullModeZeroLinearXData,
    areaSplitData,
    areaStakingNormalData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe.only('Area series', () => {
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

    test('x null values, nullMode=connect', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaNullModeConnectLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaNullModeSkipLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaNullModeZeroLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Basic split', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaSplitData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Data labels', () => {
        test('Positioning of extreme point dataLabels', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series 1',
                            type: 'area',
                            data: [
                                {x: 0, y: 0, label: 'left-bottom'},
                                {y: 10, x: 10, label: 'right-top'},
                            ],
                            dataLabels: {enabled: true},
                        },
                        {
                            name: 'Series 2',
                            type: 'area',
                            data: [
                                {y: 10, x: 0, label: 'left-top'},
                                {y: 0, x: 10, label: 'right-bottom'},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
                xAxis: {maxPadding: 0},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
