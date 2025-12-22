import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import {
    barXDatePlotBandsData,
    barXPlotBandsData,
    barXWithXAxisPlotBandsData,
    barXWithXAxisPlotBandsInfinityData,
    barXWithYLinearAxisPlotBandsData,
    barXWithYLinearAxisPlotBandsInfinityData,
    barYPlotBandsData,
    barYWithXLinearAxisPlotBandsInfinityData,
    barYWithYAxisPlotBandsInfinityData,
    lineDatetimePlotBandData,
    lineTwoYAxisData,
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

    test('Linear Y Infinity Plot Bands', async ({mount}) => {
        const component = await mount(
            <ChartTestStory data={barXWithYLinearAxisPlotBandsInfinityData} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Category X Infinity Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXWithXAxisPlotBandsInfinityData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Category Y Infinity Plot Bands', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYWithYAxisPlotBandsInfinityData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linear X Infinity Plot Bands', async ({mount}) => {
        const component = await mount(
            <ChartTestStory data={barYWithXLinearAxisPlotBandsInfinityData} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Should render plot bands for two y axis', async ({mount}) => {
        const data = cloneDeep(lineTwoYAxisData);
        merge(data, {
            yAxis: [
                {
                    plotBands: [
                        {from: -87, to: -86, color: 'red', opacity: 0.5, layerPlacement: 'after'},
                    ],
                },
                {
                    plotBands: [
                        {
                            from: -26,
                            to: -24,
                            color: 'purple',
                            opacity: 0.5,
                            layerPlacement: 'after',
                        },
                    ],
                },
            ],
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
