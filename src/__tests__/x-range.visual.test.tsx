import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {xRangeBasicData, xRangeContinuousLegendData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

import {getLocatorBoundingBox} from './utils';

test.describe('X-Range series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={xRangeBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Tooltip', async ({mount, page}) => {
        const component = await mount(<ChartTestStory data={xRangeBasicData} />);
        const segment = component.locator('.gcharts-x-range__segment').first();
        const box = await getLocatorBoundingBox(segment);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Continuous legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={xRangeContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
