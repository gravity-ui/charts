import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {barYBasicData, barYPlotLinesData} from 'src/__stories__/__data__';
import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Bar-y series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With X-axis plot lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('X axis formatted labels', async ({mount}) => {
        const chartData: ChartData = {
            ...barYBasicData,
            xAxis: {
                labels: {
                    numberFormat: {
                        unit: 'k',
                    },
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
