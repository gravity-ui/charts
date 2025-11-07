import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {waterfallBasicData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

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

    test.describe('Different null modes', () => {
        const waterfallData = [
            {x: 'Jan', y: 150},
            {x: 'Feb', y: null},
            {x: 'Mar', y: -50},
            {x: 'Apr', y: 80},
            {x: 'May', y: null},
            {x: 'Jun', y: -30},
            {x: 'Total', y: 0, total: true},
        ];

        test('Skip mode', async ({mount}) => {
            const data = {
                title: {text: 'Skip mode (default)'},
                series: {
                    data: [
                        {
                            type: 'waterfall' as const,
                            name: 'Budget',
                            data: waterfallData,
                            nullMode: 'skip' as const,
                        },
                    ],
                },
                xAxis: {
                    type: 'category' as const,
                    categories: waterfallData.map((d) => d.x),
                },
            };

            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Zero mode', async ({mount}) => {
            const data = {
                title: {text: 'Zero mode'},
                series: {
                    data: [
                        {
                            type: 'waterfall' as const,
                            name: 'Budget',
                            data: waterfallData,
                            nullMode: 'zero' as const,
                        },
                    ],
                },
                xAxis: {
                    type: 'category' as const,
                    categories: waterfallData.map((d) => d.x),
                },
            };

            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
