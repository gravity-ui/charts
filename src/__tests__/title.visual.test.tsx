import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

test.describe('Chart title', () => {
    test('Custom color title', async ({mount}) => {
        const chartData: ChartData = {
            title: {
                text: 'Chart title',
                style: {
                    fontColor: 'salmon',
                },
            },
            series: {
                data: [{type: 'scatter', name: 'Series 1', data: [{x: 1, y: 1}]}],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });
});
