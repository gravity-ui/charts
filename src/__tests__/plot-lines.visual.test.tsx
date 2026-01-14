import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import set from 'lodash/set';

import {
    areaSplitData,
    barXDatePlotLineData,
    barXWithYAxisPlotLinesData,
    barYDatetimePlotLineData,
    barYPlotLinesData,
    lineTwoYAxisData,
} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

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

    test('Should not render Y plot lines outside of plot area in case of split', async ({
        mount,
    }) => {
        const data = cloneDeep(areaSplitData);
        set(data, 'yAxis[1].plotLines', [{value: 250, color: 'red'}]);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('X-axis plot lines with split', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 1, y: 1},
                            {x: 2, y: 2},
                        ],
                        yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: 'Series 2',
                        data: [
                            {x: 1, y: 1},
                            {x: 2, y: 2},
                        ],
                        yAxis: 1,
                    },
                ],
            },
            split: {
                enable: true,
                gap: '40px',
                plots: [{}, {}],
            },
            yAxis: [{plotIndex: 0}, {plotIndex: 1}],
            xAxis: {
                plotLines: [{color: 'red', value: 1.5, label: {text: 'plot line label'}}],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
