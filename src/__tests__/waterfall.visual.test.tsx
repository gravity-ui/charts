import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {waterfallBasicData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Waterfall series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Tooltip for the totals column', async ({page, mount}) => {
        page.setViewportSize({width: 500, height: 280});
        const data = cloneDeep(waterfallBasicData);
        set(data, 'tooltip.enabled', false);
        const component = await mount(<ChartTestStory data={data} />);

        const totalColumn = component.locator('.gcharts-waterfall__segment').last();
        await expect(totalColumn).toBeVisible();
        await totalColumn.hover();

        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
