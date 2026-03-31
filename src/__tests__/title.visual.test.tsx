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

    test('Long title truncated with ellipsis', async ({mount}) => {
        const chartData: ChartData = {
            title: {
                text: 'This is a very long chart title that should be truncated with an ellipsis when it does not fit in a single line',
            },
            series: {
                data: [{type: 'line', name: 'Series 1', data: [{x: 1, y: 1}]}],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('Multiline title (2 rows)', async ({mount}) => {
        const chartData: ChartData = {
            title: {
                text: 'This is a very long chart title that should wrap to a second line when it does not fit in one row',
                maxRowCount: 2,
            },
            series: {
                data: [{type: 'line', name: 'Series 1', data: [{x: 1, y: 1}]}],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('Title stays within chart bounds considering top/left/right margins', async ({mount}) => {
        const chartData: ChartData = {
            chart: {
                margin: {top: 10, left: 50, right: 30},
            },
            title: {
                text: 'Chart title',
            },
            series: {
                data: [{type: 'scatter', name: 'Series 1', data: [{x: 1, y: 1}]}],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });
});
