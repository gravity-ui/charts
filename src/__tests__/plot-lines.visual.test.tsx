import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import set from 'lodash/set';

import {
    barXDatePlotLineData,
    barXWithYAxisPlotLinesData,
    barYDatetimePlotLineData,
    barYPlotLinesData,
    lineTwoYAxisData,
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

    test('Should render plot lines for two y axis', async ({mount}) => {
        const data = cloneDeep(lineTwoYAxisData);
        merge(data, {
            yAxis: [
                {plotLines: [{value: -85.5, color: 'red', layerPlacement: 'after'}]},
                {plotLines: [{value: -23, color: 'purple', layerPlacement: 'after'}]},
            ],
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Should not render Y plot lines outside of plot area', async ({mount}) => {
        const data = cloneDeep(barXWithYAxisPlotLinesData);
        set(data, 'yAxis[0].plotLines', [
            {color: 'red', value: -10},
            {color: 'red', value: 500},
        ]);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Should not render X plot lines outside of plot area', async ({mount}) => {
        const data = cloneDeep(barYPlotLinesData);
        set(data, 'xAxis.plotLines', [
            {color: 'red', value: -10},
            {color: 'red', value: 500},
        ]);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
