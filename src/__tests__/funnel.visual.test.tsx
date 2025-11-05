import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {funnelBasicData, funnelContinuousLegendData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe.only('Funnel series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With continuous legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
