import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {scatterBasicData, scatterContinuousLegendData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Scatter series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Continues legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
