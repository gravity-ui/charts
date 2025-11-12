import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    waterfallBasicData,
    waterfallNullModeSkipData,
    waterfallNullModeZeroData,
} from 'src/__stories__/__data__';

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

    test('nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallNullModeSkipData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallNullModeZeroData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
