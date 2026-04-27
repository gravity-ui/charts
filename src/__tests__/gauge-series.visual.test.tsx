import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    gaugeBasicData,
    gaugeGradientData,
    gaugeNeedleData,
    gaugeSolidData,
} from '../__stories__/__data__';

test.describe('Gauge series', () => {
    test('Basic gauge: value=65, marker pointer, 3 thresholds, target=80', async ({mount}) => {
        const component = await mount(<ChartTestStory data={gaugeBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Needle pointer', async ({mount}) => {
        const component = await mount(<ChartTestStory data={gaugeNeedleData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Solid pointer', async ({mount}) => {
        const component = await mount(<ChartTestStory data={gaugeSolidData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Gradient track (continuous)', async ({mount}) => {
        const component = await mount(<ChartTestStory data={gaugeGradientData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
