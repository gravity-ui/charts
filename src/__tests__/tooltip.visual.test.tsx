import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {tooltipOverflowedRowsData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Tooltip', () => {
    test('More points row', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const component = await mount(<ChartTestStory data={tooltipOverflowedRowsData} />);
        const bar = component.locator('.gcharts-bar-y').first();
        await bar.hover();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        await bar.click();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('More points row & totals', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const data = cloneDeep(tooltipOverflowedRowsData);
        set(data, 'tooltip.totals.enabled', true);
        const component = await mount(<ChartTestStory data={data} />);
        const bar = component.locator('.gcharts-bar-y').first();
        await bar.hover();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        await bar.click();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });
});
