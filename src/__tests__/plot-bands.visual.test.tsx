import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

const sizedBandsBaseData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series',
                data: Array.from({length: 11}, (_, i) => ({x: i, y: 10 + i * 5})),
            },
        ],
    },
};

test.describe('Plot bands', () => {
    test('X-axis plot bands with split', async ({mount}) => {
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
                plotBands: [{color: 'red', from: 1.25, to: 1.5, label: {text: 'plot band label'}}],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('X axis sized band, 40px, default align (start = bottom)', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...sizedBandsBaseData,
                    xAxis: {
                        plotBands: [{color: 'red', from: 2, to: 5, size: 40}],
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('X axis sized band, "25%", align "end" (top)', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...sizedBandsBaseData,
                    xAxis: {
                        plotBands: [{color: 'red', from: 2, to: 5, size: '25%', align: 'end'}],
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y axis sized band on left axis, 40px, align "start" (left)', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...sizedBandsBaseData,
                    yAxis: [
                        {
                            plotBands: [{color: 'red', from: 20, to: 40, size: 40}],
                        },
                    ],
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y axis sized band on left axis, "30%", align "end" (right)', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...sizedBandsBaseData,
                    yAxis: [
                        {
                            plotBands: [
                                {color: 'red', from: 20, to: 40, size: '30%', align: 'end'},
                            ],
                        },
                    ],
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y axis sized band on right axis, 40px, align "start" (right)', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...sizedBandsBaseData,
                    yAxis: [
                        {
                            position: 'right',
                            plotBands: [{color: 'red', from: 20, to: 40, size: 40}],
                        },
                    ],
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
