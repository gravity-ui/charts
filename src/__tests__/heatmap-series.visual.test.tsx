import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {heatmapNullModeSkipData, heatmapNullModeZeroData} from '../__stories__/__data__';

test.describe('Heatmap series', () => {
    test('nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={heatmapNullModeSkipData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={heatmapNullModeZeroData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
