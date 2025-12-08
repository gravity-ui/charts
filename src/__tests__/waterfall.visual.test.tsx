import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    waterfallBasicData,
    waterfallNullModeSkipData,
    waterfallNullModeZeroData,
} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, WaterfallSeriesData} from '../types';

test.describe('Waterfall series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Tooltip for the totals column', async ({page, mount}) => {
        page.setViewportSize({width: 450, height: 280});
        const component = await mount(<ChartTestStory data={waterfallBasicData} />);

        const totalColumn = component.locator('.gcharts-waterfall__segment').last();
        await expect(totalColumn).toBeVisible();
        await totalColumn.hover();

        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallNullModeSkipData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallNullModeZeroData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With multiple total columns', async ({mount}) => {
        const dataWithTotals: WaterfallSeriesData[] = [
            {x: 'A', y: 10},
            {x: 'Total1', y: 0, total: true},
            {x: 'D', y: 25},
            {x: 'Total2', y: 0, total: true},
        ];

        const waterfallDataWithTotals: ChartData = {
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Series',
                        data: dataWithTotals,
                        nullMode: 'skip',
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: dataWithTotals.map((d) => d.x) as string[],
            },
        };

        const component = await mount(<ChartTestStory data={waterfallDataWithTotals} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
