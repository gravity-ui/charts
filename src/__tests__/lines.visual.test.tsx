import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    barXDatePlotLineData,
    barXWithYAxisPlotLinesData,
    barYDatetimePlotLineData,
    barYPlotLinesData,
} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Plot Lines', () => {
    test('Linear Y Plot Lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithYAxisPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Datetime Y Plot Lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYDatetimePlotLineData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear X Plot Lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Datetime X Plot Lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXDatePlotLineData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
