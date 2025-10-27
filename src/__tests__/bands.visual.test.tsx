import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    barXDatePlotBandsData,
    barXPlotBandsData,
    barXWithXAxisPlotBandsData,
    barXWithYLinearAxisPlotBandsData,
    barYPlotBandsData,
    lineDatetimePlotBandData,
} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Plot Bands', () => {
    test('Category Y Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYPlotBandsData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear Y Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithYLinearAxisPlotBandsData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Datetime Y Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineDatetimePlotBandData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear X Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXPlotBandsData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Datetime X Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXDatePlotBandsData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Category X Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithXAxisPlotBandsData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
