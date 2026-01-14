import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

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
});
