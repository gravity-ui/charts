import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {barXBasicData, barXWithYAxisPlotLinesData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Bar-x series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With Y-axis plot lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithYAxisPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
